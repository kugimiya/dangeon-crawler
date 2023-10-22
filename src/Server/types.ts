export type PlayerState = {
  pressedKey: null | 'Up' | 'Down' | 'Left' | 'Right';
  clickAt: null | { x: number, y: number; when: number };
}

export type LoginAction = {
  action: 'login';
  payload: {
    nickname: string;
  };
};

export type CloseAction = {
  action: 'close';
};

export type PingAction = {
  action: 'ping';
  payload: {
    sendTime: number;
  };
};

export type SyncPlayersAction = {
  action: 'sync-players';
};

export type SyncMapAction = {
  action: 'sync-map';
};

export type KeyboardAction = {
  action: 'keyboard';
  payload: {
    key: 'Up' | 'Down' | 'Left' | 'Right';
    type: 'up' | 'down';
  }
};

export type MouseAction = {
  action: 'mouse';
  payload: {
    type: 'up' | 'down';
    x: number;
    y: number;
  }
};

export type ClientAction = LoginAction
  | CloseAction
  | PingAction
  | SyncPlayersAction
  | SyncMapAction
  | KeyboardAction
  | MouseAction;
