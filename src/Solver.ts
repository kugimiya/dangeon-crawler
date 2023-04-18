import Vec2 from 'vec2';
import parallel from 'run-parallel';
import { VerletObject } from './VerletObject';
import comedy, { ActorRef } from 'comedy';

type grid_index_response = {
  objInd: number[];
  x: number;
  y: number;
}[];

const solverActorMethods = {
  bruteforce: (data: {
    objectIndexes: number[],
    objects: { x: number, y: number, id: number }[],
  }) => {
    const actions: { id: number, coordinates: [number, number] }[] = [];
    const objects = Object.fromEntries(data.objects.map(i => [i.id, new Vec2(i.x, i.y)]));

    const defRadius = 0.5;
    const count = data.objectIndexes.length;

    for (let i = 0; i < count; i++) {
      for (let k = 0; k < count; k++) {
        if (data.objectIndexes[i] === data.objectIndexes[k]) {
          continue;
        }

        const obj1 = objects[data.objectIndexes[i]];
        const obj2 = objects[data.objectIndexes[k]];

        const collisionAxis = obj1.subtract(obj2, true);
        const dist = collisionAxis.length();

        if (dist < (defRadius + defRadius)) {
          const next = collisionAxis.divide(dist, true);
          const delta = (defRadius + defRadius) - dist;

          const mlt = next.multiply(0.5 * delta, true);

          objects[data.objectIndexes[i]] = obj1.add(mlt, true);
          objects[data.objectIndexes[k]] = obj2.subtract(mlt, true);
        }
      }
    }

    Object.entries(objects).forEach(([id, obj]) => {
      actions.push({ id: Number(id), coordinates: [obj.x, obj.y] });
    });

    return actions;
  },
  grid_index: (data: { cellSize: number, objects: [number, number, number][] }) => {
    const response: grid_index_response = [];
    const grid: Record<string, number[]> = {};
    const map: Record<string, [number, number]> = {};

    data.objects.forEach(([ id, x, y ]) => {
      const xk = Math.round(x / data.cellSize);
      const yk = Math.round(y / data.cellSize);
      const ind = `${xk}-${yk}`;

      if (grid[ind]) {
        grid[ind].push(id);
      } else {
        grid[ind] = [id];
        map[ind] = [xk, yk];
      }
    });

    Object.keys(grid).forEach(key => {
      response.push({ objInd: grid[key], x: map[key][0], y: map[key][1] });
    });

    return response;
  },
  accelerate_gravity: (data: {
    id: number,
    center: [number, number],
    position: [number, number],
    grid: { objs: number[], posX: number, posY: number }[],
  }) => {
    const center = new Vec2(data.center);

    const acceleration = data.grid.reduce((acc, cur) => {
      if (cur?.objs?.length) {
        const positionCurrent = new Vec2(data.position[0], data.position[1]);
        const nAcc = center
          .subtract(cur?.posX, cur?.posY, true)
          .subtract(positionCurrent, true)
          .normalize(true);

        return acc.add(nAcc).normalize(true);
      }

      return acc;
    }, new Vec2(0, 0));

    return [data.id, acceleration.x, acceleration.y];
  }
};

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
        return rootActor.createChild(solverActorMethods, {
          mode: 'in-memory', // 'forked', // 'in-memory',
          clusterSize,
        });
      })
      .then(actorRef => {
        this.computeActor = actorRef;
      });
  }

  async update(dt: number) {
    console.log('Start update');
    console.time(`Updated`);
    const subDt = dt / this.subSteps;

    for (let i = 0; i < this.subSteps; i++) {
      await this.updateGridIndexes();
      await this.solveCollisions_grid();
      await this.applyGravity();
      await this.applyConstraint();
      await this.updatePositions(subDt);
    }

    console.timeEnd(`Updated`);
  }

  async updateGridIndexes() {
    this.grid = {};

    const promises = [];
    const length = this.objects.length;
    const objs = (this.objects).map((obj, id) => ({ id, obj }));

    for (let i = 0; i < this.clusterSize; i++) {
      promises.push(
        this.computeActor.sendAndReceive(
          'grid_index',
          {
            cellSize: this.cellSize,
            objects: objs.slice(i * length, (i + 1) * length)
              .map(i => [i.id, i.obj.positionCurrent.x, i.obj.positionCurrent.y])
          }
        )
      );
    }

    (await Promise.all(promises))
      .map((actorResponse: grid_index_response) => {
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
    const gridValues = Object.values(this.grid);
    const promises = [];

    for (let i = 0; i < this.objects.length; i++) {
      promises.push(
        this.computeActor.sendAndReceive(
          'accelerate_gravity',
          {
            id: i,
            center: [
              this.objects[i].center.x,
              this.objects[i].center.y,
            ],
            position: [
              this.objects[i].positionCurrent.x,
              this.objects[i].positionCurrent.y,
            ],
            grid: gridValues,
          }
        ).then((response: [number, number, number]) => {
          this.objects[i].accelerate(new Vec2(response[1], response[2]));
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
              'bruteforce',
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
