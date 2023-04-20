import Vec2 from 'vec2';
import parallel from 'run-parallel';
import comedy, { ActorRef } from 'comedy';

import { VerletObject } from './VerletObject';
import { ResponseGridIndex } from './SolverActor';

export class Solver {
  cellSize = 2;
  fieldWidth = 0;
  gravity = new Vec2(0, 0);
  objects: VerletObject[] = [];
  grid: Record<string, { objs: number[], posX: number, posY: number }> = {};
  subSteps = 2;
  actors = comedy.createSystem({});
  initPromise: Promise<unknown>;
  computeActor: ActorRef;
  clusterSize: number;

  constructor(clusterSize: number) {
    this.clusterSize = clusterSize;
    this.initPromise = this.actors.rootActor()
      .then(rootActor => {
        return rootActor.createChild(
          '/src/SolverActor',
          {
            mode: 'in-memory', // 'forked', // 'in-memory', // 'threaded'
            clusterSize,
          },
        );
      })
      .then(actorRef => {
        this.computeActor = actorRef;
      });
  }

  async update(dt: number) {
    const profile = {
      updGrid: 0,
      collisions: 0,
      gravity: 0,
      constraint: 0,
      updPositions: 0,
    };

    console.log('Start update');
    console.time(`Updated`);
    const subDt = dt / this.subSteps;

    for (let i = 0; i < this.subSteps; i++) {
      let time = Date.now();

      await this.updateGridIndexes();
      profile.updGrid += Date.now() - time;
      time = Date.now();

      await this.solveCollisions_grid();
      profile.collisions += Date.now() - time;
      time = Date.now();

      await this.applyGravity();
      profile.gravity += Date.now() - time;
      time = Date.now();

      await this.applyConstraint();
      profile.constraint += Date.now() - time;
      time = Date.now();

      await this.updatePositions(subDt);
      profile.updPositions += Date.now() - time;
      time = Date.now();
    }

    console.timeEnd(`Updated`);
    console.log(`  updGrid:      ${profile.updGrid}ms`);
    console.log(`  collisions:   ${profile.collisions}ms`);
    console.log(`  gravity:      ${profile.gravity}ms`);
    console.log(`  constraint:   ${profile.constraint}ms`);
    console.log(`  updPositions: ${profile.updPositions}ms`);
  }

  async updateGridIndexes() {
    this.grid = {};

    const promises = [];
    const length = this.objects.length;
    const objs = (this.objects).map((obj, id) => ({ id, obj }));

    for (let i = 0; i < this.clusterSize; i++) {
      promises.push(
        this.computeActor.sendAndReceive(
          'GridIndex',
          {
            cellSize: this.cellSize,
            objects: objs.slice(i * length, (i + 1) * length)
              .map(i => [i.id, i.obj.positionCurrent.x, i.obj.positionCurrent.y])
          }
        )
      );
    }

    (await Promise.all(promises))
      .map((actorResponse: ResponseGridIndex) => {
        actorResponse.map(({ x, y, objInd }) => {
          const index = `${x}-${y}`;
          if (this.grid[index]) {
            this.grid[index].objs = [
              ...this.grid[index].objs,
              ...objInd
            ];
          } else {
            this.grid[index] = {
              objs: objInd,
              posX: x,
              posY: y
            };
          }
        });
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

  async applyGravity() {
    const gridValues = Object.values(this.grid).map(_ => ([_.objs.length, _.posX, _.posY]));
    const promises = [];

    for (let i = 0; i < this.objects.length; i++) {
      promises.push(
        this.computeActor.sendAndReceive(
          'AccelerateGravity',
          [
            [
              this.objects[i].center.x,
              this.objects[i].center.y,
            ],
            [
              this.objects[i].positionCurrent.x,
              this.objects[i].positionCurrent.y,
            ],
            gridValues,
          ]
        ).then((response: [number, number]) => {
          this.objects[i].accelerate(new Vec2(response[0], response[1]));
        }),
      );
    }
    
    await Promise.all(promises);
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

  async solveCollisions_grid() {
    let actions: { id: number, coordinates: [number, number] }[] = [];
    const promises = [];
    const gridLength = this.fieldWidth / this.cellSize;

    for (let i = 1; i < gridLength + 2; i += 2) {
      for (let k = 1; k < gridLength + 2; k += 2) {
        const cell = [
          ...(this.grid[`${i - 1}-${k - 1}`]?.objs || []),
          ...(this.grid[`${i - 1}-${k}`]?.objs || []),
          ...(this.grid[`${i - 1}-${k + 1}`]?.objs || []),
          ...(this.grid[`${i}-${k - 1}`]?.objs || []),
          ...(this.grid[`${i}-${k}`]?.objs || []),
          ...(this.grid[`${i}-${k + 1}`]?.objs || []),
          ...(this.grid[`${i + 1}-${k - 1}`]?.objs || []),
          ...(this.grid[`${i + 1}-${k}`]?.objs || []),
          ...(this.grid[`${i + 1}-${k + 1}`]?.objs || []),
        ];

        if (cell.length) {
          promises.push(
            this.computeActor.sendAndReceive(
              'Bruteforce',
              {
                objectIndexes: cell,
                objects: this.objects
                  .map((obj, id) => ({ x: obj.positionCurrent.x, y: obj.positionCurrent.y, id }))
                  .filter(_ => cell.includes(_.id))
              },
            ).then((actionsNext: { id: number, coordinates: [number, number] }[]) => {
              actions = [...actions, ...actionsNext];
            })
          );
        }
      }
    }

    await Promise.all(promises);
    await this.updateGridIndexes();

    actions.forEach(({ coordinates, id }) => {
      this.objects[id].positionCurrent.set(coordinates[0], coordinates[1]);
    });
  }
}
