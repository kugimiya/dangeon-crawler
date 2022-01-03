import { Canvas, CanvasKit as CKType, CanvasKitInit } from 'canvaskit-wasm';

((window as unknown as { CanvasKitInit: typeof CanvasKitInit }).CanvasKitInit as typeof CanvasKitInit)({ locateFile: (file) => `https://unpkg.com/canvaskit-wasm@0.19.0/bin/${file}` }).then(main);

function main(CanvasKit: CKType): void {
  const [ width, height ] = [640, 640];
  const surface = CanvasKit.MakeCanvasSurface('root');

  let tick = 0;

  function grid(canvas: Canvas): void {
    const [v, h] = [11, 11];
    const alpha = 0.3;
    const black = new CanvasKit.Paint();
    black.setColor(CanvasKit.Color4f(0, 0, 0, alpha));
    black.setAntiAlias(false);

    for (let x = 0; x <= v; x++) {
      canvas.drawLine(x * (width / v) + 1, 0, x * (width / v) + 1, height, black);
    }

    for (let y = 0; y <= h; y++) {
      canvas.drawLine(0, y * (height / h), width, y * (height / h), black);
    }
  }

  function draw(canvas: Canvas) {
    surface.requestAnimationFrame(draw);
    tick += 1;

    const [x, y] = [
      (width / 2) + Math.cos(tick / 60) * 80,
      (height / 2) + Math.sin(tick / 60) * 160
    ]

    grid(canvas);

    for (let i = 0; i <= 12; i++) {
      canvas.drawLine(
        x + (Math.cos((i + (tick / 60) - 1) / 2) * 70),
        y + (Math.sin((i + (tick / 60) - 1) / 2) * 70),
        x + (Math.cos((i + (tick / 60)) / 2) * 70),
        y + (Math.sin((i + (tick / 60)) / 2) * 70),
        new CanvasKit.Paint(),
      );
    }
  }

  surface.requestAnimationFrame(draw);
}
