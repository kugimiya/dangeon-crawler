import { Tile, WorldMap, Player } from "@core/index.js";

export class WorldPainter {
  player: Player;
  map: WorldMap;
  tileSize: number;
  windowWidth: number;
  windowHeight: number;
  ctx: CanvasRenderingContext2D;
  getById: (elementId: string) => HTMLElement;
  assets: Record<Tile, string>;
  playerAssets = {
    idle: { at: 'assets_playerIdle', frames: 4, frame: 1 },
    walk: { at: 'assets_playerWalk', frames: 6, frame: 6 },
  };
  loaded = false;
  lightMap: number[][] = [];
  count = 0;
  globalLight = true;

  constructor(map: WorldMap, tileSize: number, windowWidth: number, windowHeight: number, player: Player) {
    this.player = player;
    this.map = map;
    this.tileSize = tileSize;
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;

    for (let x = 0; x < this.map.size; x++) {
      this.lightMap.push([]);
      for (let y = 0; y < this.map.size; y++) {
        this.lightMap[x].push(1);
      }
    }

    this.loadAssets().catch(console.error);
  }

  toggleGlobalLight() {
    this.globalLight = !this.globalLight;
  }

  async loadAssets() {
    this.assets = {
      [Tile.wall]: 'assets_wall',
      [Tile.road]: 'assets_road',
      [Tile.wallBottom]: 'assets_wallBottom',
      [Tile.wallTop]: 'assets_wallTop',
      [Tile.wallLeft]: 'assets_wallLeft',
      [Tile.wallRight]: 'assets_wallRight',
      [Tile.wallTopLeft]: 'assets_wallTopLeft',
      [Tile.wallBottomLeft]: 'assets_wallBottomLeft',
      [Tile.wallTopRight]: 'assets_wallTopRight',
      [Tile.wallBottomRight]: 'assets_wallBottomRight',
    };

    this.loaded = true;
  }

  draw(ctx: CanvasRenderingContext2D, getById: (elementId: string) => HTMLElement, players: Record<string, Player>) {
    this.ctx = ctx;
    this.getById = getById;

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);

    this.drawTiles();
    this.drawPlayers(players);
    // this.drawMap();

    this.count = this.count + 1;
    if (this.count % 15 === 0) {
      this.playerAssets.idle.frame = this.playerAssets.idle.frame + 1;
      if (this.playerAssets.idle.frame === this.playerAssets.idle.frames + 1) {
        this.playerAssets.idle.frame = 1;
      }
    }

    if (this.count % 2 === 0) {
      this.playerAssets.walk.frame = this.playerAssets.walk.frame + 1;
      if (this.playerAssets.walk.frame === this.playerAssets.walk.frames + 1) {
        this.playerAssets.walk.frame = 1;
      }
    }
  }

  drawPointer() {
    const drawSizeX = Math.round(this.windowWidth / this.tileSize);
    const drawSizeY = Math.round(this.windowHeight / this.tileSize);
    const pointerX = Math.round((this.player.pointer.x / this.windowWidth) * drawSizeX);
    const pointerY = Math.round((this.player.pointer.y / this.windowHeight) * drawSizeY);
    this.ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
    this.ctx.fillRect(pointerX * this.tileSize, pointerY * this.tileSize, this.tileSize, this.tileSize);
  }

  drawPlayers(players: Record<string, Player>) {
    let tile = this.getById(this.playerAssets.idle.at) as HTMLImageElement;
    let cutFromX = (this.playerAssets.idle.frame - 1) * 32;

    const px = this.player.position.x;
    const py = this.player.position.y;
    const drawSizeX = Math.round(this.windowWidth / this.tileSize);
    const drawSizeY = Math.round(this.windowHeight / this.tileSize);
    const drawXfrom = px - Math.round(drawSizeX / 2);
    const drawYfrom = py - Math.round(drawSizeY / 2);

    Object.values(players).forEach((player) => {
      const isThisPlayer = player.clientId === this.player.clientId;
      if (isThisPlayer && this.player.hasMovement) {
        tile = this.getById(this.playerAssets.walk.at) as HTMLImageElement;
        cutFromX = (this.playerAssets.walk.frame - 1) * 32;
      }

      for (let x = 0; x < drawSizeX; x++) {
        for (let y = 0; y < drawSizeY; y++) {
          const targetX = drawXfrom + x;
          const targetY = drawYfrom + y;
  
          if (player.position.x === targetX && player.position.y === targetY) {
            this.ctx.drawImage(tile, cutFromX, 0, 32, 32, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
          }
        }
      }
    });
  }

  drawMap() {
    const mod = 1;

    if (!this.ctx) {
      return;
    }

    for (let x = 0; x < this.map.size; x++) {
      for (let y = 0; y < this.map.size; y++) {
        this.ctx.fillStyle = `rgba(${this.map.tiles[x][y] === Tile.road ? 255 : 0},${this.map.tiles[x][y] === Tile.road ? 255 : 0},${this.map.tiles[x][y] === Tile.road ? 255 : 0},1)`;
        this.ctx.fillRect(x / mod, y / mod, 1 / mod, 1 / mod);
      }
    }
  }

  drawTiles() {
    const lightMax = 10;
    const px = this.player.position.x;
    const py = this.player.position.y;
    const drawSizeX = Math.round(this.windowWidth / this.tileSize);
    const drawSizeY = Math.round(this.windowHeight / this.tileSize);
    const drawXfrom = px - Math.round(drawSizeX / 2);
    const drawYfrom = py - Math.round(drawSizeY / 2);

    // restore dimmed lights
    this.lightMap.forEach((column, x) => {
      column.forEach((lightValue, y) => {
        if (lightValue !== 1) {
          this.lightMap[x][y] = 0.85;
        }
      });
    });

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

    for (let x = 0; x < drawSizeX; x++) {
      for (let y = 0; y < drawSizeY; y++) {
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
          if (this.count % 10 === 0) {
            console.log({ drawSizeX, drawSizeY, x, y, targetX, targetY })
          }

          this.drawTile(Tile.wall, x, y, 2, 2, this.lightMap.at(targetX)?.at(targetY));
        }
      }
    }
  }

  drawTile(tile: Tile, x: number, y: number, targetX: number, targetY: number, darkness: number) {
    if (!this.ctx || !this.loaded) {
      return;
    }

    const isTop =         this.map.tiles?.at(targetX)?.at(targetY + 1) === Tile.road && tile === Tile.wall;
    const isBottom =      this.map.tiles?.at(targetX)?.at(targetY - 1) === Tile.road && tile === Tile.wall;
    const isLeft =        this.map.tiles?.at(targetX + 1)?.at(targetY) === Tile.road && tile === Tile.wall;
    const isRight =       this.map.tiles?.at(targetX - 1)?.at(targetY) === Tile.road && tile === Tile.wall;
    const isTopLeft =     this.map.tiles?.at(targetX + 1)?.at(targetY + 1) === Tile.road && this.map.tiles?.at(targetX + 1)?.at(targetY) === Tile.wall && this.map.tiles?.at(targetX)?.at(targetY + 1) === Tile.wall && tile === Tile.wall;
    const isBottomLeft =  this.map.tiles?.at(targetX + 1)?.at(targetY - 1) === Tile.road && this.map.tiles?.at(targetX + 1)?.at(targetY) === Tile.wall && this.map.tiles?.at(targetX)?.at(targetY - 1) === Tile.wall && tile === Tile.wall;
    const isTopRight =    this.map.tiles?.at(targetX - 1)?.at(targetY + 1) === Tile.road && this.map.tiles?.at(targetX - 1)?.at(targetY) === Tile.wall && this.map.tiles?.at(targetX)?.at(targetY - 1) === Tile.wall && tile === Tile.wall;
    const isBottomRight = this.map.tiles?.at(targetX - 1)?.at(targetY - 1) === Tile.road && this.map.tiles?.at(targetX - 1)?.at(targetY) === Tile.wall && this.map.tiles?.at(targetX)?.at(targetY + 1) === Tile.wall && tile === Tile.wall;

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

    const tileImg = this.getById(this.assets[_tile]) as HTMLImageElement;
    this.ctx.drawImage(tileImg, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

    if (this.globalLight) {
      this.ctx.fillStyle = `rgba(0,0,0,${darkness})`;
      this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
    }
  }
}
