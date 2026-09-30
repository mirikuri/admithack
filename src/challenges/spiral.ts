import type { Point, ScoringResult } from '../types';

export function scoreSpiral(trajectory: Point[]): ScoringResult {
  if (trajectory.length < 10) {
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

  const cx = trajectory.reduce((s, p) => s + p.x, 0) / trajectory.length;
  const cy = trajectory.reduce((s, p) => s + p.y, 0) / trajectory.length;
  const radii = trajectory.map(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2));
  const maxRadius = Math.max(...radii);

  if (maxRadius < 40) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'Draw a larger spiral' };
  }

  // Count total angle swept to check for enough rotations
  const angles = trajectory.map(p => Math.atan2(p.y - cy, p.x - cx));
  let totalAngle = 0;
  for (let i = 1; i < angles.length; i++) {
    let da = angles[i] - angles[i - 1];
    if (da > Math.PI)  da -= 2 * Math.PI;
    if (da < -Math.PI) da += 2 * Math.PI;
    totalAngle += da;
  }
  const rotations = Math.abs(totalAngle) / (2 * Math.PI);

  if (rotations < 1) {
    return { score: 40, accuracy: 40, smoothness: 40, error: 'Draw at least 2 full rotations' };
  }

  // Check that radius grows (or shrinks) monotonically via linear regression
  const n = radii.length;
  const meanT = (n - 1) / 2;
  const meanR = radii.reduce((s, r) => s + r, 0) / n;
  let covTR = 0, varT = 0;
  for (let i = 0; i < n; i++) {
    covTR += (i - meanT) * (radii[i] - meanR);
    varT += (i - meanT) ** 2;
  }
  const slope = varT > 0 ? covTR / varT : 0;
  const normalizedSlope = Math.abs(slope) / (maxRadius / n);

  if (normalizedSlope < 0.08) {
    return { score: 30, accuracy: 30, smoothness: 30, error: 'Spiral outward from center — keep expanding' };
  }

  // Smoothed monotonicity check
  const win = Math.max(3, Math.floor(n / 20));
  const smooth: number[] = radii.map((_, i) => {
    const s = Math.max(0, i - win), e = Math.min(n - 1, i + win);
    const sl = radii.slice(s, e + 1);
    return sl.reduce((a, v) => a + v, 0) / sl.length;
  });
  let mono = 0;
  for (let i = 1; i < smooth.length; i++) {
    if (slope > 0 ? smooth[i] >= smooth[i - 1] : smooth[i] <= smooth[i - 1]) mono++;
  }
  const monotonicity = mono / (smooth.length - 1);

  const avgStep = totalPath / steps.length;
  const smoothnessScore = Math.max(
    0,
    100 - (Math.sqrt(steps.reduce((s, d) => s + (d - avgStep) ** 2, 0) / steps.length) / avgStep) * 100
  );

  const accuracyScore = Math.round(monotonicity * 70 + Math.min(1, rotations / 2.5) * 30);
  const score = Math.round(accuracyScore * 0.7 + smoothnessScore * 0.3);

  return { score, accuracy: accuracyScore, smoothness: Math.round(smoothnessScore), error: null };
}
