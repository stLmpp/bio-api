import { type IncomingHttpHeaders } from 'http';

export function format_headers(
  headers: IncomingHttpHeaders | Record<string, unknown>
): Record<string, string> {
  const initial_value: Record<string, string> = {};
  return Object.entries(headers).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map((item) => String(item)).join(', ');
    }
    if (typeof value !== 'undefined') {
      acc[key] = String(value);
    }
    return acc;
  }, initial_value);
}
