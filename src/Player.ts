import { Tile, WorldMap } from "./WorldMap.js";

export class Player {
  moveTime = 150;
  lastMoveTime = Date.now();
  moveTargets: Set<string> = new Set();
  position = { x: 0, y: 0 };
  pointer = { x: 0, y: 0 };
  map: WorldMap;

  appendMap(map: WorldMap) {
    this.map = map;
  }

  processMove() {
    if (Date.now() - this.lastMoveTime < this.moveTime) {
      return;
    }

    if (this.moveTargets.has('left')) {
      if (this.map.tiles[this.position.x - 1][this.position.y] !== Tile.wall) {
        this.position.x -= 1;
      }
    }

    if (this.moveTargets.has('right')) {
      if (this.map.tiles[this.position.x + 1][this.position.y] !== Tile.wall) {
        this.position.x += 1;
      }
    }

    if (this.moveTargets.has('up')) {
      if (this.map.tiles[this.position.x][this.position.y - 1] !== Tile.wall) {
        this.position.y -= 1;
      }
    }

    if (this.moveTargets.has('down')) {
      if (this.map.tiles[this.position.x][this.position.y + 1] !== Tile.wall) {
        this.position.y += 1;
      }
    }

    this.lastMoveTime = Date.now();
  }

  startMoveLeft() {
    this.moveTargets.add('left');
  }

  startMoveRight() {
    this.moveTargets.add('right');
  }

  startMoveUp() {
    this.moveTargets.add('up');
  }

  startMoveDown() {
    this.moveTargets.add('down');
  }

  stopMoveLeft() {
    this.moveTargets.delete('left');
  }

  stopMoveRight() {
    this.moveTargets.delete('right');
  }

  stopMoveUp() {
    this.moveTargets.delete('up');
  }

  stopMoveDown() {
    this.moveTargets.delete('down');
  }
}
