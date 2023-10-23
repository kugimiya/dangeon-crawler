import WebSocket from 'ws';
import { WorldMap, Player, Tile, Cell, GameObject, Inventory, GameObjectType, InventoryCellType, InventoryItemType, getRandomFromArray, inventoryItems, itemTypeMap } from '@core/index.js';
import type { ServerAction, PlayerState, ClientAction } from './types';
import zlib from 'node:zlib';
import { nanoid } from 'nanoid';

export class Server {
  map: WorldMap;
  worldSize: number;

  gameObjects: Record<string, GameObject> = {};
  inventories: Record<string, Inventory> = {};

  players: Record<string, Player> = {};
  playersStates: Record<string, PlayerState> = {};
  ws: WebSocket.Server;
  wsClients: Record<string, WebSocket> = {};

  tickCount: number = 0;
  ticksPerSecond: number = 20;
  tickIntervalPtr: NodeJS.Timer;

  lastMovementTime = Date.now();
  movementDuration = 0;

  constructor(worldSize: number) {
    this.worldSize = worldSize;
    this.map = new WorldMap(worldSize);
    this.map.generate();
  }

  sendClientAction(clientId: string, action: ClientAction) {
    zlib.deflate(JSON.stringify(action), (err, result) => {
      this.wsClients[clientId].send(result);
    });
  }

  tick() {
    this.tickCount += 1;
    try {
      this.processMovement();
      this.processClick();
    } catch {
      //
    }
  }

  processClick() {
    for (let clientId in this.wsClients) {
      if (this.playersStates[clientId].clickAt?.when) {
        const { x, y, when } = this.playersStates[clientId].clickAt;

        if (when + 500 < Date.now()) {
          if (this.map.map[x][y].type !== Cell.road) {
            console.log(`register destroy wall at [${x}, ${y}]`)

            this.map.map[x][y].type = Cell.road;
            this.map.map[x][y].tile = Tile.road;

            const count = getRandomFromArray([1, 2, 4, 8]);
            const item = getRandomFromArray(inventoryItems);
            this.inventories[this.players[clientId].inventoryId].put(count, item);

            this.sendClientAction(clientId, {
              message: {
                type: 'notify',
                text: `Вы сломали [wall]`
              }
            });

            this.sendClientAction(clientId, {
              message: {
                type: 'notify',
                text: `Вы получили ${count} [${itemTypeMap[item]}]`
              }
            });            

            for (let __clientId in this.wsClients) {
              this.sendClientAction(__clientId, {
                message: {
                  type: 're-sync-map',
                  diffs: [
                    { x, y, cell: this.map.map[x][y] },
                  ],
                }
              });

              this.sendClientAction(__clientId, {
                message: {
                  type: 'sync-inventories',
                  data: Object.fromEntries(Object.entries(this.inventories).map(([k, v]) => [k, v.cells])),
                }
              });
            }
          }

          this.playersStates[clientId].clickAt = null;
        }
      }
    }
  }

  processMovement() {
    for (let clientId in this.wsClients) {
      let positionChanged = false;

      try {
        if (this.wsClients[clientId] && this.players[clientId] && this.playersStates[clientId] && this.playersStates[clientId].pressedKey) {
          let possible = false;

          switch (this.playersStates[clientId].pressedKey) {
            case 'Up':
              possible = this.map.isMovePossible(this.players[clientId].position.x, this.players[clientId].position.y - 1);

              if (possible) {
                this.players[clientId].position.y = this.players[clientId].position.y - 1;
                positionChanged = true;
              }
              break;

            case 'Down':
              possible = this.map.isMovePossible(this.players[clientId].position.x, this.players[clientId].position.y + 1);

              if (possible) {
                this.players[clientId].position.y = this.players[clientId].position.y + 1;
                positionChanged = true;
              }
              break;

            case 'Left':
              possible = this.map.isMovePossible(this.players[clientId].position.x - 1, this.players[clientId].position.y);

              if (possible) {
                this.players[clientId].position.x = this.players[clientId].position.x - 1;
                positionChanged = true;
              }
              break;

            case 'Right':
              possible = this.map.isMovePossible(this.players[clientId].position.x + 1, this.players[clientId].position.y);

              if (possible) {
                this.players[clientId].position.x = this.players[clientId].position.x + 1;
                positionChanged = true;
              }
              break;

            default:
              break;
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        if (positionChanged) {
          for (let __clientId in this.wsClients) {
            this.sendClientAction(__clientId, {
              message: {
                type: 'sync-players',
                players: Object.fromEntries(Object.entries(this.players).map(([k, v]) => [k, v.serialize()])),
                playersState: this.playersStates,
              }
            });
          }

          this.sendClientAction(clientId, {
            message: {
              type: 'player-pos',
              playerPosition: this.players[clientId]?.position || { x: 0, y: 0 }
            }
          });
        }
      }
    }
  }

  tickingStart() {
    this.tickIntervalPtr = setInterval(() => this.tick(), 1000 / this.ticksPerSecond);
  }

  tickingStop() {
    clearInterval(this.tickIntervalPtr);
  }

  listen(port: number) {
    this.ws = new WebSocket.Server({ port, host: '0.0.0.0' });
    console.log(`INFO: WS: Start WebSocket-server at 0.0.0.0:${port}`);

    this.ws.addListener('connection', (client) => {
      const clientId = nanoid(8);
      this.wsClients[clientId] = client;

      console.log(`INFO: WS: New connection, clientId = ${clientId}`);

      client.addEventListener('message', (rawMessage) => {
        try {
          const action = JSON.parse(rawMessage.data.toString());
          this.routeClientActions(clientId, action);
        } catch (error) {
          this.sendClientAction(clientId, { error: error.toString() });
        }
      });

      client.addEventListener('close', () => {
        console.log(`INFO: WS: Close connection, clientId = ${clientId}`);
        this.routeClientActions(clientId, { action: 'close' });
      });
    });
  }

  routeClientActions(clientId: string, message: ServerAction) {
    const client = this.wsClients[clientId];
    const player = this.players[clientId];
    const playerState = this.playersStates[clientId];
    const { action } = message;

    switch (action) {
      case 'ping':
        this.sendClientAction(clientId, { message: { type: 'ping', delta: Date.now() - message.payload.sendTime } });
        break;

      case 'login':
        const position = this.map.getRandomFreePosition();
        const player = new Player();
        const inv = new Inventory();
        player.nickname = message.payload.nickname;
        player.clientId = clientId;
        player.position = { x: position[0], y: position[1] };
        this.players[clientId] = player;
        this.players[clientId].inventoryId = inv.id;
        this.playersStates[clientId] = { pressedKey: null, clickAt: null };
        this.inventories[inv.id] = inv;

        this.inventories[inv.id].cells.push({
          type: InventoryCellType.item,
          itemType: InventoryItemType.toolSword
        });

        this.inventories[inv.id].cells.push({
          type: InventoryCellType.item,
          itemType: InventoryItemType.toolPickaxe
        });

        this.inventories[inv.id].cells.push({
          type: InventoryCellType.item,
          itemType: InventoryItemType.stone,
          count: 32
        });

        this.sendClientAction(clientId, { message: { type: 'login', player: player.serialize() } });
        break;

      case 'keyboard':
        if (message.payload.type === 'up') {
          playerState.pressedKey = null;
        } else {
          playerState.pressedKey = message.payload.key;
        }

        this.sendClientAction(clientId, { message: { type: 'keyboard', text: 'ok' } });
        break;

      case 'mouse':
        if (message.payload.type === 'down') {
          this.playersStates[clientId].clickAt = { x: message.payload.x, y: message.payload.y, when: Date.now() };
        } else {
          this.playersStates[clientId].clickAt = null;
        }
        break;

      case 'sync-players':
        this.sendClientAction(clientId, {
          message: {
            type: 'sync-players',
            players: Object.fromEntries(Object.entries(this.players).map(([k, v]) => [k, v.serialize()])),
            playersState: this.playersStates,
          }
        });
        break;

      case 'sync-player-pos':
        this.sendClientAction(clientId, {
          message: {
            type: 'player-pos',
            playerPosition: this.players[clientId]?.position || { x: 0, y: 0 }
          }
        });
        break;

      case 'sync-map':
        this.sendClientAction(clientId, {
          message: {
            type: 'sync-map',
            map: {
              size: this.map.size,
              map: this.map.map,
            },
          }
        });
        break;

      case 'sync-inventories':
        this.sendClientAction(clientId, {
          message: {
            type: 'sync-inventories',
            data: Object.fromEntries(Object.entries(this.inventories).map(([k, v]) => [k, v.cells])),
          }
        });
        break;

      case 'sync-game-objects':
        this.sendClientAction(clientId, {
          message: {
            type: 'sync-game-objects',
            data: Object.fromEntries(Object.entries(this.gameObjects).map(([k, v]) => [k, v.serialize()])),
          }
        });
        break;

      case 'close':
        delete this.players[clientId];
        delete this.playersStates[clientId];
        delete this.wsClients[clientId];
        break;

      default:
        this.sendClientAction(clientId, { error: `Unknown action ${action}` });
        break;
    }
  }
}
