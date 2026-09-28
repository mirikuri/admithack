import { describe, it, expect } from 'vitest';
import { classifyGesture, createGestureDebouncer, brushSizeFromPalm } from './gestures';
import type { Landmark } from '../types';

// Helper: make 21 landmarks all at (0.5, 0.5, 0)
function makeLandmarks(): Landmark[] {
  return Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
}

// Helper: set index finger extended, others folded
function indexExtendedLandmarks(): Landmark[] {
  const lm = makeLandmarks();
  // PIP at y=0.6, TIP at y=0.3 → TIP.y < PIP.y → extended
  lm[6] = { x: 0.5, y: 0.6, z: 0 };  // INDEX_PIP
  lm[8] = { x: 0.5, y: 0.3, z: 0 };  // INDEX_TIP (higher = extended)
  // Middle, ring, pinky folded: TIP.y > PIP.y
  lm[10] = { x: 0.5, y: 0.5, z: 0 }; lm[12] = { x: 0.5, y: 0.7, z: 0 };
  lm[14] = { x: 0.5, y: 0.5, z: 0 }; lm[16] = { x: 0.5, y: 0.7, z: 0 };
  lm[18] = { x: 0.5, y: 0.5, z: 0 }; lm[20] = { x: 0.5, y: 0.7, z: 0 };
  return lm;
}

function fistLandmarks(): Landmark[] {
  const lm = makeLandmarks();
  // All tips below their PIPs (y larger = lower on screen)
  lm[6] = { x: 0.5, y: 0.4, z: 0 }; lm[8] = { x: 0.5, y: 0.7, z: 0 };
  lm[10] = { x: 0.5, y: 0.4, z: 0 }; lm[12] = { x: 0.5, y: 0.7, z: 0 };
  lm[14] = { x: 0.5, y: 0.4, z: 0 }; lm[16] = { x: 0.5, y: 0.7, z: 0 };
  lm[18] = { x: 0.5, y: 0.4, z: 0 }; lm[20] = { x: 0.5, y: 0.7, z: 0 };
  return lm;
}

function openPalmLandmarks(): Landmark[] {
  const lm = makeLandmarks();
  // All tips above PIPs
  lm[6] = { x: 0.5, y: 0.6, z: 0 }; lm[8] = { x: 0.5, y: 0.2, z: 0 };
  lm[10] = { x: 0.5, y: 0.6, z: 0 }; lm[12] = { x: 0.5, y: 0.2, z: 0 };
  lm[14] = { x: 0.5, y: 0.6, z: 0 }; lm[16] = { x: 0.5, y: 0.2, z: 0 };
  lm[18] = { x: 0.5, y: 0.6, z: 0 }; lm[20] = { x: 0.5, y: 0.2, z: 0 };
  return lm;
}

function pinchLandmarks(): Landmark[] {
  const lm = openPalmLandmarks();
  // Thumb and index tips very close
  lm[4] = { x: 0.5, y: 0.5, z: 0 };  // THUMB_TIP
  lm[8] = { x: 0.52, y: 0.5, z: 0 }; // INDEX_TIP (distance < 0.07)
  return lm;
}

describe('classifyGesture', () => {
  it('returns INDEX_DRAW when only index is extended', () => {
    expect(classifyGesture(indexExtendedLandmarks())).toBe('INDEX_DRAW');
  });

  it('returns FIST_ERASE when all fingers folded', () => {
    expect(classifyGesture(fistLandmarks())).toBe('FIST_ERASE');
  });

  it('returns OPEN_PALM when all fingers extended', () => {
    expect(classifyGesture(openPalmLandmarks())).toBe('OPEN_PALM');
  });

  it('returns PINCH when thumb and index tips are close', () => {
    expect(classifyGesture(pinchLandmarks())).toBe('PINCH');
  });

  it('returns UNKNOWN for ambiguous pose', () => {
    const lm = makeLandmarks(); // all at 0.5,0.5 → tips == pips → neither extended nor folded clearly
    // Make index and middle extended but ring/pinky not → not a clean gesture
    lm[6] = { x: 0.5, y: 0.6, z: 0 }; lm[8] = { x: 0.5, y: 0.3, z: 0 };
    lm[10] = { x: 0.5, y: 0.6, z: 0 }; lm[12] = { x: 0.5, y: 0.3, z: 0 };
    lm[14] = { x: 0.5, y: 0.5, z: 0 }; lm[16] = { x: 0.5, y: 0.7, z: 0 };
    lm[18] = { x: 0.5, y: 0.5, z: 0 }; lm[20] = { x: 0.5, y: 0.7, z: 0 };
    expect(classifyGesture(lm)).toBe('UNKNOWN');
  });
});

describe('classifyGesture — pinch hysteresis', () => {
  it('does not fire PINCH when normalizedDist=0.20 and prevPinch=false', () => {
    const lm = openPalmLandmarks();
    // wrist[0] at (0.5,0.9), middle MCP[9] at (0.5,0.5) → handSize ≈ 0.4
    lm[0] = { x: 0.5, y: 0.9, z: 0 };
    lm[9] = { x: 0.5, y: 0.5, z: 0 };
    // thumb[4] and index[8] at distance 0.20 * 0.4 = 0.08 (above PINCH_ENTER*handSize)
    lm[4] = { x: 0.5, y: 0.5, z: 0 };
    lm[8] = { x: 0.58, y: 0.5, z: 0 }; // dist=0.08, normalized=0.08/0.4=0.20 > PINCH_ENTER(0.18)
    expect(classifyGesture(lm, false)).not.toBe('PINCH');
  });

  it('stays in PINCH when normalizedDist=0.20 and prevPinch=true (hysteresis)', () => {
    const lm = openPalmLandmarks();
    lm[0] = { x: 0.5, y: 0.9, z: 0 };
    lm[9] = { x: 0.5, y: 0.5, z: 0 };
    lm[4] = { x: 0.5, y: 0.5, z: 0 };
    lm[8] = { x: 0.58, y: 0.5, z: 0 }; // normalizedDist=0.20 < PINCH_EXIT(0.25) → stays
    expect(classifyGesture(lm, true)).toBe('PINCH');
  });
});

describe('brushSizeFromPalm', () => {
  it('returns larger brush when fingers spread wider', () => {
    const lm = makeLandmarks();
    // Set wrist[0] and middleMCP[9] so handSize = 0.4
    lm[0] = { x: 0.5, y: 0.9, z: 0 }; lm[9] = { x: 0.5, y: 0.5, z: 0 };
    lm[8]  = { x: 0.2, y: 0.5, z: 0 };
    lm[20] = { x: 0.8, y: 0.5, z: 0 }; // dist(8,20)=0.6, normalized=1.5
    const wide = brushSizeFromPalm(lm);
    lm[8]  = { x: 0.4, y: 0.5, z: 0 };
    lm[20] = { x: 0.6, y: 0.5, z: 0 }; // dist(8,20)=0.2, normalized=0.5
    const narrow = brushSizeFromPalm(lm);
    expect(wide).toBeGreaterThan(narrow);
  });

  it('returns same size regardless of hand distance from camera', () => {
    // Near camera: all coords larger in frame space — but ratio stays same
    const lm = makeLandmarks();
    lm[0] = { x: 0.2, y: 0.8, z: 0 }; lm[9] = { x: 0.2, y: 0.4, z: 0 }; // handSize=0.4
    lm[8] = { x: 0.0, y: 0.6, z: 0 }; lm[20] = { x: 0.4, y: 0.6, z: 0 };  // spread=0.4, norm=1.0
    const near = brushSizeFromPalm(lm);
    const lm2 = makeLandmarks();
    lm2[0] = { x: 0.4, y: 0.65, z: 0 }; lm2[9] = { x: 0.4, y: 0.45, z: 0 }; // handSize=0.2 (far)
    lm2[8] = { x: 0.3, y: 0.55, z: 0 }; lm2[20] = { x: 0.5, y: 0.55, z: 0 }; // spread=0.2, norm=1.0
    const far = brushSizeFromPalm(lm2);
    expect(near).toBe(far); // same normalizedSpread → same brush size
  });
});

describe('createGestureDebouncer', () => {
  it('only emits gesture after minFrames stable frames', () => {
    const debounce = createGestureDebouncer(3, 500);
    expect(debounce('INDEX_DRAW', 0)).toBe('UNKNOWN');
    expect(debounce('INDEX_DRAW', 33)).toBe('UNKNOWN');
    expect(debounce('INDEX_DRAW', 66)).toBe('INDEX_DRAW');
  });

  it('resets count when gesture changes', () => {
    const debounce = createGestureDebouncer(3, 500);
    debounce('INDEX_DRAW', 0);
    debounce('INDEX_DRAW', 33);
    debounce('FIST_ERASE', 66); // switch — resets
    expect(debounce('FIST_ERASE', 99)).toBe('UNKNOWN'); // stable but hold not met
  });

  it('does not activate FIST_ERASE before fistHoldMs', () => {
    const debounce = createGestureDebouncer(3, 500);
    debounce('FIST_ERASE', 0);
    debounce('FIST_ERASE', 33);
    debounce('FIST_ERASE', 66); // 3 frames stable but only 66ms elapsed
    expect(debounce('FIST_ERASE', 99)).toBe('UNKNOWN'); // < 500ms → no erase
  });

  it('activates FIST_ERASE after fistHoldMs', () => {
    const debounce = createGestureDebouncer(3, 500);
    debounce('FIST_ERASE', 0);
    debounce('FIST_ERASE', 33);
    debounce('FIST_ERASE', 66);
    expect(debounce('FIST_ERASE', 600)).toBe('FIST_ERASE'); // 600ms ≥ 500ms → activates
  });
});
