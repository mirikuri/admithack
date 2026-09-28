import type { Point, ScoringResult } from '../types';

function findLocalExtrema(pts: Point[]): { peaks: Point[]; valleys: Point[] } {
  const cx = pts.reduce((s, q) => s + q.x, 0) / pts.length;
  const cy = pts.reduce((s, q) => s + q.y, 0) / pts.length;
  const radii = pts.map(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2));

  const win = Math.max(3, Math.floor(pts.length / 20));
  const peaks: Point[] = [];
  const valleys: Point[] = [];

  for (let i = win; i < radii.length - win; i++) {
    const before = radii.slice(i - win, i);
    const after = radii.slice(i + 1, i + win + 1);
    const isPeak = before.every(r => r <= radii[i]) && after.every(r => r <= radii[i]);
    const isValley = before.every(r => r >= radii[i]) && after.every(r => r >= radii[i]);
    if (isPeak) peaks.push(pts[i]);
    if (isValley) valleys.push(pts[i]);
  }
  return { peaks, valleys };
}

export function scoreStar(trajectory: Point[]): ScoringResult {
  if (trajectory.length < 10) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'No drawing detected' };
  }

  const { peaks } = findLocalExtrema(trajectory);

  if (peaks.length < 3) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'The star has too few points — try sharper corners' };
  }

  if (peaks.length < 5) {
    return { score: 40, accuracy: 40, smoothness: 50, error: `Only ${peaks.length} points found — aim for 5` };
  }

  const accuracy = Math.min(100, 60 + peaks.length * 8);
  return {
    score: Math.round(accuracy),
    accuracy: Math.round(accuracy),
    smoothness: 70,
    error: null,
  };
}
