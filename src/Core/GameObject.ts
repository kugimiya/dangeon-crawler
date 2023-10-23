import { nanoid } from 'nanoid';

export enum GameObjectType {
  'torch', 'chest'
}

type TypeMap = {
  [GameObjectType.chest]: GameObjectChest,
  [GameObjectType.torch]: GameObjectTorch,
}

export const GameObjectFactory = (type: GameObjectType): TypeMap[typeof type] => {
  if (type === GameObjectType.chest) {
    return new GameObjectChest('null');
  } 

  if (type === GameObjectType.torch) {
    return new GameObjectTorch();
  }
}

export abstract class GameObject {
  id: string;
  type: GameObjectType;

  constructor() {
    this.id = nanoid(8);
  }

  serialize() {
    return {
      id: this.id,
      type: this.type
    };
  }

  unserialize({ id, type }: ReturnType<this['serialize']>) {
    this.id = id;
    this.type = type;
  }
}

export class GameObjectTorch extends GameObject {
  constructor() {
    super();
    this.type = GameObjectType.torch;
  }
}

export class GameObjectChest extends GameObject {
  inventoryId: string;

  constructor(inventoryId: string) {
    super();
    this.type = GameObjectType.chest;
    this.inventoryId = inventoryId;
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      inventoryId: this.inventoryId,
    };
  }

  unserialize({ id, type, inventoryId }: ReturnType<this['serialize']>): void {
    this.id = id;
    this.type = type;
    this.inventoryId = inventoryId;
  }
}
