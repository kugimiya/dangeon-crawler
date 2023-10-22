import Perlin from 'ts-perlin-simplex';
import { getRandomFromArray } from './Utils';

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
  'wallBottomLeftInverted',
  'wallBottomLeftRight',
  'wallBottomRightInverted',
  'wallTopBottomLeftRight',
  'wallTopLeftInverted',
  'wallTopLeftRight',
  'wallTopRightInverted',
  'wallTopLeftRightInverted',
  'wallTopLeftRightInvertedConnect',
  'wallTopLeftLessRightInvertedConnect',
  'wallTopLeftLessRightInvertedConnectInverted'
}

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

    // 2 - init map
    this.tiles = this.generateMapByNultiOctaveNoise();
  }

  generateMapByNultiOctaveNoise() {
    const modFirst = 50;
    const modSecond = 10;
    const modThird = 200;
    const simplexFirst = new Perlin.SimplexNoise();
    const simplexSecond = new Perlin.SimplexNoise();
    const simplexThird = new Perlin.SimplexNoise();
    const mcOctMap: Tile[][] = [];

    for (let x = 0; x < this.size; x++) {
      const column: Tile[] = [];
      for (let y = 0; y < this.size; y++) {
        const heightFirst = simplexFirst.noise(x / modFirst, y / modFirst);
        const heightSecond = simplexSecond.noise(x / modSecond, y / modSecond);
        const heightThird = simplexThird.noise(x / modThird, y / modThird);
        const height = (heightFirst + ((heightSecond + heightThird) / 3)) / 2;

        if (height > -0.1 && height < 0.1) {
          column.push(Tile.road);
        } else {
          column.push(Tile.wall);
        }
      }

      mcOctMap.push(column);
    }

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        if (x < 5 || x > this.size - 5 || y < 5 || y > this.size - 5) {
          mcOctMap[x][y] = Tile.wall;
        }
      }
    }

    return mcOctMap;
  }
}
