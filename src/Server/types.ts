export type PlayerState = {
  pressedKey: null | 'Up' | 'Down' | 'Left' | 'Right';
  clickAt: null | { x: number, y: number; when: number };
}

export * from './types/ServerActions';
export * from './types/ClientActions';
