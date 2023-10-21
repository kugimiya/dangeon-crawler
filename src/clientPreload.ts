import 'module-alias/register';

import WebSocket from 'ws';
import { WorldMap, Player } from '@core/index.js';
import { WorldPainter } from '@client/index.js';
import type { ClientAction } from '@server/types';

let map: WorldMap;
let painter: WorldPainter;
let players: Record<string, Player> = {};
const getPlayers = () => players;
const player = new Player();

const tileSize = 32;

const ws = new WebSocket('ws://0.0.0.0:9000');

ws.on('message', (message) => {
  const data = JSON.parse(message.toString());

  if (data.error) {
    console.error(data.error);
    return;
  }

  if (!data.message) {
    return;
  }

  switch (data.message.type) {
    case 'login':
      player.clientId = data.message.player.clientId;
      player.position = data.message.player.position;
      break;

    case 'sync-map':
      map = new WorldMap(data.message.map.size);
      map.tiles = data.message.map.tiles;
      painter = new WorldPainter(map, tileSize, 1280, 768, player);
      break;

    case 'sync-players':
      console.log(data.message)
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
        console.log(data.message.playerPosition);
      }
      const { x, y } = data.message.playerPosition;
      player.position.x = x;
      player.position.y = y;
      break;

    default:
      console.log(data.message);
  }
});

ws.on('open', () => {
  ws.send(JSON.stringify({ action: 'login', payload: { nickname: player.nickname } } as ClientAction));
  ws.send(JSON.stringify({ action: 'sync-map' } as ClientAction));

  setInterval(() => {
    ws.send(JSON.stringify({ action: 'ping', payload: { sendTime: Date.now() } } as ClientAction));
  }, 1000);
});

window.addEventListener('DOMContentLoaded', () => {
  const $canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const context = $canvas.getContext('2d');

  setInterval(() => {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 1280, 768);

    if (painter) {
      painter.draw(context, getPlayers());
    }
  }, Math.round(1000 / 60));
});

let keydowned = false;

window.addEventListener('keydown', (e) => {
  if (keydowned) {
    return;
  }

  console.log('keydown', e.key);
  keydowned = true;

  if (e.key === 'ArrowLeft' || e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф') {
    ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'down', key: 'Left' } } as ClientAction));
  }

  if (e.key === 'ArrowRight' || e.key === 'D' || e.key === 'd' || e.key === 'В' || e.key === 'в') {
    ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'down', key: 'Right' } } as ClientAction));
  }

  if (e.key === 'ArrowUp' || e.key === 'W' || e.key === 'w' || e.key === 'Ц' || e.key === 'ц') {
    ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'down', key: 'Up' } } as ClientAction));
  }

  if (e.key === 'ArrowDown' || e.key === 'S' || e.key === 's' || e.key === 'Ы' || e.key === 'ы') {
    ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'down', key: 'Down' } } as ClientAction));
  }
});

window.addEventListener('keyup', (e) => {
  console.log('keyup', e.key);
  keydowned = false;

  if (e.key === 'ArrowLeft' || e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф') {
    ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'up', key: null } } as ClientAction));
  }

  if (e.key === 'ArrowRight' || e.key === 'D' || e.key === 'd' || e.key === 'В' || e.key === 'в') {
    ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'up', key: null } } as ClientAction));
  }

  if (e.key === 'ArrowUp' || e.key === 'W' || e.key === 'w' || e.key === 'Ц' || e.key === 'ц') {
    ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'up', key: null } } as ClientAction));
  }

  if (e.key === 'ArrowDown' || e.key === 'S' || e.key === 's' || e.key === 'Ы' || e.key === 'ы') {
    ws.send(JSON.stringify({ action: 'keyboard', payload: { type: 'up', key: null } } as ClientAction));
  }
});
