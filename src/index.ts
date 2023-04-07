import { CellularAutomata } from './CellularAutomata';
import { Window, CanvasRenderingContext2D } from 'skia-canvas'

const scale = 6;
const fieldWidth = 128;

const DrawWindow = new Window(fieldWidth * scale, fieldWidth * scale);
const SandOfTime = new CellularAutomata(fieldWidth, () => Math.random() > 0.5 ? 1 : 0);

SandOfTime.rules.push((cx, cy, prev) => {
  if (cy < fieldWidth) {
    const neighbours = SandOfTime.getNeighbours(1, cx, cy);

    const upLevelNeighbour = neighbours.find((_) => _.posY === cy - 1 && _.posX === cx);
    const downLevelNeighbour = neighbours.find((_) => _.posY === cy + 1 && _.posX === cx);

    const leftNeighbour = neighbours.find((_) => _.posY === cy && _.posX === cx - 1);
    const rightNeighbour = neighbours.find((_) => _.posY === cy && _.posX === cx + 1);

    if (prev && downLevelNeighbour?.value === 0) {
      return {
        value: 0,
        extraChanges: [
          { posX: cx, posY: cy, value: 0 },
          { posX: cx, posY: cy + 1, value: 1 },
        ],
      };
    }

    if (prev && downLevelNeighbour?.value === 1 && upLevelNeighbour?.value === 1) {
      if (leftNeighbour?.value === 0 && rightNeighbour?.value === 0) {
        const random = Math.random() > 0.5;

        return {
          value: 0,
          extraChanges: [
            { posX: cx, posY: cy, value: 0 },
            { posX: random ? cx + 1 : cx - 1, posY: cy, value: 1 },
          ]
        };
      }

      if (leftNeighbour?.value === 0) {
        return {
          value: 0,
          extraChanges: [
            { posX: cx, posY: cy, value: 0 },
            { posX: cx - 1, posY: cy, value: 1 },
          ]
        };
      }

      if (rightNeighbour?.value === 0) {
        return {
          value: 0,
          extraChanges: [
            { posX: cx, posY: cy, value: 0 },
            { posX: cx + 1, posY: cy, value: 1 },
          ]
        };
      }
    }

    return {
      value: prev,
    };
  } else {
    return {
      value: prev,
    };
  }
});

let lastDraw = Date.now() + 1;
DrawWindow.title = 'Output window';
DrawWindow.on("draw", (e) => {
  const ctx = e.target.canvas.getContext("2d") as CanvasRenderingContext2D;
  let drawsCallsCount = 0;
  SandOfTime.cells.forEach((row, posX) => {
    row.forEach((value, posY) => {
      ctx.fillStyle = `rgba(${value ? 255 : 0},${value ? 255 : 0},${value ? 255 : 0},1)`;
      ctx.fillRect(posX * scale, Math.abs(posY - fieldWidth) * scale, scale, scale);
      drawsCallsCount += 1;
    })
  });

  if (e.frame % 200 === 0) {
    SandOfTime.init();
  } else {
    SandOfTime.tick();
  }

  DrawWindow.title = `f: ${e.frame}; t: ${Date.now() - lastDraw}; d: ${drawsCallsCount}`;
  lastDraw = Date.now();
});
