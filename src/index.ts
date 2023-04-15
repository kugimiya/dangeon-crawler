import { Window, CanvasRenderingContext2D } from 'skia-canvas';
import Vec2 from 'vec2';

class VerletObject {
  positionCurrent = new Vec2(0, 0);
  positionLast = new Vec2(0, 0);
  acceleration = new Vec2(0, 0);
  velosityLast = new Vec2(0, 0);

  updatePosition(dt: number) {
    this.velosityLast = this.positionCurrent.subtract(this.positionLast, true);
    this.positionLast = this.positionCurrent.clone();
    this.positionCurrent = this.positionCurrent.clone().add(this.velosityLast, true).add(this.acceleration.multiply(dt * dt, true), true);
    this.acceleration = new Vec2(0, 0);
  }

  accelerate(acc: Vec2) {
    this.acceleration = acc.clone();
  }
}

class Solver {
  cellSize = 2;
  fieldWidth = 0;
  gravity = new Vec2(0, 1);
  objects: VerletObject[] = [];
  grid: Record<string, number[]> = {};

  update(dt: number) {
    const subSteps = 8;
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      this.updateGridIndexes();
      this.solveCollisions_grid();
      this.applyGravity();
      this.applyConstraint();
      this.updatePositions(subDt);
    }
  }

  updateGridIndexes() {
    this.grid = {};

    this.objects.forEach((obj, objInd) => {
      const xk = Math.round(obj.positionCurrent.x / this.cellSize);
      const yk = Math.round(obj.positionCurrent.y / this.cellSize);
      const ind = `${xk}-${yk}`;

      if (this.grid[ind]) {
        this.grid[ind].push(objInd);
      } else {
        this.grid[ind] = [objInd];
      }
    });
  }

  updatePositions(dt: number) {
    this.objects.forEach(obj => obj.updatePosition(dt));
  }

  applyGravity() {
    this.objects.forEach(obj => obj.accelerate(this.gravity));
  }

  applyConstraint() {
    const position = new Vec2(this.fieldWidth / 2, this.fieldWidth / 2);
    const radius = (this.fieldWidth / 2) - 2;
    const defRadius = 1;

    this.objects.forEach((obj) => {
      const toObj = position.subtract(obj.positionCurrent, true);
      const distance = toObj.length();

      if (distance > (radius - defRadius)) {
        const next = toObj.divide(distance, true);
        const subtrTo = next.multiply(radius - defRadius, true);
        obj.positionCurrent = position.subtract(subtrTo, true);
      }
    });
  }

  solveCollisions_grid() {
    const gridLength = this.fieldWidth / this.cellSize;
    for (let i = 1; i < gridLength - 1; i++) {
      for (let k = 1; k < gridLength - 1; k++) {
        const cell = [
          ...(this.grid[`${i - 1}-${k - 1}`] || []),
          ...(this.grid[`${i - 1}-${k}`] || []),
          ...(this.grid[`${i - 1}-${k + 1}`] || []),
          ...(this.grid[`${i}-${k - 1}`] || []),
          ...(this.grid[`${i}-${k}`] || []),
          ...(this.grid[`${i}-${k + 1}`] || []),
          ...(this.grid[`${i + 1}-${k - 1}`] || []),
          ...(this.grid[`${i + 1}-${k}`] || []),
          ...(this.grid[`${i + 1}-${k + 1}`] || []),
        ];

        if (cell && cell?.length) {
          this.solveCollisions_bruteforce(cell);
        }
      }
    }
  }

  solveCollisions_bruteforce(objectIndexes: number[]) {
    const defRadius = 0.5;
    const count = objectIndexes.length;

    for (let i = 0; i < count; ++i) {
      for (let k = 0; k < count; ++k) {
        if (objectIndexes[i] === objectIndexes[k]) {
          continue;
        }

        const obj1 = this.objects[objectIndexes[i]];
        const obj2 = this.objects[objectIndexes[k]];

        const collisionAxis = obj1.positionCurrent.subtract(obj2.positionCurrent, true);
        const dist = collisionAxis.length();

        if (dist < (defRadius + defRadius)) {
          const next = collisionAxis.divide(dist, true);
          const delta = (defRadius + defRadius) - dist;

          obj1.positionCurrent = obj1.positionCurrent.add(next.multiply(0.5 * delta, true), true);
          obj2.positionCurrent = obj2.positionCurrent.subtract(next.multiply(0.5 * delta, true), true);
        }
      }
    }
  }
}

const scale = 1;
const fieldWidth = 1024;
const verletsCount = 1024 * 64;

console.log({ verletsCount });

const DrawWindow = new Window(fieldWidth * scale, fieldWidth * scale);
const solver = new Solver();

solver.cellSize = 2;
solver.fieldWidth = fieldWidth;

let lastTime = 0;
let counter = 0;
let frame = 0;
DrawWindow.title = 'Output window';
DrawWindow.on("draw", (e) => {
  lastTime = Date.now();

  if (frame < verletsCount) {
    for (let i = 0; i < 256; i++) {
      if (counter < verletsCount) {
        const obj = new VerletObject();
        obj.positionCurrent.set(Math.random() + fieldWidth / 2, Math.random() + fieldWidth / 2);
        obj.positionLast.set(Math.random() + fieldWidth / 2, Math.random() + fieldWidth / 2);

        solver.objects.push(obj);
        counter += 1;
      }
    }
  }

  const ctx = e.target.canvas.getContext("2d") as CanvasRenderingContext2D;

  ctx.fillStyle = `rgba(0,0,0,1)`;
  ctx.fillRect(0, 0, fieldWidth * scale, fieldWidth * scale);
  let averageVelocity = 0;

  solver.update(0.1);
  solver.objects.forEach(obj => {
    const length = obj.velosityLast.length();

    ctx.fillStyle = `rgba(${50 + length * 1024},0,${length},1)`;
    ctx.fillRect(obj.positionCurrent.x * scale, obj.positionCurrent.y * scale, scale, scale);

    averageVelocity += obj.velosityLast.length();
    averageVelocity = averageVelocity / 2;
  });

  ctx.canvas.saveAsSync(`output/${Date.now()}-${frame}.png`, { format: 'png', quality: 1 });
  frame += 1;
  DrawWindow.title = `frame: ${frame}, counter: ${counter}, avg_vel: ${averageVelocity}`;
  let time = (Date.now() - lastTime);
  console.log({ frame, counter, verletsCount, averageVelocity: Math.round(averageVelocity * 100) / 100, time_ms: time, one_second_took_minutes: time / 1000 });
});
