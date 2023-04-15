import { Window, Canvas, CanvasRenderingContext2D } from 'skia-canvas';
import Vec2 from 'vec2';
import parallel from 'run-parallel';

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

  async update(dt: number) {
    const subSteps = 8;
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      await this.updateGridIndexes();
      this.solveCollisions_grid();
      await this.applyGravity();
      await this.applyConstraint();
      await this.updatePositions(subDt);
    }
  }

  updateGridIndexes() {
    this.grid = {};

    return new Promise((res) => {
      parallel(
        this.objects.map((obj, objInd) => (callback) => {
          const xk = Math.round(obj.positionCurrent.x / this.cellSize);
          const yk = Math.round(obj.positionCurrent.y / this.cellSize);
          const ind = `${xk}-${yk}`;

          if (this.grid[ind]) {
            this.grid[ind].push(objInd);
          } else {
            this.grid[ind] = [objInd];
          }
          callback(null);
        }),
        res,
      );
    });
  }

  updatePositions(dt: number) {
    return new Promise((res) => {
      parallel(
        this.objects.map((obj) => (callback) => {
          obj.updatePosition(dt);
          callback(null);
        }),
        res,
      );
    });
  }

  applyGravity() {
    return new Promise((res) => {
      parallel(
        this.objects.map((obj) => (callback) => {
          obj.accelerate(this.gravity);
          callback(null);
        }),
        res,
      );
    });
  }

  applyConstraint() {
    const position = new Vec2(this.fieldWidth / 2, this.fieldWidth / 2);
    const radius = (this.fieldWidth / 2) - 2;
    const defRadius = 1;

    return new Promise((res) => {
      parallel(
        this.objects.map((obj) => (callback) => {
          const toObj = position.subtract(obj.positionCurrent, true);
          const distance = toObj.length();
  
          if (distance > (radius - defRadius)) {
            const next = toObj.divide(distance, true);
            const subtrTo = next.multiply(radius - defRadius, true);
            obj.positionCurrent = position.subtract(subtrTo, true);
          }
  
          callback(null);
        }),
        res,
      );
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

async function main() {
  const scale = 1;
  const fieldWidth = 1024;
  const verletsCount = 1024 * 128;

  const canvas = new Canvas(fieldWidth * scale, fieldWidth * scale);
  const solver = new Solver();

  solver.cellSize = 2;
  solver.fieldWidth = fieldWidth;

  let lastTime = 0;
  let counter = 0;
  let frame = 0;
  let imageStr = '';

  console.log({ verletsCount });

  const draw = async () => {
    let averageVelocity = 0;
    lastTime = Date.now();

    if (frame < verletsCount) {
      for (let i = 0; i < 2048; i++) {
        if (counter < verletsCount) {
          const obj = new VerletObject();
          obj.positionCurrent.set(Math.random() + fieldWidth / 2, Math.random() + fieldWidth / 2);
          obj.positionLast.set(Math.random() + fieldWidth / 2, Math.random() + fieldWidth / 2);

          solver.objects.push(obj);
          counter += 1;
        }
      }
    }

    const ctx = canvas.newPage() as CanvasRenderingContext2D;

    ctx.fillStyle = `rgba(0,0,0,1)`;
    ctx.fillRect(0, 0, fieldWidth * scale, fieldWidth * scale);

    await solver.update(0.1);
    solver.objects.forEach(obj => {
      const length = obj.velosityLast.length();

      ctx.fillStyle = `rgba(${50 + length * 1024},0,${length},1)`;
      ctx.fillRect(obj.positionCurrent.x * scale, obj.positionCurrent.y * scale, scale, scale);

      averageVelocity += obj.velosityLast.length();
      averageVelocity = averageVelocity / 2;
    });

    canvas.saveAsSync(`output/${Date.now()}-${frame}.png`, { format: 'png', quality: 1 });
    imageStr = canvas.toDataURLSync('png');

    frame += 1;
    console.log({
      frame,
      counter,
      verletsCount,
      averageVelocity: Math.round(averageVelocity * 100) / 100,
      time_ms: (Date.now() - lastTime),
      one_second_took_minutes: (Date.now() - lastTime) / 1000
    });

    setTimeout(() => draw(), 0);
  }

  await draw();
}

main();
