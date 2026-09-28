import type { Point, ScoringResult } from '../types';

function detectCorners(pts: Point[], minAngleDeg = 30): Point[] {
  if (pts.length < 6) return [];

  const win = Math.max(3, Math.floor(pts.length / 15));
  // Minimum separation between corners (scaled to trajectory length)
  const minSep = Math.max(30, pts.length * 0.1);

  // Collect all candidates with their angles
  const candidates: Array<{ i: number; pt: Point; angleDeg: number }> = [];

  // Extend with wrap-around to catch corners near start/end
  const extended = [...pts, ...pts.slice(0, win)];

  for (let i = win; i < extended.length - win; i++) {
    const prev = extended[i - win];
    const curr = extended[i % pts.length];
    const next = extended[i + win];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x ** 2 + v1y ** 2);
    const mag2 = Math.sqrt(v2x ** 2 + v2y ** 2);
    if (mag1 === 0 || mag2 === 0) continue;

    const cosAngle = dot / (mag1 * mag2);
    const angleDeg = (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;

    if (angleDeg < 180 - minAngleDeg) {
      candidates.push({ i: i % pts.length, pt: curr, angleDeg });
    }
  }

  if (candidates.length === 0) return [];

  // Non-maximum suppression: keep sharpest (smallest angle) in each neighborhood
  const corners: Point[] = [];
  // Sort by angle ascending (sharpest first)
  candidates.sort((a, b) => a.angleDeg - b.angleDeg);

  const used = new Set<number>();
  for (const cand of candidates) {
    if (used.has(cand.i)) continue;
    // Check if too close to an already-accepted corner
    const tooClose = corners.some(c =>
      Math.sqrt((cand.pt.x - c.x) ** 2 + (cand.pt.y - c.y) ** 2) < minSep
    );
    if (tooClose) continue;
    corners.push(cand.pt);
    // Mark nearby indices as used
    for (let offset = -win * 2; offset <= win * 2; offset++) {
      used.add((cand.i + offset + pts.length) % pts.length);
    }
  }

  return corners;
}

export function scoreTriangle(trajectory: Point[]): ScoringResult {
  if (trajectory.length < 5) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'No drawing detected' };
  }

  const corners = detectCorners(trajectory);

  if (corners.length < 3) {
    return { score: 0, accuracy: 0, smoothness: 0, error: 'Need 3 clear corners — draw sharper turns' };
  }

  // Check closure
  const first = trajectory[0];
  const last = trajectory[trajectory.length - 1];
  const closure = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
  if (closure > 80) {
    return { score: 40, accuracy: 40, smoothness: 50, error: 'Connect the last point back to the start' };
  }

  const accuracyScore = Math.min(100, 70 + Math.max(0, 3 - Math.abs(corners.length - 3)) * 10);
  return {
    score: Math.round(accuracyScore),
    accuracy: Math.round(accuracyScore),
    smoothness: 70,
    error: null,
  };
}
