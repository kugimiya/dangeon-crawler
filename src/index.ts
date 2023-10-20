import { Window, CanvasRenderingContext2D } from 'skia-canvas';
import { WorldMap } from './WorldMap.js';
import { WorldPainter } from './WorldPainter.js';
import { Player } from './Player.js';

const tileSize = 32;
const worldSize = 256;
const windowSize = 768;

const player = new Player();
const map = new WorldMap(worldSize, player);
const painter = new WorldPainter(map, tileSize, windowSize, player);
const window = new Window(windowSize, windowSize);

player.appendMap(map);

let lastDraw = Date.now() + 1;
window.title = 'Output window;';
window.on('draw', (e) => {
  player.processMove();
  const ctx = e.target.canvas.getContext("2d") as CanvasRenderingContext2D;
  painter.draw(ctx);

  window.title = `Output window; f: ${e.frame}; t: ${Date.now() - lastDraw}; px: ${player.position.x}; py: ${player.position.y}`;
  lastDraw = Date.now();
});

window.on('keydown', (e) => {
  if (e.key === 'Left' || e.key === 'A') {
    player.startMoveLeft();
  }

  if (e.key === 'Right' || e.key === 'D') {
    player.startMoveRight();
  }

  if (e.key === 'Up' || e.key === 'W') {
    player.startMoveUp();
  }

  if (e.key === 'Down' || e.key === 'S') {
    player.startMoveDown();
  }
});

window.on('keyup', (e) => {
  if (e.key === 'Left' || e.key === 'A') {
    player.stopMoveLeft();
  }

  if (e.key === 'Right' || e.key === 'D') {
    player.stopMoveRight();
  }

  if (e.key === 'Up' || e.key === 'W') {
    player.stopMoveUp();
  }

  if (e.key === 'Down' || e.key === 'S') {
    player.stopMoveDown();
  }
});

window.on('mousemove', ({ x, y }) => {
  player.pointer.x = x;
  player.pointer.y = y;
});
