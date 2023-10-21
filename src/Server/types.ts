export type PlayerState = {
  pressedKey: null | 'Up' | 'Down' | 'Left' | 'Right';
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
    x: number;
    y: number;
  }
};