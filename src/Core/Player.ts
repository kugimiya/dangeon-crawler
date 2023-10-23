export type PlayerSerialized = {
  nickname: string;
  clientId: string;
  position: { x: number, y: number };
  pointer: { x: number, y: number };
};

export class Player {
  nickname: string = 'Player';
  clientId: string = '';
  position = { x: 0, y: 0 };
  pointer = { x: 0, y: 0 };
  hasMovement: boolean = false;

  serialize(): PlayerSerialized {
    return {
      nickname: this.nickname,
      clientId: this.clientId,
      position: this.position,
      pointer: this.pointer,
    };
  }
}
