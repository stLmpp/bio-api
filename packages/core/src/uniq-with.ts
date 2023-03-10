/**
 * @description Filter only unique items of an array with the help of a comparator callback
 * Useful if you need to use multiple keys or a special condition
 */
export function uniq_with<T>(
  array: readonly T[],
  comparator: (valueA: T, valueB: T) => boolean
): T[] {
  const set = new Set<number>();
  const len = array.length;
  for (let i = 0; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      const value_a = array[i];
      const value_b = array[j];
      if (comparator(value_a, value_b)) {
        set.add(i);
        break;
      }
    }
  }
  return array.filter((_, index) => !set.has(index));
}
