import { GameObject, GameObjectChest, GameObjectTorch } from "@core/GameObject";
import { InventoryCell } from "@core/Inventory";
import { PlayerSerialized } from "@core/Player";
import { MapCell } from "@core/types";
import { PlayerState } from "@server/types";

export type MapDiff = {
  x: number;
  y: number;
  cell: MapCell;
}

type PingAction = {
  type: 'ping';
  delta: number;
};

type LoginAction = {
  type: 'login';
  player: PlayerSerialized;
}

type KeyboardAction = {
  type: 'keyboard';
  text: string;
}

type ReSyncMapAction = {
  type: 're-sync-map';
  diffs: MapDiff[];
};

type SyncMapAction = {
  type: 'sync-map';
  map: {
    map: MapCell[][];
    size: number;
  };
};

type SyncPlayersAction = {
  type: 'sync-players';
  players: Record<string, PlayerSerialized>;
  playersState: Record<string, PlayerState>;
};

type SyncInventories = {
  type: 'sync-inventories';
  data: Record<string, InventoryCell[]>;
}

type SyncGameObjects = {
  type: 'sync-game-objects';
  data: Record<string, ReturnType<GameObject['serialize']> | ReturnType<GameObjectTorch['serialize']> | ReturnType<GameObjectChest['serialize']>>;
}

type PlayerPosAction = {
  type: 'player-pos';
  playerPosition: { 
    x: number; 
    y: number; 
  };
};

export type ClientAction = {
  error?: string;
  message?: PingAction
  | LoginAction
  | KeyboardAction
  | ReSyncMapAction
  | SyncMapAction
  | SyncPlayersAction
  | PlayerPosAction
  | SyncInventories
  | SyncGameObjects;
};
