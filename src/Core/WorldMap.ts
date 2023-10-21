import Perlin from 'ts-perlin-simplex';

export enum Tile {
  'wall',
  'wallLeft',
  'wallRight',
  'wallTop',
  'wallBottom',
  'wallTopLeft',
  'wallBottomLeft',
  'wallTopRight',
  'wallBottomRight',
  'road',
}

function getRandomFromArray<T>(list: T[]) {
  return list[Math.floor((Math.random()*list.length))];
}

const wfcRules = {
  [Tile.wall]: [Tile.wallLeft, Tile.wallRight, Tile.wallTop, Tile.wallBottom],
  [Tile.wallLeft]: [Tile.road, Tile.wall],
  [Tile.wallRight]: [Tile.road, Tile.wall],
  [Tile.wallTop]: [Tile.road, Tile.wall],
  [Tile.wallBottom]: [Tile.road, Tile.wall],
  [Tile.road]: [Tile.wall],
  [Tile.wallTopLeft]: [Tile.wall],
  [Tile.wallBottomLeft]: [Tile.wall],
  [Tile.wallTopRight]: [Tile.wall],
  [Tile.wallBottomRight]: [Tile.wall],
};

export class WorldMap {
  tiles: Tile[][] = [];
  size: number;

  constructor(size: number) {
    this.size = size;
  }

  serialize() {
    return {
      tiles: this.tiles,
      size: this.size,
    };
  }

  getRandomFreePosition() {
    const possibles: [number, number][] = [];
 
    this.tiles.forEach((column, x) => {
      column.forEach((tile, y) => {
        if (tile === Tile.road) {
          possibles.push([x, y]);
        }
      })
    });

    return getRandomFromArray(possibles);
  }

  isMovePossible(x: number, y: number) {
    return this.tiles[x][y] === Tile.road;
  }

  generate() {
    // 1 - init map with walls
    for (let x = 0; x < this.size; x++) {
      const column: Tile[] = [];
      for (let y = 0; y < this.size; y++) {
        column.push(Tile.road);
      }

      this.tiles.push(column);
    }

    // 2 - init wfc map
    let step = 0;
    let wfcMap = this.getInitWfcMap();

    // 2.1 - take middle of the map
    const middle = Math.round(this.size / 2);
    wfcMap[middle][middle] = [getRandomFromArray(wfcMap[middle][middle])];

    // 2.2 - collapse
    while (!this.isWfcCollapsed(wfcMap) && step < 64) {
      step += 1;
      wfcMap = this.collapseWfcMap(wfcMap, [middle, middle]);
    }

    // console.dir(wfcMap)

    // 3 - apply wfc to tilemap
    wfcMap.forEach((column, x) => {
      column.forEach((wfcTile, y) => {
        this.tiles[x][y] = getRandomFromArray(wfcTile);
      });
    });
  }

  collapseWfcMap(wfcMap: Tile[][][], start: [x: number, y: number], stackNum = 1, skip: [x: number, y: number][] = []) {
    const x = start[0];
    const y = start[1];
    const nextSkipAccumulator: [x: number, y: number][] = [[x, y]];
    const triggered: [x: number, y: number][] = [];

    // 1 - collapse at start
    // wfcMap[x][y] = [getRandomFromArray(wfcMap[x][y])];

    const neighbors = [
      [x - 1, y], [x + 1, y],
      [x, y - 1], [x, y + 1],
      [x + 1, y + 1], [x + 1, y - 1],
      [x - 1, y + 1], [x - 1, y - 1]
    ];

    neighbors
      .filter(([neighborX, neighborY]) => {
        const resultFilteringPositions = neighborX > 0 && neighborY > 0 && neighborX < this.size - 1 && neighborY < this.size - 1;
        return resultFilteringPositions;
      })
      .filter(([neighborX, neighborY]) => {
        const resultFilteringSkip = skip.every(([skipX, skipY]) => skipX !== neighborX && skipY !== neighborY);
        return resultFilteringSkip;
      })
      .forEach(([neighborX, neighborY]) => {
        wfcMap[neighborX][neighborY] = wfcMap[neighborX][neighborY].length === 1
          ? wfcMap[neighborX][neighborY]
          : wfcMap[neighborX][neighborY].filter((tile) => wfcRules[tile].includes(wfcMap[x][y].at(0)));

        nextSkipAccumulator.push([neighborX, neighborY]);
        triggered.push([neighborX, neighborY]);
      });

    // 3 - sub-collapse triggered
    triggered.forEach(([tiggeredX, triggeredY]) => {
      try {
        wfcMap = this.collapseWfcMap(wfcMap, [tiggeredX, triggeredY], stackNum + 1, [...skip, ...nextSkipAccumulator]);
      } catch {
        console.log({ stackNum, tiggeredX, triggeredY, nextSkipAccumulator })
      }
    });

    return wfcMap;
  }

  isWfcCollapsed(wfcMap: Tile[][][]) {
    let collapsed = true;
    wfcMap.forEach((column) => {
      column.forEach((wfcTile) => {
        collapsed = collapsed && wfcTile.length === 1;
      });
    });

    return collapsed;
  }

  getInitWfcMap() {
    const modFirst = 50;
    const modSecond = 10;
    const modThird = 200;
    const simplexFirst = new Perlin.SimplexNoise();
    const simplexSecond = new Perlin.SimplexNoise();
    const simplexThird = new Perlin.SimplexNoise();
    const wfcMap: Tile[][][] = [];

    for (let x = 0; x < this.size; x++) {
      const column: Tile[][] = [];
      for (let y = 0; y < this.size; y++) {
        const heightFirst = simplexFirst.noise(x / modFirst, y / modFirst);
        const heightSecond = simplexSecond.noise(x / modSecond, y / modSecond);
        const heightThird = simplexThird.noise(x / modThird, y / modThird);
        const height = (heightFirst + ((heightSecond + heightThird) / 3)) / 2;

        if (height > -0.1 && height < 0.1) {
          column.push([
            Tile.road,
          ]);
        } else {
          column.push([
            Tile.wall,
          ]);
        }
      }

      wfcMap.push(column);
    }

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        if (x < 5 || x > this.size - 5 || y < 5 || y > this.size - 5) {
          wfcMap[x][y] = [Tile.wall];
        }
      }
    }

    return wfcMap;
  }
}
