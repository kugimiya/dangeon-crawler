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
  fieldWidth = 0;
  gravity = new Vec2(0, 1);
  objects: VerletObject[] = [];

  update(dt: number) {
    const subSteps = 8;
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      this.applyGravity();
      this.applyConstraint();
      this.solveCollisions();
      this.updatePositions(subDt);
    }
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

  solveCollisions() {
    const defRadius = 0.5;
    const count = this.objects.length;

    for (let i = 0; i < count; ++i) {
      for (let k = i + 1; k < count; ++k) {
        const obj1 = this.objects[i];
        const obj2 = this.objects[k];

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
const fieldWidth = 768;
const verletsCount = 4096 * 4;

console.log({ verletsCount });

const DrawWindow = new Window(fieldWidth * scale, fieldWidth * scale);
const solver = new Solver();

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
