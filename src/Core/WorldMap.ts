import Perlin from 'ts-perlin-simplex';
import { getRandomFromArray } from './Utils';
import { Cell, MapCell, Tile } from './types';

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
    // 1 - init map
    const cellMap = this.generateMultiOctaveNoise<Cell>(
      this.size, 3, [50, 10, 200], Cell.wall,
      ([ octave1, octave2, octave3 ]) => {
        return (octave1 + ((octave2 + octave3) / 3)) / 2;
      },
      (value) => {
        return (value > -0.1 && value < 0.1) ? Cell.road : Cell.wall;
      },
    );

    // 2 - make temperature map
    const tempMap = this.generateMultiOctaveNoise<number>(
      this.size, 2, [10, 200], 0,
      ([ octave1, octave2 ]) => (octave1 + (octave2 / 2)) / 2,
      (value) => Math.min(1, Math.max(0, Math.abs(value))),
    );

    // 3 - update cells
    for (let x = 0; x < this.size; x++) {
      const column: MapCell[] = [];
      for (let y = 0; y < this.size; y++) {
        column.push({
          block: null,
          tile: cellMap[x][y] === Cell.road ? Tile.road : Tile.wall,
          type: cellMap[x][y],
          temperature: Math.round(tempMap[x][y] * 100) / 100,
        });
      }

      this.map.push(column);
    }
  }

  generateMultiOctaveNoise<T = unknown>(
    size: number,
    octavesCount: number, 
    octavesMods: number[], 
    initialValue: T,
    processor: (octaveValues: number[]) => number,
    interpreter: (value: number) => T,
  ) {
    const tmpmap: T[][] = new Array(size).fill(0).map(() => new Array(size).fill(0).map(() => initialValue));
    const generators: Perlin.SimplexNoise[] = new Array(octavesCount).fill(0).map(() => new Perlin.SimplexNoise());

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const octaves = generators.map((generator, i) => generator.noise(x / octavesMods[i], y / octavesMods[i]));
        const processed = processor(octaves);
        const interpretered = interpreter(processed);
        tmpmap[x][y] = interpretered;
      }
    }

    return tmpmap;
  }
}
