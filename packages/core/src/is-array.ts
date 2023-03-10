export function is_array(array: unknown): array is readonly unknown[] {
  return Array.isArray(array);
}
