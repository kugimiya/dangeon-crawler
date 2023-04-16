import { Window, CanvasRenderingContext2D, Image, loadImage } from 'skia-canvas';
import { readdirSync, readFileSync } from 'fs';

const win = new Window(512, 512, { background: 'black' });

const draw = async () => {
  const ctx = win.ctx;
  const files = readdirSync('output');
  const [file] = files.sort().reverse();
  // const img = await loadImage(readFileSync());
  const img = new Image();
  img.src = `output/${file}`;
  ctx.drawImage(img, 0, 0);
};

win.on('draw', draw);
