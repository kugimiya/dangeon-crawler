import { PlayerSerialized } from "@core/Player";
import { MapCell } from "@core/types";
import { PlayerState } from "@server/types";

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
  map: {
    map: MapCell[][];
    size: number;
  };
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
  | PlayerPosAction;
};
