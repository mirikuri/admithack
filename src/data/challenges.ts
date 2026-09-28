import { scoreCircle } from '../challenges/circle';
import { scoreTriangle } from '../challenges/triangle';
import { scoreStar } from '../challenges/star';
import type { ScoringResult, Point } from '../types';

export interface ChallengeConfig {
  id: string;
  name: string;
  icon: string;
  durationSeconds: number;
  templateDescription: string; // used for drawing template on canvas
  score: (trajectory: Point[]) => ScoringResult;
}

export const CHALLENGES: ChallengeConfig[] = [
  {
    id: 'circle',
    name: 'Draw a Circle',
    icon: '○',
    durationSeconds: 20,
    templateDescription: 'circle',
    score: scoreCircle,
  },
  {
    id: 'triangle',
    name: 'Draw a Triangle',
    icon: '△',
    durationSeconds: 25,
    templateDescription: 'triangle',
    score: scoreTriangle,
  },
  {
    id: 'star',
    name: 'Draw a Star',
    icon: '★',
    durationSeconds: 30,
    templateDescription: 'star',
    score: scoreStar,
  },
];
