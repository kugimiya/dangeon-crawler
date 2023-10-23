export enum Tile {
  'wall',
  'road',
  'wallLeft',
  'wallRight',
  'wallTop',
  'wallBottom',
  'wallTopLeft',
  'wallBottomLeft',
  'wallTopRight',
  'wallBottomRight',
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
};

export enum Cell {
  'wall',
  'road',
  'block'
};

export enum Block {
  'torch',
  'chest'
};

export type MapCell = {
  type: Cell;
  tile: Tile;
  temperature: number;
  block: null | Block;
};
