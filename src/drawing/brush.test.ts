import { describe, it, expect, vi } from 'vitest';
import { drawLine } from './brush';

function makeCtx() {
  return {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    lineWidth: 0,
    strokeStyle: '',
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
  };
}

describe('drawLine', () => {
  it('calls moveTo and lineTo with correct points', () => {
    const ctx = makeCtx();
    drawLine(ctx as unknown as CanvasRenderingContext2D, { x: 10, y: 20 }, { x: 30, y: 40 }, 5, '#ff0000');
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(30, 40);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('sets lineWidth and strokeStyle', () => {
    const ctx = makeCtx();
    drawLine(ctx as unknown as CanvasRenderingContext2D, { x: 0, y: 0 }, { x: 1, y: 1 }, 12, '#00ff00');
    expect(ctx.lineWidth).toBe(12);
    expect(ctx.strokeStyle).toBe('#00ff00');
  });
});
