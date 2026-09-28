export function erase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  ctx.clearRect(x - size / 2, y - size / 2, size, size);
}
