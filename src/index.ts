import { mkdirSync } from 'fs';
import { Solver } from './Solver';
import { Canvas } from 'skia-canvas';
import { VerletObject } from './VerletObject';

async function main() {
  const scale = 1;
  const fieldWidth = 2048;
  const genCount = 2048 * 2;
  const genToFrame = 16;
  const dencity = 2;
  const verletsCount = genCount * genToFrame;
  const instanceId = 1;

  const canvas = new Canvas(fieldWidth * scale, fieldWidth * scale);
  const solver = new Solver(16);
  await solver.initPromise;

  solver.cellSize = 2;
  solver.fieldWidth = fieldWidth;

  let lastTime = 0;
  let counter = 0;
  let frame = 0;

  // mkdirSync(`output_${instanceId}`);

  const draw = async () => {
    console.time('Round');
    console.time('Draw');
    const ctx = canvas.newPage();
    let averageVelocity = 0;
    lastTime = Date.now();

    if (frame < genToFrame) {
      const cx = (fieldWidth / 2);
      const cy = (fieldWidth / 2);

      for (let i = 0; i < genCount; i++) {
        if (frame < genToFrame) {
          const obj = new VerletObject();

          obj.positionCurrent.set(
            (Math.random() * Math.sqrt(genCount / dencity)) + cx,
            (Math.random() * Math.sqrt(genCount / dencity)) + cy
          );
          obj.positionLast = obj.positionCurrent.clone();
          obj.center.set(
            fieldWidth / 2,
            fieldWidth / 2
          );

          solver.objects.push(obj);
          counter += 1;
        }
      }
    }

    ctx.fillStyle = `rgba(0,0,0,1)`;
    ctx.fillRect(0, 0, fieldWidth * scale, fieldWidth * scale);

    const gridLength = solver.fieldWidth / solver.cellSize;
    for (let i = 0; i < gridLength; i++) {
      for (let k = 0; k < gridLength; k++) {
        const cell = solver.grid[`${i}-${k}`]?.objs || [];
        const size = cell.length || 0;

        ctx.fillStyle = `rgba(${size * 64},${size * 64},${size * 64},0.9)`;
        ctx.fillRect((i * solver.cellSize) * scale, (k * solver.cellSize) * scale, solver.cellSize * scale, solver.cellSize * scale);
      }
    }

    solver.objects.forEach(obj => {
      const length = obj.velosityLast.length();

      ctx.fillStyle = `rgba(${50 + length * 1024},0,${length},1)`;
      ctx.fillRect(obj.positionCurrent.x * scale, obj.positionCurrent.y * scale, scale, scale);

      averageVelocity += obj.velosityLast.length();
      averageVelocity = averageVelocity / 2;
    });

    canvas.saveAsSync(`output_${instanceId}/${Date.now()}-${frame}.png`, { format: 'png', quality: 1 });

    frame += 1;

    console.timeEnd('Draw');
    console.log(`Frame: ${frame}, avg vel: ${Math.round(averageVelocity * 100) / 100}`);
    console.log(`Verlets: ${counter}/${verletsCount}`);
    console.log('');

    await solver.update(0.1);
    console.timeEnd('Round');
    setTimeout(() => draw(), 0);
  }

  await draw();
}

main();
