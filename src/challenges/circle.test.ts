import { describe, it, expect } from 'vitest';
import { scoreCircle } from './circle';
import type { Point } from '../types';

function makeCircle(cx: number, cy: number, r: number, n = 60): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n),
    y: cy + r * Math.sin((2 * Math.PI * i) / n),
  }));
}

describe('scoreCircle', () => {
  it('scores a perfect circle near 100', () => {
    const pts = makeCircle(300, 300, 100);
    const result = scoreCircle(pts);
    expect(result.score).toBeGreaterThan(80);
    expect(result.error).toBeNull();
  });

  it('returns error for empty trajectory', () => {
    const result = scoreCircle([]);
    expect(result.score).toBe(0);
    expect(result.error).toBe('No drawing detected');
  });

  it('returns error for very small circle', () => {
    const pts = makeCircle(300, 300, 10);
    const result = scoreCircle(pts);
    expect(result.error).toMatch(/larger/i);
  });

  it('returns error for a line (not circular)', () => {
    const pts = Array.from({ length: 50 }, (_, i) => ({ x: i * 5, y: 300 }));
    const result = scoreCircle(pts);
    expect(result.error).toMatch(/circular/i);
  });

  it('returns closure error when start/end far apart', () => {
    // Open arc: only 270 degrees
    const pts = Array.from({ length: 45 }, (_, i) => ({
      x: 300 + 100 * Math.cos((2 * Math.PI * i) / 60),
      y: 300 + 100 * Math.sin((2 * Math.PI * i) / 60),
    }));
    const result = scoreCircle(pts);
    expect(result.error).toMatch(/complete/i);
  });
});
