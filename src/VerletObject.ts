import Vec2 from 'vec2';

export class VerletObject {
  positionCurrent = new Vec2(0, 0);
  positionLast = new Vec2(0, 0);
  acceleration = new Vec2(0, 0);
  velocityLast = new Vec2(0, 0);

  updatePosition(dt: number) {
    this.velocityLast = this.positionCurrent.subtract(this.positionLast, true);
    this.positionLast = this.positionCurrent.clone();
    this.positionCurrent = this.positionCurrent
      .add(this.velocityLast, true)
      .add(this.acceleration.divide(1.5, true).multiply(dt * dt, true), true);

    this.acceleration = new Vec2(0, 0);
  }

  accelerate(baseAccelerate: Vec2) {
    this.acceleration = baseAccelerate.clone();
  }
}