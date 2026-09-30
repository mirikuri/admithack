import type { Point, ScoringResult } from '../types';

export function scoreSquare(trajectory: Point[]): ScoringResult {
  if (trajectory.length < 8) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'No drawing detected' };
  }

  const steps = trajectory.slice(1).map((p, i) =>
    Math.sqrt((p.x - trajectory[i].x) ** 2 + (p.y - trajectory[i].y) ** 2)
  );
  const totalPath = steps.reduce((s, d) => s + d, 0);
  const avgStepPx = steps.length > 0 ? totalPath / steps.length : 0;
  if (avgStepPx > 25) {
    return { score: 30, accuracy: 30, smoothness: 0, error: 'Too fast — slow down your hand' };
  }

  const minX = Math.min(...trajectory.map(p => p.x));
  const maxX = Math.max(...trajectory.map(p => p.x));
  const minY = Math.min(...trajectory.map(p => p.y));
  const maxY = Math.max(...trajectory.map(p => p.y));
  const w = maxX - minX;
  const h = maxY - minY;
  const size = Math.max(w, h);

  if (size < 40) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'Draw a larger square' };
  }

  const aspectRatio = Math.min(w, h) / Math.max(w, h);
  if (aspectRatio < 0.45) {
    return { score: 30, accuracy: 30, smoothness: 30, error: 'Try to draw a square, not a rectangle' };
  }

  const threshold = size * 0.18;
  const topPts   = trajectory.filter(p => Math.abs(p.y - minY) < threshold);
  const bottomPts = trajectory.filter(p => Math.abs(p.y - maxY) < threshold);
  const leftPts  = trajectory.filter(p => Math.abs(p.x - minX) < threshold);
  const rightPts = trajectory.filter(p => Math.abs(p.x - maxX) < threshold);

  if (Math.min(topPts.length, bottomPts.length, leftPts.length, rightPts.length) < 3) {
    return { score: 40, accuracy: 40, smoothness: 0, error: 'Make sure to draw all 4 sides' };
  }

  const first = trajectory[0];
  const last  = trajectory[trajectory.length - 1];
  const closureDist = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
  if (closureDist > size * 0.35) {
    return { score: 50, accuracy: 50, smoothness: 50, error: 'Close the square back to the start' };
  }

  function straightness(pts: Point[], axis: 'x' | 'y'): number {
    if (pts.length < 2) return 100;
    const vals = pts.map(p => p[axis]);
    const avg  = vals.reduce((s, v) => s + v, 0) / vals.length;
    const span = Math.max(...vals) - Math.min(...vals);
    if (span === 0) return 100;
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length);
    return Math.max(0, 100 - (std / span) * 100);
  }

  const avgStraightness = (
    straightness(topPts, 'y') +
    straightness(bottomPts, 'y') +
    straightness(leftPts, 'x') +
    straightness(rightPts, 'x')
  ) / 4;

  const avgStep = totalPath / steps.length;
  const smoothnessScore = Math.max(
    0,
    100 - (Math.sqrt(steps.reduce((s, d) => s + (d - avgStep) ** 2, 0) / steps.length) / avgStep) * 100
  );

  const accuracyScore = Math.round(aspectRatio * 40 + avgStraightness * 0.6);
  const score = Math.round(accuracyScore * 0.7 + smoothnessScore * 0.3);

  return { score, accuracy: accuracyScore, smoothness: Math.round(smoothnessScore), error: null };
}
