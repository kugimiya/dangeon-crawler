export function getRandomFromArray<T>(list: T[]) {
  return list[Math.floor((Math.random()*list.length))];
}

export function newArray(size: number) {
  return (new Array(size)).fill(null);
}
