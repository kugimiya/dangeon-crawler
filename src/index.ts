import { CellularAutomata } from './CellularAutomata';
import { Window, CanvasRenderingContext2D } from 'skia-canvas'

const scale = 6;
const fieldWidth = 128;

const DrawWindow = new Window(fieldWidth * scale, fieldWidth * scale);
const GameOfLife = new CellularAutomata(fieldWidth, () => Math.random() > 0.5 ? 1 : 0);
GameOfLife.rules.push((cx, cy, prev) => {
  const neighbours = GameOfLife.getNeighbours(1, cx, cy);
  const aliveCount = neighbours.filter((_) => _.value === 1).length;

  if (aliveCount === 3 && prev === 0) {
    return 1;
  }

  if (aliveCount === 3 || aliveCount === 2) {
    if (prev === 1) {
      return 1;
    }
  }

  return 0;
});

let lastDraw = Date.now() + 1;
DrawWindow.title = 'Output window';
DrawWindow.on("draw", (e) => {
  const ctx = e.target.canvas.getContext("2d") as CanvasRenderingContext2D;
  let drawsCallsCount = 0;
  GameOfLife.tick();
  GameOfLife.diff.forEach(({ posX, posY, value }) => {
    ctx.fillStyle = `rgba(${value ? 0 : 255},${value ? 0 : 255},${value ? 0 : 255},1)`;
    ctx.fillRect(posX * scale, posY * scale, scale, scale);
    drawsCallsCount += 1;
  });

  DrawWindow.title = `f: ${e.frame}; t: ${Date.now() - lastDraw}; d: ${drawsCallsCount}`;
  lastDraw = Date.now();
});
