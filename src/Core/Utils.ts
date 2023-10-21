export function getRandomFromArray<T>(list: T[]) {
  return list[Math.floor((Math.random()*list.length))];
}
