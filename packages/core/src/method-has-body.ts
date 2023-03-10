export function method_has_body(method: string): boolean {
  return !['get', 'delete'].includes(method.toLowerCase());
}
