import type { Landmark, Gesture } from '../types';

// Pinch thresholds normalized by handSize = dist(wrist[0], middleMCP[9])
// Enter pinch when normalizedDist < PINCH_ENTER; exit when > PINCH_EXIT (hysteresis)
const PINCH_ENTER = 0.18;
const PINCH_EXIT  = 0.25;

function isExtended(tip: Landmark, pip: Landmark): boolean {
  return tip.y < pip.y;
}

function dist2D(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function handSize(lm: Landmark[]): number {
  // Distance wrist → middle finger MCP; camera-distance invariant denominator.
  // Guard of 0.15 ensures degenerate fixtures (wrist == middleMCP) still yield
  // sensible normalized distances for the pinch threshold.
  return Math.max(dist2D(lm[0], lm[9]), 0.15);
}

export function classifyGesture(lm: Landmark[], prevPinch = false): Gesture {
  const size = handSize(lm);
  const normalizedPinch = dist2D(lm[4], lm[8]) / size;

  // Hysteresis: stay in PINCH until above EXIT threshold
  if (prevPinch && normalizedPinch < PINCH_EXIT) return 'PINCH';
  if (!prevPinch && normalizedPinch < PINCH_ENTER) return 'PINCH';

  const indexEx  = isExtended(lm[8],  lm[6]);
  const middleEx = isExtended(lm[12], lm[10]);
  const ringEx   = isExtended(lm[16], lm[14]);
  const pinkyEx  = isExtended(lm[20], lm[18]);

  if (indexEx && !middleEx && !ringEx && !pinkyEx) return 'INDEX_DRAW';
  if (!indexEx && !middleEx && !ringEx && !pinkyEx) return 'FIST_ERASE';
  if (indexEx && middleEx && ringEx && pinkyEx)     return 'OPEN_PALM';
  return 'UNKNOWN';
}

// Brush size from finger spread, normalized by handSize → camera-distance invariant.
// normalizedSpread = dist(indexTip[8], pinkyTip[20]) / dist(wrist[0], middleMCP[9])
// Typical range: ~0.4 (fingers close) → ~1.8 (max spread) → maps to 4px–48px
export function brushSizeFromPalm(lm: Landmark[]): number {
  const size = handSize(lm);
  const normalizedSpread = dist2D(lm[8], lm[20]) / size;
  return Math.round(Math.max(4, Math.min(48, (normalizedSpread - 0.4) / 1.4 * 44 + 4)));
}

// Debounce: only emit a gesture after it's stable for minFrames.
// FIST_ERASE additionally requires fistHoldMs milliseconds of continuous hold
// before it activates — guards against accidental erasure.
export function createGestureDebouncer(minFrames = 3, fistHoldMs = 500) {
  let candidate: Gesture = 'UNKNOWN';
  let count = 0;
  let stable: Gesture = 'UNKNOWN';
  let fistStartTime = 0;

  return function debounce(gesture: Gesture, nowMs = Date.now()): Gesture {
    if (gesture === candidate) {
      count++;
    } else {
      candidate = gesture;
      count = 1;
      if (gesture === 'FIST_ERASE') fistStartTime = nowMs;
    }

    if (count >= minFrames) {
      if (gesture === 'FIST_ERASE') {
        // Extra hold requirement for destructive action
        if (nowMs - fistStartTime >= fistHoldMs) stable = 'FIST_ERASE';
        // else stay in previous stable gesture
      } else {
        stable = gesture;
      }
    }

    return stable;
  };
}
