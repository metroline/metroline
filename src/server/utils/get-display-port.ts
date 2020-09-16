export function getDisplayPort(port: number): string {
  return port !== 80 && port !== 443 ? `:${port}` : '';
}
