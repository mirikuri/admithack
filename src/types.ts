export interface Landmark {
  x: number; // 0..1
  y: number; // 0..1
  z: number;
}

export type Gesture =
  | 'INDEX_DRAW'
  | 'FIST_ERASE'
  | 'OPEN_PALM'
  | 'PINCH'
  | 'UNKNOWN';

export type AppScreen =
  | 'welcome'
  | 'camera'
  | 'calibration'
  | 'freeDraw'
  | 'challenge'
  | 'result';

export interface ScoringResult {
  score: number;       // 0-100
  accuracy: number;    // 0-100
  smoothness: number;  // 0-100
  error: string | null; // specific hint, or null if correct
}

export interface ChallengeResult {
  id: string;
  name: string;
  scoring: ScoringResult;
}

export interface Point {
  x: number; // canvas pixels
  y: number;
}
