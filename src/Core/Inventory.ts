import { nanoid } from "nanoid";

export enum InventoryCellType {
  'object',
  'item'
}

export enum InventoryItemType {
  'stone',
  'coal',
  'wood',
  'iron',
  'oil',
  'toolPickaxe',
  'toolSword'
}

export const itemTypeMap = {
  [InventoryItemType.coal]: 'coal',
  [InventoryItemType.stone]: 'stone',
  [InventoryItemType.wood]: 'wood',
  [InventoryItemType.iron]: 'iron',
  [InventoryItemType.oil]: 'oil',
  [InventoryItemType.toolPickaxe]: 'toolPickaxe',
  [InventoryItemType.toolSword]: 'toolSword'
}

export type InventoryCell = {
  type: InventoryCellType;
  itemType?: InventoryItemType;
  gameObjectId?: string;
  count?: number;
}

export class Inventory {
  id: string;
  cells: InventoryCell[] = [];

  constructor() {
    this.id = nanoid(8);
  }
}
