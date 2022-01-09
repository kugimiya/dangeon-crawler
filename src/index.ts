import { Canvas, CanvasKit as CKType, CanvasKitInit } from 'canvaskit-wasm';
import { makeNoise2D } from 'fast-simplex-noise';
import hexRgb from 'hex-rgb';

const palletes = {
  eveningOnTheBeach: [
    hexRgb('#F3FEB0'),
    hexRgb('#FEA443'),
    hexRgb('#705E78'),
    hexRgb('#A5AAA3'),
    hexRgb('#812F33'),
  ],
  dangerousRoads: [
    hexRgb('#548C68'),
    hexRgb('#F2E1AC'),
    hexRgb('#261E10'),
    hexRgb('#F2A679'),
    hexRgb('#F2784B'),
  ],
  tomas2: [
    hexRgb('#D95B7D'),
    hexRgb('#0F1B40'),
    hexRgb('#048C8C'),
    hexRgb('#F29D35'),
    hexRgb('#D93814'),
  ]
};

const params = {
  debug: false,
  tickStep: 0.001,
  cell: {
    size: 10,
  },
  flowField: {
    debugRadius: 10,
    xScale: 0.0025,
    yScale: 0.005,
    fn: (noiseValue: number, tick: number) => Math.cos((Math.sin(noiseValue) * (tick * 2)) * Math.PI) * Math.PI,
  },
  palette: [...palletes.dangerousRoads, ...palletes.tomas2],
  canvas: {
    width: document.querySelector('#root').clientWidth,
    height: document.querySelector('#root').clientHeight,
  },
  noise: makeNoise2D(Math.random),
};

type Params = typeof params;
type CKInit = typeof CanvasKitInit;

(window as unknown as { CanvasKitInit: CKInit }).CanvasKitInit({
  locateFile: file => `https://unpkg.com/canvaskit-wasm@0.19.0/bin/${file}`
}).then(ck => main(ck, params));

function createPaint(CanvasKit: CKType, r: number, g: number, b: number, a: number) {
  const paint = new CanvasKit.Paint();
  paint.setColor(CanvasKit.Color4f(r, g, b, a));
  paint.setAntiAlias(false);

  return paint;
}

function main(CanvasKit: CKType, params: Params): void {
  const surface = CanvasKit.MakeCanvasSurface('root');

  const { width, height } = params.canvas;

  const columns = Math.round(width / params.cell.size);
  const rows = Math.round(height / params.cell.size);
  const flowField: number[][] = [];

  const paints = {
    gridBlack: createPaint(CanvasKit, 0.9, 0.9, 0.9, 1),
    debugShadow: createPaint(CanvasKit, 0, 0, 0, 0.5),
  };

  let tick = 1;
  let min = 0;
  let max = 0;

  const fillFlowField = () => {
    for (let x = 0; x < columns; x += 1) {
      flowField[x] = [];

      for (let y = 0; y < rows; y += 1) {
        const scaledX = x * params.flowField.xScale;
        const scaledY = y * params.flowField.yScale;
        const noiseValue = params.noise(scaledX, scaledY);

        flowField[x][y] = params.flowField.fn(noiseValue, tick);

        if (min > flowField[x][y]) {
          min = flowField[x][y];
        }

        if (max < flowField[x][y]) {
          max = flowField[x][y];
        }
      }
    }
  }

  const getColorIndexFromAngle = (minAngle: number, maxAngle: number, curAngle: number) => {
    const min = Math.abs(minAngle);
    const max = Math.abs(maxAngle) + min;
    const current = Math.abs(curAngle) + (min / 2);

    return Math.round(current / max * params.palette.length);
  }

  const drawGrid = (canvas: Canvas) => {
    for (let x = 0; x <= columns; x++) {
      canvas.drawLine(
        x * (width / columns) + 1, 0,
        x * (width / columns) + 1, height,
        paints.gridBlack
      );
    }

    for (let y = 0; y <= rows; y++) {
      canvas.drawLine(
        0, y * (height / rows),
        width, y * (height / rows),
        paints.gridBlack
      );
    }
  }

  const drawFlow = (canvas: Canvas) => {
    flowField.forEach((columns, column) => {
      columns.forEach((angle, row) => {
        if (params.debug) {
          canvas.drawRect(
            [
              column * params.cell.size - 1,
              row * params.cell.size - 1,
              column * params.cell.size + 1,
              row * params.cell.size + 1,
            ],
            paints.debugShadow,
          );
        }

        const { red, green, blue } = params.palette[getColorIndexFromAngle(min, max, angle)] || {
          red: 1,
          green: 1,
          blue: 1,
        };

        const paint = createPaint(CanvasKit, red / 256, green / 256, blue / 256, 1);

        canvas.drawRect(
          [
            column * params.cell.size,
            row * params.cell.size,
            column * params.cell.size + params.cell.size,
            row * params.cell.size + params.cell.size,
          ],
          paint,
        );

        if (params.debug) {
          canvas.drawLine(
            column * params.cell.size,
            row * params.cell.size,
            column * params.cell.size + (Math.sin(angle) * params.flowField.debugRadius),
            row * params.cell.size + (Math.cos(angle) * params.flowField.debugRadius),
            paints.debugShadow
          );
        }
      });
    });
  }

  function draw(canvas: Canvas) {
    surface.requestAnimationFrame(draw);

    tick += params.tickStep;
    params.debug && console.log(`dimensions: ${columns} x ${rows}`);
    params.debug && console.log(`tick: ${tick}`);
    params.debug && console.time('flow field generation');

    fillFlowField();

    params.debug && console.timeEnd('flow field generation');
    params.debug && console.time('main draw');

    canvas.clear(CanvasKit.WHITE);
    params.debug && drawGrid(canvas);
    drawFlow(canvas);

    params.debug && console.timeEnd('main draw');
  }

  surface.requestAnimationFrame(draw);
}
