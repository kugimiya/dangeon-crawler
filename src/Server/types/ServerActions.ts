type LoginAction = {
  action: 'login';
  payload: {
    nickname: string;
  };
};

type CloseAction = {
  action: 'close';
};

type PingAction = {
  action: 'ping';
  payload: {
    sendTime: number;
  };
};

type SyncPlayersAction = {
  action: 'sync-players';
};

type SyncMapAction = {
  action: 'sync-map';
};

type KeyboardAction = {
  action: 'keyboard';
  payload: {
    key: 'Up' | 'Down' | 'Left' | 'Right';
    type: 'up' | 'down';
  }
};

type MouseAction = {
  action: 'mouse';
  payload: {
    type: 'up' | 'down';
    x: number;
    y: number;
  }
};

export type ServerAction = LoginAction
  | CloseAction
  | PingAction
  | SyncPlayersAction
  | SyncMapAction
  | KeyboardAction
  | MouseAction;
