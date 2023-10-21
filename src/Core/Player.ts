export class Player {
  nickname: string = 'Player';
  clientId: string = '';
  position = { x: 0, y: 0 };
  pointer = { x: 0, y: 0 };
  hasMovement: boolean = false;

  serialize() {
    return {
      nickname: this.nickname,
      clientId: this.clientId,
      position: this.position,
      pointer: this.pointer,
    };
  }
}
