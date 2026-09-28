import type { Point, ScoringResult } from '../types';

export function scoreCircle(trajectory: Point[]): ScoringResult {
  if (trajectory.length < 5) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'No drawing detected' };
  }

  const cx = trajectory.reduce((s, p) => s + p.x, 0) / trajectory.length;
  const cy = trajectory.reduce((s, p) => s + p.y, 0) / trajectory.length;

  const radii = trajectory.map(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2));
  const avgRadius = radii.reduce((s, r) => s + r, 0) / radii.length;

  // Speed check: avgStepPx = total path length / number of steps
  const steps = trajectory.slice(1).map((p, i) =>
    Math.sqrt((p.x - trajectory[i].x) ** 2 + (p.y - trajectory[i].y) ** 2)
  );
  const totalPath = steps.reduce((s, d) => s + d, 0);
  const avgStepPx = steps.length > 0 ? totalPath / steps.length : 0;
  if (avgStepPx > 25) {
    return { score: 30, accuracy: 30, smoothness: 0, error: 'Too fast — slow down your hand' };
  }

  if (avgRadius < 20) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'Make the circle larger' };
  }

  const variance = radii.reduce((s, r) => s + (r - avgRadius) ** 2, 0) / radii.length;
  const normalizedStd = Math.sqrt(variance) / avgRadius;

  if (normalizedStd > 0.55) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'Try making a continuous circular movement' };
  }

  // Closure: last point near first
  const first = trajectory[0];
  const last = trajectory[trajectory.length - 1];
  const closureDist = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
  if (closureDist > avgRadius * 1.2) {
    return { score: 50, accuracy: 50, smoothness: 50, error: 'Complete the circle back to the start' };
  }

  // Smoothness: coefficient of variation of step sizes
  const avgStep = steps.length > 0 ? steps.reduce((s, d) => s + d, 0) / steps.length : 0;
  const smoothnessScore = avgStep === 0
    ? 100
    : Math.max(0, 100 - (Math.sqrt(steps.reduce((s, d) => s + (d - avgStep) ** 2, 0) / steps.length) / avgStep) * 100);

  // Accuracy: how consistently circular (mean |radius_i - avgRadius| / avgRadius)
  const avgDistToTemplate = radii.reduce((s, r) => s + Math.abs(r - avgRadius), 0) / radii.length;
  const accuracyScore = Math.max(0, (1 - avgDistToTemplate / avgRadius) * 100);

  // Coverage: what fraction of template circle (100 evenly-spaced points) is covered by drawn points
  const totalTemplatePoints = 100;
  const coverageThreshold = 0.05 * avgRadius;
  let covered = 0;
  for (let t = 0; t < totalTemplatePoints; t++) {
    const angle = (2 * Math.PI * t) / totalTemplatePoints;
    const tx = cx + avgRadius * Math.cos(angle);
    const ty = cy + avgRadius * Math.sin(angle);
    const nearest = Math.min(...trajectory.map(p => Math.sqrt((p.x - tx) ** 2 + (p.y - ty) ** 2)));
    if (nearest <= coverageThreshold) covered++;
  }
  const coverage = (covered / totalTemplatePoints) * 100;

  const score = Math.round(accuracyScore * 0.6 + coverage * 0.4);

  return {
    score,
    accuracy: Math.round(accuracyScore),
    smoothness: Math.round(smoothnessScore),
    error: null,
  };
}

export function getCircleErrors(trajectory: Point[]): string | null {
  return scoreCircle(trajectory).error;
}
