import Vec2 from "vec2";

export type ResponseGridIndex = {
  objInd: number[];
  x: number;
  y: number;
}[];


class SolverActor {
  AccelerateGravity([
    data_center,
    data_position,
    data_grid,
  ]: [
    center: [number, number],
    position: [number, number],
    grid: [objs: number, posX: number, posY: number ][],
  ]) {
    const center = new Vec2(data_center);

    const acceleration = data_grid.reduce((acc, [objs, posX, posY]) => {
      if (objs) {
        const positionCurrent = new Vec2(data_position[0], data_position[1]);
        const nAcc = center
          .subtract(posX, posY, true)
          .subtract(positionCurrent, true)
          .normalize(true);

        return acc.add(nAcc).normalize(true);
      }

      return acc;
    }, new Vec2(0, 0));

    return [acceleration.x, acceleration.y];
  }

  GridIndex(data: { cellSize: number, objects: [number, number, number][] }) {
    const response: ResponseGridIndex = [];
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
  }

  Bruteforce(data: {
    objectIndexes: number[],
    objects: { x: number, y: number, id: number }[],
  }) {
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
  }
}

module.exports = SolverActor;