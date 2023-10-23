export type PlayerSerialized = {
  nickname: string;
  clientId: string;
  position: { x: number, y: number };
  inventoryId: string;
};

export class Player {
  nickname: string = 'Player';
  clientId: string = '';
  position = { x: 0, y: 0 };
  inventoryId: string = '';
  
  // client-side fields
  pointer = { x: 0, y: 0 };
  hasMovement: boolean = false;

  serialize(): PlayerSerialized {
    return {
      nickname: this.nickname,
      clientId: this.clientId,
      position: this.position,
      inventoryId: this.inventoryId,
    };
  }

  unserialize(data: PlayerSerialized) {
    this.nickname = data.nickname;
    this.clientId = data.clientId;
    this.position = data.position;
    this.inventoryId = data.inventoryId;
  }
}
