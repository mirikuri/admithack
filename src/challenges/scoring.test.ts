import { describe, it, expect } from 'vitest';
import { aggregateScore } from './scoring';

describe('aggregateScore', () => {
  it('averages challenge scores', () => {
    const results = [
      { id: 'circle', name: 'Circle', scoring: { score: 80, accuracy: 80, smoothness: 80, error: null } },
      { id: 'triangle', name: 'Triangle', scoring: { score: 60, accuracy: 60, smoothness: 60, error: null } },
    ];
    expect(aggregateScore(results, 90).total).toBe(70);
  });

  it('assigns Master Artist for score >= 90', () => {
    const results = [
      { id: 'circle', name: 'Circle', scoring: { score: 95, accuracy: 95, smoothness: 95, error: null } },
    ];
    expect(aggregateScore(results, 60).level).toBe('Master Artist');
  });

  it('handles empty results', () => {
    expect(aggregateScore([], 0).total).toBe(0);
  });
});
