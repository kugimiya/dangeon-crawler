import { mkdirSync } from 'fs';
import { Solver } from './Solver';
import { Canvas } from 'skia-canvas';
import { VerletObject } from './VerletObject';
import { cpus } from 'os';

async function main() {
  const scale = 1;
  const fieldWidth = 1024;
  const genCount = 512;
  const genToFrame = 8;
  const dencity = 1;
  const verletsCount = genCount * genToFrame;
  const instanceId = Date.now();
  const timeStep = 1;

  const canvas = new Canvas(fieldWidth * scale, fieldWidth * scale);
  const solver = new Solver(cpus().length);
  await solver.initPromise;

  solver.cellSize = 4;
  solver.subSteps = 8;
  solver.fieldWidth = fieldWidth;

  let lastTime = Date.now();
  let counter = 0;
  let frame = 0;

  mkdirSync(`output_${instanceId}`);

  const draw = async () => {
    console.time('Round');
    console.time('Draw');
    const ctx = canvas.newPage();
    let averageVelocity = 0;

    if (frame < genToFrame) {
      const cx = (fieldWidth / 2) + (Math.random() - 0.25);
      const cy = (fieldWidth / 2) + (Math.random() - 0.25);
      const dirY = (Math.random() - 0.25) * 2
      const dirX = Math.random() > 0.5 ? -1 : 1;

      for (let i = 0; i < genCount; i++) {
        if (frame < genToFrame) {
          const obj = new VerletObject();

          obj.positionCurrent.set(
            (Math.random() * Math.sqrt(genCount / dencity)) + cx,
            (Math.random() * Math.sqrt(genCount / dencity)) + cy
          );
          obj.positionLast = obj.positionCurrent.clone().add(dirX + Math.random(), dirY + Math.random());
          solver.objects.push(obj);
          counter += 1;
        }
      }
    }

    ctx.fillStyle = `rgba(0,0,0,1)`;
    ctx.fillRect(0, 0, fieldWidth * scale, fieldWidth * scale);

    const gridLength = solver.fieldWidth / solver.cellSize;
    solver.objects.forEach(obj => {
      const length = obj.velocityLast.length();

      ctx.fillStyle = `rgba(${50 + length * 1024},0,${length},1)`;
      ctx.fillRect(obj.positionCurrent.x * scale, obj.positionCurrent.y * scale, scale, scale);

      averageVelocity += obj.velocityLast.length();
      averageVelocity = averageVelocity / 2;
    });
    for (let i = 0; i < gridLength; i++) {
      for (let k = 0; k < gridLength; k++) {
        const cell = solver.grid[`${i}-${k}`]?.objs || [];
        const size = cell.length || 0;

        ctx.fillStyle = `rgba(${size * 64},${size * 64},${size * 64},0.5)`;
        ctx.fillRect((i * solver.cellSize) * scale, (k * solver.cellSize) * scale, solver.cellSize * scale, solver.cellSize * scale);
      }
    }

    console.timeEnd('Draw');

    await solver.update(timeStep);

    ctx.fillStyle = `rgba(255,255,255,1)`;
    ctx.font = "bold 12px serif";
    

    const infos = [
      `date: ${(new Date()).toISOString()}`,
      `time taken: ${Date.now() - lastTime}ms`,
      `frame: ${frame}`,
      ``,

      `objects: ${counter}/${verletsCount}`,
      `velocityAverage: ${Math.round(averageVelocity * 100) / 100}`,
      `gridSize: ${Object.values(solver.grid).length}`,
      ``,

      `scale: ${scale}`,
      `fieldWidth: ${fieldWidth}`,
      `genCount: ${genCount}`,
      `genToFrame: ${genToFrame}`,
      `dencity: ${dencity}`,
      `verletsCount: ${verletsCount}`,
      `timeStep: ${timeStep}`,
      `solver.cellSize: ${solver.cellSize}`,
      `solver.subSteps: ${solver.subSteps}`,
    ];

    infos.forEach((str, index) => {
      ctx.fillText(str, 0, 13 * (index + 1));
    });

    canvas.saveAsSync(`output_${instanceId}/${Date.now()}-${frame}.png`, { format: 'png', quality: 1 });

    frame += 1;

    console.log(`Frame: ${frame}, avg vel: ${Math.round(averageVelocity * 100) / 100}`);
    console.log(`Verlets: ${counter}/${verletsCount}`);
    console.log('');

    
    console.timeEnd('Round');
    lastTime = Date.now();
    setTimeout(() => draw(), 0);
  }

  await draw();
}

main();
