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

export const inventoryItems = [
  InventoryItemType.coal,
  InventoryItemType.stone,
  InventoryItemType.wood,
  InventoryItemType.iron,
  InventoryItemType.oil,
  InventoryItemType.toolPickaxe,
  InventoryItemType.toolSword
];

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

  put(count: number, itemType: InventoryItemType) {
    const cellIndex = this.cells.findIndex((cell) => cell.itemType === itemType);
    if (cellIndex === -1) {
      this.cells[cellIndex].count = (this.cells[cellIndex].count || 0) + count;
    } else {
      this.cells.push({
        type: InventoryCellType.item,
        itemType: itemType,
        count
      });
    }
  }
}
