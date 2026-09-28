import type { Landmark } from '../types';

// MediaPipe Hands connection pairs
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // index
  [0, 9], [9, 10], [10, 11], [11, 12],  // middle
  [0, 13], [13, 14], [14, 15], [15, 16], // ring
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17],            // palm
];

interface HandSkeletonProps {
  landmarks: Landmark[] | null;
  width: number;
  height: number;
}

export function HandSkeleton({ landmarks, width, height }: HandSkeletonProps) {
  if (!landmarks) return null;

  // Mirror x to match the mirrored video
  const px = (lm: Landmark) => (1 - lm.x) * width;
  const py = (lm: Landmark) => lm.y * height;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {CONNECTIONS.map(([a, b], i) => (
        <line
          key={`line-${i}`}
          x1={px(landmarks[a])}
          y1={py(landmarks[a])}
          x2={px(landmarks[b])}
          y2={py(landmarks[b])}
          stroke="rgba(99,102,241,0.8)"
          strokeWidth={2}
        />
      ))}
      {landmarks.map((lm, i) => (
        <circle
          key={`circle-${i}`}
          cx={px(lm)}
          cy={py(lm)}
          r={i === 8 ? 6 : 3}
          fill={i === 8 ? '#f59e0b' : '#6366f1'}
        />
      ))}
    </svg>
  );
}
