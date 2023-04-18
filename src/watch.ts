import { Window, CanvasRenderingContext2D, Image, loadImage } from 'skia-canvas';
import { readdirSync, readFileSync } from 'fs';

const win = new Window(2048, 2048, { background: 'black' });

const draw = async () => {
  const ctx = win.ctx;
  const files = readdirSync('output_1');
  const [file] = files.sort().reverse();
  // const img = await loadImage(readFileSync());
  const img = new Image();
  img.src = `output_1/${file}`;
  ctx.drawImage(img, 0, 0);
};

win.on('draw', draw);
