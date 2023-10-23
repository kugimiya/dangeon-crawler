import 'module-alias/register';

import prompt from 'electron-prompt';
import WebSocket from 'ws';
import { WorldMap, Player } from '@core/index.js';
import { WorldPainter } from '@client/index.js';
import type { ClientAction, ServerAction } from '@server/types';
import zlib from 'node:zlib';

let map: WorldMap;
let painter: WorldPainter;
let players: Record<string, Player> = {};
const getPlayers = () => players;
let ws: WebSocket;
const player = new Player();

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d');

  appendKeyboardEvents();
  appendMouseEvents();
  appendWindowResizeEvents();

  main().then(() => {
    setInterval(() => {
      if (painter) {
        painter.draw(context, (id) => document.getElementById(id), getPlayers());
      }
    }, Math.round(1000 / 60));
  });
});

async function main() {
  const nickname = await prompt({
    title: 'Welcome to dungeon crossing!',
    label: 'Enter ur nickname',
    type: 'input',
    value: 'Player'
  }) || 'Player';

  player.nickname = nickname;

  const host = await prompt({
    title: 'Welcome to dungeon crossing!',
    label: 'Enter host',
    type: 'input',
    value: 'ws://0.0.0.0:9000'
  }) || 'ws://0.0.0.0:9000';

  ws = new WebSocket(host);

  ws.on('message', (message) => {
    try {
      // @ts-ignore
      const uncompressed = zlib.inflateSync(message);
      const data = JSON.parse(uncompressed.toString()) as ClientAction;

      if (data.error) {
        console.error(data.error);
        return;
      }

      if (!data.message) {
        return;
      }

      switch (data.message.type) {
        case 'ping':
          painter.lastPing = data.message.delta;
          break;

        case 'login':
          player.clientId = data.message.player.clientId;
          player.position = data.message.player.position;
          break;

        case 'sync-map':
          map = new WorldMap(data.message.map.size);
          map.map = data.message.map.map;
          console.log(message.toString().length);
          painter = new WorldPainter(map, 32, 1280, 768, player);
          break;

        case 're-sync-map':
          map.map = data.message.map.map;
          break;

        case 'sync-players':
          players = Object.fromEntries(Object.entries(data.message.players as Record<string, Player>).map(([key, plRaw]) => {
            const pl = new Player();
            pl.clientId = plRaw.clientId;
            pl.nickname = plRaw.nickname;
            pl.position = plRaw.position;
            pl.pointer = plRaw.pointer;
            return [key, pl];
          }) || []);
          break;

        case 'player-pos':
          if (data.message.playerPosition.x !== player.position.x || data.message.playerPosition.y !== player.position.y) {
            player.hasMovement = true;
          } else {
            player.hasMovement = false;
          }

          const { x, y } = data.message.playerPosition;

          player.position.x = x;
          player.position.y = y;
          break;

        default:
          console.log(data.message);
      }
    } catch {
      //
    }
  });

  ws.on('open', () => {
    ws.send(JSON.stringify({ action: 'login', payload: { nickname: player.nickname } } as ServerAction));
    ws.send(JSON.stringify({ action: 'sync-map' } as ServerAction));

    setInterval(() => {
      ws.send(JSON.stringify({ action: 'ping', payload: { sendTime: Date.now() } } as ServerAction));
    }, 1000);
  });
}

function appendKeyboardEvents() {
  let keydowned = false;
  window.addEventListener('keydown', (e) => {
    if (keydowned) {
      return;
    }

    keydowned = true;

    if (e.key === 'ArrowLeft' || e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф') {
      ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'down', key: 'Left' } } as ServerAction));
    }

    if (e.key === 'ArrowRight' || e.key === 'D' || e.key === 'd' || e.key === 'В' || e.key === 'в') {
      ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'down', key: 'Right' } } as ServerAction));
    }

    if (e.key === 'ArrowUp' || e.key === 'W' || e.key === 'w' || e.key === 'Ц' || e.key === 'ц') {
      ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'down', key: 'Up' } } as ServerAction));
    }

    if (e.key === 'ArrowDown' || e.key === 'S' || e.key === 's' || e.key === 'Ы' || e.key === 'ы') {
      ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'down', key: 'Down' } } as ServerAction));
    }

    if (e.key === 'l') {
      painter.toggleGlobalLight();
    }
  });

  window.addEventListener('keyup', (e) => {
    keydowned = false;

    if (e.key === 'ArrowLeft' || e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф') {
      ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'up', key: null } } as ServerAction));
    }

    if (e.key === 'ArrowRight' || e.key === 'D' || e.key === 'd' || e.key === 'В' || e.key === 'в') {
      ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'up', key: null } } as ServerAction));
    }

    if (e.key === 'ArrowUp' || e.key === 'W' || e.key === 'w' || e.key === 'Ц' || e.key === 'ц') {
      ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'up', key: null } } as ServerAction));
    }

    if (e.key === 'ArrowDown' || e.key === 'S' || e.key === 's' || e.key === 'Ы' || e.key === 'ы') {
      ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'up', key: null } } as ServerAction));
    }
  });
}

function appendWindowResizeEvents() {
  window.addEventListener('resize', (e) => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    canvas.width = window.innerWidth || 1280;
    canvas.height = window.innerHeight || 768;

    console.log(canvas.width, canvas.height);

    if (painter) {
      painter.windowWidth = window.innerWidth || 1280;
      painter.windowHeight = window.innerHeight || 768;
    }
  });
}

function appendMouseEvents() {
  window.addEventListener('wheel', (e) => {
    const dir = e.deltaY > 0 ? 'up' : 'down';

    if (dir === 'up') {
      painter.tileSize = Math.max(4, painter.tileSize - 8);
    } else {
      painter.tileSize = Math.min(64, painter.tileSize + 8);
    }
  });

  let mousepressed = false;
  window.addEventListener('mousemove', (e) => {
    player.pointer.x = e.clientX;
    player.pointer.y = e.clientY;

    if (mousepressed) {
      const { pointerWorldX, pointerWorldY } = painter.getPointerCordsInWorld();
      ws.send(JSON.stringify({ action: 'mouse', payload: { type: 'down', x: pointerWorldX, y: pointerWorldY } } as ServerAction));
    }
  });

  window.addEventListener('mousedown', (e) => {
    mousepressed = true;
    const { pointerWorldX, pointerWorldY } = painter.getPointerCordsInWorld();
    ws.send(JSON.stringify({ action: 'mouse', payload: { type: 'down', x: pointerWorldX, y: pointerWorldY } } as ServerAction));
  });

  window.addEventListener('mouseup', (e) => {
    mousepressed = false;
    ws.send(JSON.stringify({ action: 'mouse', payload: { type: 'up', x: 0, y: 0 } } as ServerAction));
  });
}
