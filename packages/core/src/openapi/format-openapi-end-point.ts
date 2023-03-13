export function format_openapi_end_point(path: string): string {
  return path
    .split('/')
    .map((item) => {
      if (!item.startsWith(':')) {
        return item;
      }
      return `{${item.replace(/^:/, '')}}`;
    })
    .join('/');
}
