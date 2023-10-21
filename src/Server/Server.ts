import WebSocket from 'ws';
import { WorldMap, Tile, Player, getRandomFromArray } from '@core/index.js';
import type { ClientAction, PlayerState } from './types';

export class Server {
  map: WorldMap;
  worldSize: number;

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

  tick() {
    this.tickCount += 1;
    this.processMovement();
  }

  processMovement() {
    for (let clientId in this.wsClients) {
      try {
        if (this.wsClients[clientId] && this.players[clientId] && this.playersStates[clientId] && this.playersStates[clientId].pressedKey) {
          let possible = false;

          switch (this.playersStates[clientId].pressedKey) {
            case 'Up':
              possible = this.map.isMovePossible(this.players[clientId].position.x, this.players[clientId].position.y - 1);

              if (possible) {
                this.players[clientId].position.y = this.players[clientId].position.y - 1;
              }
              break;

            case 'Down':
              possible = this.map.isMovePossible(this.players[clientId].position.x, this.players[clientId].position.y + 1);

              if (possible) {
                this.players[clientId].position.y = this.players[clientId].position.y + 1;
              }
              break;

            case 'Left':
              possible = this.map.isMovePossible(this.players[clientId].position.x - 1, this.players[clientId].position.y);

              if (possible) {
                this.players[clientId].position.x = this.players[clientId].position.x - 1;
              }
              break;

            case 'Right':
              possible = this.map.isMovePossible(this.players[clientId].position.x + 1, this.players[clientId].position.y);

              if (possible) {
                this.players[clientId].position.x = this.players[clientId].position.x + 1;
              }
              break;

            default:
              break;
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        this.wsClients[clientId].send(JSON.stringify({
          message: {
            type: 'sync-players',
            players: Object.fromEntries(Object.entries(this.players).map(([k, v]) => [k, v.serialize()])),
            playersState: this.playersStates,
          }
        }));

        this.wsClients[clientId].send(JSON.stringify({
          message: {
            type: 'player-pos',
            playerPosition: this.players[clientId]?.position || { x: 0, y: 0 }
          }
        }));
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
      const clientId = Date.now().toString();
      this.wsClients[clientId] = client;

      console.log(`INFO: WS: New connection, clientId = ${clientId}`);

      client.addEventListener('message', (rawMessage) => {
        try {
          const action = JSON.parse(rawMessage.data.toString());
          this.routeClientActions(clientId, action);
        } catch (error) {
          client.send(JSON.stringify({ error: error.toString() }));
        }
      });

      client.addEventListener('close', () => {
        console.log(`INFO: WS: Close connection, clientId = ${clientId}`);

        this.routeClientActions(clientId, { action: 'close' });
      });
    });
  }

  routeClientActions(clientId: string, message: ClientAction) {
    const client = this.wsClients[clientId];
    const player = this.players[clientId];
    const playerState = this.playersStates[clientId];
    const { action } = message;
    
    if (action !== 'ping') {
      console.log({ clientId, action });
    }

    switch (action) {
      case 'ping':
        client.send(JSON.stringify({ message: { type: 'ping', delta: Date.now() - message.payload.sendTime } }));
        break;

      case 'login':
        const position = this.map.getRandomFreePosition();
        const player = new Player();
        player.nickname = message.payload.nickname;
        player.clientId = clientId;
        player.position = { x: position[0], y: position[1] };
        this.players[clientId] = player;
        this.playersStates[clientId] = { pressedKey: null };

        client.send(JSON.stringify({ message: { type: 'login', player: player.serialize() } }));
        break;

      case 'keyboard':
        const { payload } = message;
        if (payload.type === 'up') {
          playerState.pressedKey = null;
        } else {
          playerState.pressedKey = payload.key;
        }

        client.send(JSON.stringify({ message: { type: 'keyboard', text: 'ok' } }));
        break;

      case 'mouse':
        break;

      case 'sync-players':
        client.send(JSON.stringify({
          message: {
            type: 'sync-players',
            players: Object.fromEntries(Object.entries(this.players).map(([k, v]) => [k, v.serialize()])),
            playersState: this.playersStates,
          }
        }));
        break;

      case 'sync-map':
        client.send(JSON.stringify({
          message: {
            type: 'sync-map',
            map: this.map.serialize(),
          }
        }));
        break;

      case 'close':
        delete this.players[clientId];
        delete this.playersStates[clientId];
        break;

      default:
        client.send(JSON.stringify({ error: `Unknown action ${action}` }));
    }
  }
}
