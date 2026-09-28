import type { ChallengeResult } from '../types';

export interface FinalScore {
  total: number;      // 0-100
  level: string;
  results: ChallengeResult[];
  totalTime: number;  // seconds
}

export function aggregateScore(results: ChallengeResult[], totalTime: number): FinalScore {
  if (results.length === 0) return { total: 0, level: 'Beginner', results: [], totalTime };
  const avg = results.reduce((s, r) => s + r.scoring.score, 0) / results.length;
  const level =
    avg >= 90 ? 'Master Artist' :
    avg >= 75 ? 'Artist Level' :
    avg >= 55 ? 'Apprentice' : 'Beginner';
  return { total: Math.round(avg), level, results, totalTime };
}
