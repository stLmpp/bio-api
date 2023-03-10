import { is_array } from './is-array.js';

export function coerce_array<T>(possibleArray: T | T[] | readonly T[]): T[] {
  return is_array(possibleArray) ? [...possibleArray] : [possibleArray];
}
