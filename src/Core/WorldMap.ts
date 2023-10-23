import Perlin from 'ts-perlin-simplex';
import { getRandomFromArray, newArray } from './Utils';
import { Cell, MapCell, Tile } from './types';

const defaultCell: MapCell = { 
  tile: Tile.road, 
  type: Cell.road,
  temperature: 0,
};

export class WorldMap {
  map: MapCell[][] = [];
  size: number;

  constructor(size: number) {
    this.size = size;
  }

  getRandomFreePosition() {
    const possibles: [number, number][] = [];
    
    this.forEach((cell, x, y) => {
      if (cell.type === Cell.road) {
        possibles.push([x, y]);
      }
    });

    return getRandomFromArray(possibles);
  }

  forEach(cb: (cell: MapCell, x: number, y: number) => void) {
    this.map.forEach((column, x) => column.forEach((cell, y) => cb(cell, x, y)));
  }

  getCell(x: number, y: number) {
    return this.map[x][y];
  }

  isMovePossible(x: number, y: number) {
    return this.getCell(x, y).type === Cell.road;
  }

  generate() {
    // 0 - alloc
    this.map = newArray(this.size).map(() => (newArray(this.size).map(() => Object.assign({}, defaultCell))));

    // 1 - init map
    const cellMap = this.generateMultiOctaveNoise<Cell>(
      this.size, 3, [50, 10, 200], Cell.wall,
      ([ octave1, octave2, octave3 ]) => (octave1 + ((octave2 + octave3) / 3)) / 2,
      (value) => (value > -0.1 && value < 0.1) ? Cell.road : Cell.wall,
    );

    // 2 - make temperature map
    const tempMap = this.generateMultiOctaveNoise<number>(
      this.size, 2, [10, 200], 0,
      ([ octave1, octave2 ]) => (octave1 + (octave2 / 2)) / 2,
      (value) => Math.min(1, Math.max(0, Math.abs(value))),
    );

    // 3 - update cells
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        this.map[x][y].tile = cellMap[x][y] === Cell.road ? Tile.road : Tile.wall;
        this.map[x][y].type = cellMap[x][y];
        this.map[x][y].temperature = Math.round(tempMap[x][y] * 100) / 100;
      }
    }
  }

  generateMultiOctaveNoise<T = unknown>(
    size: number,
    octavesCount: number, 
    mult: number[], 
    initialValue: T,
    processor: (octaveValues: number[]) => number,
    interpreter: (value: number) => T,
  ) {
    const map: T[][] = newArray(size).map(() => newArray(size).map(() => initialValue));
    const generators: Perlin.SimplexNoise[] = newArray(octavesCount).map(() => new Perlin.SimplexNoise());

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        map[x][y] = interpreter(processor(generators.map((gen, i) => gen.noise(x / mult[i], y / mult[i]))));
      }
    }

    return map;
  }
}
