import Vec2 from "vec2";

export type ResponseAccelerateGravity = [
  x: number,
  y: number,
];

export type GridValueAccGravPayl = [ objs: number, posX: number, posY: number ];
export type PayloadAccelerateGravity = [
  center: [number, number],
  position: [number, number],
  grid: GridValueAccGravPayl[],
];

export type ResponseGridIndex = [
  objInd: number[],
  x: number,
  y: number,
][];

export type PayloadGridIndex = [
  cellSize: number,
  objects: [number, number, number][]
];

export type ResponseBruteforce = [
  id: number,
  coordinates: [number, number]
][];

export type ObjectPayloadBruteforce = [ x: number, y: number, id: number ];
export type PayloadBruteforce = [
  objectIndexes: number[],
  objects: ObjectPayloadBruteforce[],
];

class SolverActor {
  AccelerateGravity([
    data_center,
    data_position,
    data_grid,
  ]: PayloadAccelerateGravity) {
    const center = new Vec2(data_center);
    const positionCurrent = new Vec2(data_position[0], data_position[1]);

    // let massesDirection = data_grid.reduce((acc, [objs, posX, posY]) => {
    //   if (objs) {
    //     const nAcc = positionCurrent.clone()
    //       .subtract(posX, posY)
    //       .multiply(objs * 512, true)
    //       .normalize();

    //     return acc.add(nAcc).normalize(true);
    //   }

    //   return acc;
    // }, center.clone());

    let acceleration = center
      .subtract(positionCurrent, true)
      //.add(massesDirection)
      .normalize(true);
    const response: ResponseAccelerateGravity = [acceleration.x, acceleration.y];
    return response;
  }

  GridIndex(data: PayloadGridIndex) {
    const [cellSize, objects] = data;
    const response: ResponseGridIndex = [];
    const grid: Record<string, number[]> = {};
    const map: Record<string, [number, number]> = {};

    objects.forEach(([ id, x, y ]) => {
      const xk = Math.round(x / cellSize);
      const yk = Math.round(y / cellSize);
      const ind = `${xk}-${yk}`;

      if (grid[ind]) {
        grid[ind].push(id);
      } else {
        grid[ind] = [id];
        map[ind] = [xk, yk];
      }
    });

    Object.keys(grid).forEach(key => {
      response.push([ grid[key], map[key][0], map[key][1] ]);
    });

    return response;
  }

  Bruteforce(data: PayloadBruteforce) {
    const [ objectIndexes, objects_ ] = data;
    const actions: ResponseBruteforce = [];
    const objects = Object.fromEntries(objects_.map(([ x, y, id ]) => [id, new Vec2(x, y)]));

    const defRadius = 0.5;
    const count = objectIndexes.length;

    for (let i = 0; i < count; i++) {
      for (let k = 0; k < count; k++) {
        if (objectIndexes[i] === objectIndexes[k]) {
          continue;
        }

        const obj1 = objects[objectIndexes[i]];
        const obj2 = objects[objectIndexes[k]];

        const collisionAxis = obj1.subtract(obj2, true);
        const dist = collisionAxis.length();

        if (dist < (defRadius + defRadius)) {
          const next = collisionAxis.divide(dist, true);
          const delta = (defRadius + defRadius) - dist;

          const mlt = next.multiply(0.5 * delta, true);

          objects[objectIndexes[i]] = obj1.add(mlt, true);
          objects[objectIndexes[k]] = obj2.subtract(mlt, true);
        }
      }
    }

    Object.entries(objects).forEach(([id, obj]) => {
      actions.push([ Number(id), [obj.x, obj.y] ]);
    });

    return actions;
  }
}

module.exports = SolverActor;
