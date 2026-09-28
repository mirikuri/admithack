import type { Point } from '../types';

export function drawLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  size: number,
  color: string,
): void {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}
