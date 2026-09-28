import { describe, it, expect } from 'vitest';
import { scoreTriangle } from './triangle';
import type { Point } from '../types';

function makeTriangle(): Point[] {
  // Equilateral triangle, 60 points
  const corners = [
    { x: 300, y: 150 }, { x: 450, y: 400 }, { x: 150, y: 400 },
  ];
  const pts: Point[] = [];
  for (let i = 0; i < 3; i++) {
    const from = corners[i];
    const to = corners[(i + 1) % 3];
    for (let j = 0; j < 20; j++) {
      pts.push({
        x: from.x + (to.x - from.x) * (j / 20),
        y: from.y + (to.y - from.y) * (j / 20),
      });
    }
  }
  return pts;
}

describe('scoreTriangle', () => {
  it('scores a perfect triangle near 80+', () => {
    expect(scoreTriangle(makeTriangle()).score).toBeGreaterThan(70);
  });

  it('returns error for empty trajectory', () => {
    expect(scoreTriangle([]).error).toBe('No drawing detected');
  });

  it('returns error when fewer than 3 corners detected', () => {
    // Straight line — no corners
    const pts = Array.from({ length: 40 }, (_, i) => ({ x: i * 5, y: 300 }));
    expect(scoreTriangle(pts).error).toMatch(/3 clear corners/i);
  });
});
