import { Tile, WorldMap, Player } from "@core/index.js";

const debug = false;

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
  lastPing: number = 0;
  frameStartedAt: number = 0;

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
      [Tile.wallBottomLeftInverted]: 'assets_wallBottomLeftInverted',
      [Tile.wallBottomLeftRight]: 'assets_wallBottomLeftRight',
      [Tile.wallBottomRightInverted]: 'assets_wallBottomRightInverted',
      [Tile.wallTopBottomLeftRight]: 'assets_wallTopBottomLeftRight',
      [Tile.wallTopLeftInverted]: 'assets_wallTopLeftInverted',
      [Tile.wallTopLeftRight]: 'assets_wallTopLeftRight',
      [Tile.wallTopRightInverted]: 'assets_wallTopRightInverted',
      [Tile.wallTopLeftRightInverted]: 'assets_wallTopLeftRightInverted',
      [Tile.wallTopLeftRightInvertedConnect]: 'assets_wallTopLeftRightInvertedConnect',
      [Tile.wallTopLeftLessRightInvertedConnect]: 'assets_wallTopLeftLessRightInvertedConnect',
      [Tile.wallTopLeftLessRightInvertedConnectInverted]: 'assets_wallTopLeftLessRightInvertedConnectInverted',
    };

    this.loaded = true;
  }

  draw(ctx: CanvasRenderingContext2D, getById: (elementId: string) => HTMLElement, players: Record<string, Player>) {
    this.frameStartedAt = Date.now();
    this.ctx = ctx;
    this.getById = getById;

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);

    this.drawTiles();
    this.drawPlayers(players);
    this.drawPointer();
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

    this.drawInfo();
  }

  getPointerOnScreenCords() {
    const drawSizeX = Math.round(this.windowWidth / this.tileSize);
    const drawSizeY = Math.round(this.windowHeight / this.tileSize);
    const pointerX = Math.round((this.player.pointer.x / this.windowWidth) * drawSizeX);
    const pointerY = Math.round((this.player.pointer.y / this.windowHeight) * drawSizeY);

    return { pointerX, pointerY };
  }

  getPointerCordsInWorld() {
    const drawSizeXMiddle = Math.round(Math.round(this.windowWidth / this.tileSize) / 2);
    const drawSizeYMiddle = Math.round(Math.round(this.windowHeight / this.tileSize) / 2);
    const { pointerX, pointerY } = this.getPointerOnScreenCords();

    const pointerWorldX = this.player.position.x + (pointerX - drawSizeXMiddle);
    const pointerWorldY = this.player.position.y + (pointerY - drawSizeYMiddle);

    return { pointerWorldX, pointerWorldY };
  }

  drawPointer() {
    const { pointerX, pointerY } = this.getPointerOnScreenCords();

    this.ctx.fillStyle = `rgba(255, 0, 0, 1)`;
    this.ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
    this.ctx.lineWidth = 5;
    this.ctx.lineJoin = 'bevel';
    this.ctx.strokeRect(pointerX * this.tileSize, pointerY * this.tileSize, this.tileSize, this.tileSize);

    if (debug) {
      const { pointerWorldX, pointerWorldY } = this.getPointerCordsInWorld();
      this.ctx.fillStyle = `rgba(255,255,255,1)`;
      this.ctx.fillText(`${pointerWorldX} ${pointerWorldY}`, pointerX * this.tileSize, pointerY * this.tileSize + 8);
    }
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

            this.ctx.fillStyle = `rgba(255,255,255,1)`;
            this.ctx.fillText(`${player.nickname}`, x * this.tileSize, y * this.tileSize + 8);
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
          this.drawTile(Tile.wall, x, y, 2, 2, this.lightMap.at(targetX)?.at(targetY));
        }
      }
    }
  }

  drawTile(tile: Tile, x: number, y: number, targetX: number, targetY: number, darkness: number) {
    if (!this.ctx || !this.loaded) {
      return;
    }

    const matrixShifts = [
      [[-1, -1], [0, -1], [1, -1]],
      [[-1,  0], [0,  0], [1,  0]],
      [[-1, +1], [0, +1], [1, +1]],
    ];
    const checkMatrix = (matrix: (Tile | undefined)[][], x: number, y: number) => {
      return matrix.every((column, xindex) => {
        return column.every((tile, yindex) => {
          if (tile === undefined) {
            return true;
          }

          return this.map.tiles?.at(targetX + matrixShifts[xindex][yindex][0])?.at(targetY + matrixShifts[xindex][yindex][1]) === tile;
        });
      });
    };

    const isTop = checkMatrix([
      [undefined, undefined, undefined],
      [Tile.wall, Tile.wall, Tile.wall],
      [undefined, Tile.road, undefined],
    ], targetX, targetY);

    const isBottom = checkMatrix([
      [undefined, Tile.road, undefined],
      [Tile.wall, Tile.wall, Tile.wall],
      [undefined, undefined, undefined],
    ], targetX, targetY);

    const isLeft = checkMatrix([
      [undefined, Tile.wall, undefined],
      [undefined, Tile.wall, Tile.road],
      [undefined, Tile.wall, undefined],
    ], targetX, targetY);

    const isRight = checkMatrix([
      [undefined, Tile.wall, undefined],
      [Tile.road, Tile.wall, undefined],
      [undefined, Tile.wall, undefined],
    ], targetX, targetY);
    

    const isTopLeft = checkMatrix([
      [undefined, undefined, undefined],
      [undefined, Tile.wall, Tile.wall],
      [undefined, Tile.wall, Tile.road],
    ], targetX, targetY);

    const isBottomLeft = checkMatrix([
      [undefined, Tile.wall, Tile.road],
      [undefined, Tile.wall, Tile.wall],
      [undefined, undefined, undefined],
    ], targetX, targetY);

    const isTopRight = checkMatrix([
      [undefined, Tile.wall, undefined],
      [Tile.wall, Tile.wall, undefined],
      [Tile.road, undefined, undefined],
    ], targetX, targetY);

    const isBottomRight = checkMatrix([
      [Tile.road, Tile.wall, undefined],
      [Tile.wall, Tile.wall, undefined],
      [undefined, undefined, undefined],
    ], targetX, targetY);


    const isTopBottomLeftRight = checkMatrix([
      [Tile.road, Tile.road, Tile.road],
      [Tile.road, Tile.wall, Tile.road],
      [Tile.road, Tile.road, Tile.road],
    ], targetX, targetY);
    

    const isBottomLeftInverted = checkMatrix([
      [Tile.road, Tile.road, undefined],
      [Tile.road, Tile.wall, Tile.wall],
      [undefined, Tile.wall, Tile.wall],
    ], targetX, targetY);

    const isBottomLeftRight = checkMatrix([
      [undefined, Tile.wall, undefined],
      [Tile.road, Tile.wall, Tile.road],
      [undefined, Tile.road, undefined],
    ], targetX, targetY);

    const isBottomRightInverted = checkMatrix([
      [undefined, Tile.road, Tile.road],
      [Tile.wall, Tile.wall, Tile.road],
      [Tile.wall, Tile.wall, undefined],
    ], targetX, targetY);

    const isTopLeftInverted = checkMatrix([
      [undefined, Tile.wall, undefined],
      [Tile.road, Tile.wall, Tile.wall],
      [undefined, Tile.road, undefined],
    ], targetX, targetY);

    const isTopLeftRight = checkMatrix([
      [undefined, Tile.road, undefined],
      [Tile.road, Tile.wall, Tile.road],
      [undefined, Tile.wall, undefined],
    ], targetX, targetY);

    const isTopRightInverted = checkMatrix([
      [undefined, Tile.wall, undefined],
      [Tile.wall, Tile.wall, Tile.road],
      [undefined, Tile.road, undefined],
    ], targetX, targetY);

    const isTopLeftRightInverted = checkMatrix([
      [undefined, Tile.wall, undefined],
      [Tile.road, Tile.wall, Tile.road],
      [undefined, Tile.road, undefined],
    ], targetX, targetY);

    const isTopLeftRightInvertedConnect = checkMatrix([
      [Tile.wall, Tile.wall, Tile.wall],
      [Tile.wall, Tile.wall, Tile.wall],
      [Tile.road, Tile.wall, Tile.road],
    ], targetX, targetY);

    const isTopLeftLessRightInvertedConnect = checkMatrix([
      [undefined, Tile.wall, undefined],
      [Tile.wall, Tile.wall, Tile.road],
      [Tile.road, Tile.wall, Tile.road],
    ], targetX, targetY);

    const isTopLeftLessRightInvertedConnectInverted = checkMatrix([
      [undefined, Tile.wall, undefined],
      [Tile.road, Tile.wall, Tile.wall],
      [Tile.road, Tile.wall, Tile.road],
    ], targetX, targetY);

    let _tile = tile;

    if (isBottomLeft) {
      _tile = Tile.wallBottomLeft;
    }

    if (isTopRight) {
      _tile = Tile.wallTopRight;
    }

    if (isBottomRight) {
      _tile = Tile.wallBottomRight;
    }

    if (isTop) {
      _tile = Tile.wallTop;
    }

    if (isTopLeft) {
      _tile = Tile.wallTopLeft;
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

    if (isTopBottomLeftRight) {
      _tile = Tile.wallTopBottomLeftRight;
    }

    if (isBottomLeftInverted) {
      _tile = Tile.wallBottomLeftInverted;
    }

    if (isBottomLeftRight) {
      _tile = Tile.wallBottomLeftRight;
    }

    if (isBottomRightInverted) {
      _tile = Tile.wallBottomRightInverted;
    }

    if (isTopLeftInverted) {
      _tile = Tile.wallTopLeftInverted;
    }

    if (isTopLeftRight) {
      _tile = Tile.wallTopLeftRight;
    }

    if (isTopRightInverted) {
      _tile = Tile.wallTopRightInverted;
    }

    if (isTopLeftRightInverted) {
      _tile = Tile.wallTopLeftRightInverted;
    }

    if (isTopLeftRightInvertedConnect) {
      _tile = Tile.wallTopLeftRightInvertedConnect;
    }

    if (isTopLeftLessRightInvertedConnect) {
      _tile = Tile.wallTopLeftLessRightInvertedConnect;
    }

    if (isTopLeftLessRightInvertedConnectInverted) {
      _tile = Tile.wallTopLeftLessRightInvertedConnectInverted;
    }

    try {
      const tileImg = this.getById(this.assets[_tile]) as HTMLImageElement;
      this.ctx.drawImage(tileImg, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

      if (this.globalLight) {
        this.ctx.fillStyle = `rgba(0,0,0,${darkness})`;
        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }

      if (debug) {
        this.ctx.fillStyle = `rgba(255,255,255,1)`;
        this.ctx.fillText(`${targetX} ${targetY}`, x * this.tileSize, y * this.tileSize + 8);
      }
    } catch {}
  }

  drawInfo() {
    this.ctx.font = "bold 8px monospace";
    this.ctx.fillStyle = `rgba(255,255,255,1)`;
    this.ctx.fillText(`x: ${this.player.position.x}, y: ${this.player.position.y}`, 0, 8);
    this.ctx.fillText(`clientId: ${this.player.clientId}`, 0, 16);
    this.ctx.fillText(`ping: ${this.lastPing}ms`, 0, 24);
    this.ctx.fillText(`frame time: ${Date.now() - this.frameStartedAt}ms`, 0, 32);
    this.ctx.fillText(`${Math.round(Math.min(60, 1000 / (Date.now() - this.frameStartedAt)))}fps`, 0, 40);
  }
}
