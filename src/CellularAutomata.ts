const shift = (cv: number, mv: number) => cv >= mv ? mv - cv : cv;

export type CellularAutomataRule = (posX: number, posY: number, prev: number) => number;

export class CellularAutomata {
  diff: { posX: number, posY: number, value: number }[] = [];
  cells: number[][] = [];
  width: number = 0;
  rules: CellularAutomataRule[] = [];

  constructor(width: number, initStateFiller?: (posX: number, posY: number) => number) {
    this.width = width;
    this.cells = new Array(width).fill(new Array(width).fill(0));
    this.cells = this.cells
      .map((row, posX) => row
        .map((zero, posY) => {
          const value = initStateFiller ? initStateFiller(posX, posY) : zero;
          this.diff.push({ posX, posY, value });
          return value;
        }),
      );
  }

  getNeighbours(radius: number, centerX: number, centerY: number) {
    let neighbours: { value: number; posX: number; posY: number; }[] = [];

    for (let cx = centerX - radius; cx <= centerX + radius; cx++) {
      if (!neighbours.some(n => n.posX === cx && n.posY === centerY - radius)) {
        neighbours.push({ value: this.cells.at(shift(cx, this.width - 1))?.at(shift(centerY - radius, this.width - 1)) || 0, posX: cx, posY: centerY - radius });
      }

      if (!neighbours.some(n => n.posX === cx && n.posY === centerY + radius)) {
        neighbours.push({ value: this.cells.at(shift(cx, this.width - 1))?.at(shift(centerY + radius, this.width - 1)) || 0, posX: cx, posY: centerY + radius });
      }
    }

    for (let cy = centerY - radius; cy <= centerY + radius; cy++) {
      if (!neighbours.some(n => n.posX === centerX - radius && n.posY === cy)) {
        neighbours.push({ value: this.cells.at(shift(centerX - radius, this.width - 1))?.at(shift(cy, this.width - 1)) || 0, posX: centerX - radius, posY: cy });
      }

      if (!neighbours.some(n => n.posX === centerX + radius && n.posY === cy)) {
        neighbours.push({ value: this.cells.at(shift(centerX + radius, this.width - 1))?.at(shift(cy, this.width - 1)) || 0, posX: centerX + radius, posY: cy });
      }
    }

    if (radius > 1) {
      neighbours = [...neighbours, ...this.getNeighbours(radius - 1, centerX, centerY)];
    }

    return neighbours;
  }

  pushRule(rule: CellularAutomataRule) {
    this.rules.push(rule);
  }

  tick() {
    const diff: { posX: number, posY: number, value: number }[] = [];
    this.rules.forEach((rule) => {
      const copy = structuredClone(this.cells);

      this.cells
        .forEach((row, posX) => {
          row.forEach((prev, posY) => {
            const next = rule(posX, posY, prev);
            copy[posX][posY] = next;

            if (prev !== next) {
              diff.push({ posX, posY, value: next });
            }
          });
        });

      this.cells = copy;
    });
    this.diff = diff;
  }
}
