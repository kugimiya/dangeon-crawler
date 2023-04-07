export type CellularAutomataRule = (posX: number, posY: number, prev: number) => {
  value: number;
  extraChanges?: { posX: number; posY: number; value: number; }[];
};

export class CellularAutomata {
  diff: { posX: number, posY: number, value: number }[] = [];
  cells: number[][] = [];
  rules: CellularAutomataRule[] = [];
  width: number = 0;
  initStateFiller?: (posX: number, posY: number) => number;

  constructor(width: number, initStateFiller?: (posX: number, posY: number) => number) {
    this.width = width;
    this.initStateFiller = initStateFiller;
  }

  init() {
    this.cells = new Array(this.width).fill(new Array(this.width).fill(0));
    this.cells = this.cells
      .map((row, posX) => row
        .map((zero, posY) => {
          const value = this.initStateFiller ? this.initStateFiller(posX, posY) : zero;
          this.diff.push({ posX, posY, value });
          return value;
        }),
      );
  }

  getNeighbours(radius: number, centerX: number, centerY: number) {
    let neighbours: { value: number; posX: number; posY: number; }[] = [];

    for (let cy = centerY - radius; cy <= centerY + radius; cy++) {
      for (let cx = centerX - radius; cx <= centerX + radius; cx++) {
        const isGeomAllowed = cx > -1 && cx < this.width && cy > -1 && cy < this.width && (centerX === cx && centerY !== cy || centerX !== cx && centerY === cy);
        const isFillAllowed = !neighbours.some(_ => _.posX === cx && _.posY === cy);

        if (isGeomAllowed && isFillAllowed) {
          neighbours.push({
            value: this.cells[cx][cy], posX: cx, posY: cy,
          });
        }
      }
    }

    return neighbours;
  }

  pushRule(rule: CellularAutomataRule) {
    this.rules.push(rule);
  }

  tick(withDiff?: boolean) {
    const diff: { posX: number, posY: number, value: number }[] = [];
    this.rules.forEach((rule) => {
      const copy = structuredClone(this.cells);

      this.cells
        .forEach((row, posX) => {
          row.forEach((prev, posY) => {
            const { value, extraChanges } = rule(posX, posY, copy[posX][posY]);
            copy[posX][posY] = value;

            if (withDiff && prev !== value) {
              diff.push({ posX, posY, value });
            }

            if (extraChanges) {
              extraChanges.forEach((item) => {
                if (copy[item.posX][item.posY] !== undefined) {
                  if (withDiff && copy[item.posX][item.posY] !== item.value) {
                    diff.push({ posX: item.posX, posY: item.posY, value: item.value });
                  }

                  copy[item.posX][item.posY] = item.value;
                }
              });
            }
          });
        });

      this.cells = structuredClone(copy);
    });
    this.diff = diff;
  }
}
