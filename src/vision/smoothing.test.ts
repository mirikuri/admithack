import { describe, it, expect } from 'vitest';
import { createSmoother, mapToCanvas } from './smoothing';

describe('createSmoother', () => {
  it('returns the first point unchanged', () => {
    const smooth = createSmoother(0.3);
    expect(smooth(0.5, 0.5)).toEqual([0.5, 0.5]);
  });

  it('moves toward new value with alpha=1', () => {
    const smooth = createSmoother(1);
    smooth(0, 0);
    expect(smooth(1, 1)).toEqual([1, 1]);
  });

  it('blends with alpha=0.5', () => {
    const smooth = createSmoother(0.5);
    smooth(0, 0);
    const [x, y] = smooth(1, 1);
    expect(x).toBeCloseTo(0.5);
    expect(y).toBeCloseTo(0.5);
  });

  it('resets when reset() called', () => {
    const smooth = createSmoother(0.3);
    smooth(0.2, 0.2);
    smooth.reset();
    expect(smooth(0.9, 0.9)).toEqual([0.9, 0.9]);
  });
});

describe('mapToCanvas', () => {
  it('mirrors x when mirror=true', () => {
    const [x] = mapToCanvas(0.2, 0.5, 800, 600, true);
    expect(x).toBeCloseTo(640); // (1-0.2)*800
  });

  it('does not mirror x when mirror=false', () => {
    const [x] = mapToCanvas(0.2, 0.5, 800, 600, false);
    expect(x).toBeCloseTo(160); // 0.2*800
  });

  it('maps y proportionally', () => {
    const [, y] = mapToCanvas(0.5, 0.5, 800, 600, true);
    expect(y).toBeCloseTo(300); // 0.5*600
  });
});
