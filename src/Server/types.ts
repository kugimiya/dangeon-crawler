export type PlayerState = {
  pressedKey: null | 'Up' | 'Down' | 'Left' | 'Right';
  clickAt: null | { x: number, y: number; when: number };
}

export type ClientAction = {
  action: 'login';
  payload: {
    nickname: string;
  };
} 
| {
  action: 'close';
} 
| {
  action: 'ping';
  payload: {
    sendTime: number;
  };
} 
| {
  action: 'sync-players';
} 
| {
  action: 'sync-map';
} 
| {
  action: 'keyboard';
  payload: {
    key: 'Up' | 'Down' | 'Left' | 'Right';
    type: 'up' | 'down';
  }
}
| {
  action: 'mouse';
  payload: {
    type: 'up' | 'down';
    x: number;
    y: number;
  }
};
