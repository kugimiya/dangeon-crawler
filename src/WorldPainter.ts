import { CanvasRenderingContext2D, Image, loadImage } from "skia-canvas";
import { Tile, WorldMap } from "./WorldMap.js";
import { Player } from "./Player.js";

export class WorldPainter {
  player: Player;
  map: WorldMap;
  tileSize: number;
  windowSize: number;
  ctx: CanvasRenderingContext2D;
  assets: Record<Tile, Image>;
  loaded = false;
  lightMap: number[][] = [];
  

  constructor(map: WorldMap, tileSize: number, windowSize: number, player: Player) {
    this.player = player;
    this.map = map;
    this.tileSize = tileSize;
    this.windowSize = windowSize;

    for (let x = 0; x < this.map.size; x++) {
      this.lightMap.push([]);
      for (let y = 0; y < this.map.size; y++) {
        this.lightMap[x].push(1);
      }
    }

    this.loadAssets().catch(console.error);
  }

  async loadAssets() {
    this.assets = {
      [Tile.wall]: await loadImage('assets/wall.png'),
      [Tile.road]: await loadImage('assets/road.png'),
      [Tile.wallBottom]: await loadImage('assets/wallBottom.png'),
      [Tile.wallTop]: await loadImage('assets/wallTop.png'),
      [Tile.wallLeft]: await loadImage('assets/wallLeft.png'),
      [Tile.wallRight]: await loadImage('assets/wallRight.png'),
      [Tile.wallTopLeft]: await loadImage('assets/wallTopLeft.png'),
      [Tile.wallBottomLeft]: await loadImage('assets/wallBottomLeft.png'),
      [Tile.wallTopRight]: await loadImage('assets/wallTopRight.png'),
      [Tile.wallBottomRight]: await loadImage('assets/wallBottomRight.png'),
    };

    this.loaded = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;

    this.drawTiles();
    // this.drawMap();
    this.drawPlayer();
  }

  drawPlayer() {
    const drawSize = Math.round(this.windowSize / this.tileSize);
    const position = (drawSize / 2);

    const pointerX = Math.round((this.player.pointer.x / this.windowSize) * drawSize);
    const pointerY = Math.round((this.player.pointer.y / this.windowSize) * drawSize);

    this.ctx.fillStyle = `rgba(255, 0, 0, 1)`;
    this.ctx.fillRect(position * this.tileSize, position * this.tileSize, this.tileSize, this.tileSize);

    this.ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
    this.ctx.fillRect(pointerX * this.tileSize, pointerY * this.tileSize, this.tileSize, this.tileSize);
  }

  drawMap() {
    if (!this.ctx) {
      return;
    }

    for (let x = 0; x < this.map.size; x++) {
      for (let y = 0; y < this.map.size; y++) {
        this.ctx.fillStyle = `rgba(${this.map.tiles[x][y] === Tile.road ? 255 : 0},${this.map.tiles[x][y] === Tile.road ? 255 : 0},${this.map.tiles[x][y] === Tile.road ? 255 : 0},1)`;
        this.ctx.fillRect(x / 2, y / 2, 1 / 2, 1 / 2);
      }
    }
  }

  drawTiles() {
    const lightMax = 10;
    const px = this.player.position.x;
    const py = this.player.position.y;
    const drawSize = Math.round(this.windowSize / this.tileSize);
    const drawXfrom = px - (drawSize / 2);
    const drawYfrom = py - (drawSize / 2);

    for (let angle = 0; angle < 360; angle += 0.5) {
      let step = 0;

      while (step < lightMax) {
        step += 0.1;

        const nextX = Math.round((px) + ((Math.cos(angle * (Math.PI / 180))) * step));
        const nextY = Math.round((py) + ((Math.sin(angle * (Math.PI / 180))) * step));

        if (this.lightMap[nextX] !== undefined) {
          if (this.lightMap[nextX][nextY] !== undefined) {
            const nextLight = Math.min(0.8, (step / lightMax) / (lightMax / 10));
            this.lightMap[nextX][nextY] = nextLight;
          }
        }

        const tileColumn = this.map.tiles[nextX];
        if (tileColumn !== undefined) {
          const tile = tileColumn[nextY];
          if (tile !== undefined) {
            if (tile === Tile.wall) {
              step = lightMax;
            }
          }
        }
      }
    }

    for (let x = 0; x < drawSize; x++) {
      for (let y = 0; y < drawSize; y++) {
        const targetX = drawXfrom + x;
        const targetY = drawYfrom + y;

        const tileColumn = this.map.tiles[targetX];
        if (tileColumn) {
          const tile = tileColumn[targetY];

          if (tile !== undefined) {
            this.drawTile(tile, x, y, targetX, targetY, this.lightMap.at(targetX)?.at(targetY) || 0.8);
          } else {
            this.drawTile(Tile.wall, x, y, 2, 2, this.lightMap.at(targetX)?.at(targetY));
          }
        } else {
          this.drawTile(Tile.wall, x, y, 2, 2, this.lightMap.at(targetX)?.at(targetY));
        }
      }
    }
  }

  drawTile(tile: Tile, x: number, y: number, targetX: number, targetY: number, darkness: number) {
    if (!this.ctx || !this.loaded) {
      return;
    }

    const isTop =         this.map.tiles.at(targetX).at(targetY + 1) === Tile.road && tile === Tile.wall;
    const isBottom =      this.map.tiles.at(targetX).at(targetY - 1) === Tile.road && tile === Tile.wall;
    const isLeft =        this.map.tiles.at(targetX + 1).at(targetY) === Tile.road && tile === Tile.wall;
    const isRight =       this.map.tiles.at(targetX - 1).at(targetY) === Tile.road && tile === Tile.wall;
    const isTopLeft =     this.map.tiles.at(targetX + 1).at(targetY + 1) === Tile.road && this.map.tiles.at(targetX + 1).at(targetY) === Tile.wall && this.map.tiles.at(targetX).at(targetY + 1) === Tile.wall && tile === Tile.wall;
    const isBottomLeft =  this.map.tiles.at(targetX + 1).at(targetY - 1) === Tile.road && this.map.tiles.at(targetX + 1).at(targetY) === Tile.wall && this.map.tiles.at(targetX).at(targetY - 1) === Tile.wall && tile === Tile.wall;
    const isTopRight =    this.map.tiles.at(targetX - 1).at(targetY + 1) === Tile.road && this.map.tiles.at(targetX - 1).at(targetY) === Tile.wall && this.map.tiles.at(targetX).at(targetY - 1) === Tile.wall && tile === Tile.wall;
    const isBottomRight = this.map.tiles.at(targetX - 1).at(targetY - 1) === Tile.road && this.map.tiles.at(targetX - 1).at(targetY) === Tile.wall && this.map.tiles.at(targetX).at(targetY + 1) === Tile.wall && tile === Tile.wall;

    let _tile = tile;

    if (isTop) {
      _tile = Tile.wallTop;
    }

    if (isBottom) {
      _tile = Tile.wallBottom;
    }

    if (isLeft) {
      _tile = Tile.wallLeft;
    }

    if (isRight) {
      _tile = Tile.wallRight;
    }

    if (isTopLeft) {
      _tile = Tile.wallTopLeft;
    }

    if (isBottomLeft) {
      _tile = Tile.wallBottomLeft;
    }

    if (isTopRight) {
      _tile = Tile.wallTopRight;
    }

    if (isBottomRight) {
      _tile = Tile.wallBottomRight;
    }

    this.ctx.drawImage(this.assets[_tile], x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
    this.ctx.fillStyle = `rgba(0,0,0,${darkness})`;
    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
  }
}
