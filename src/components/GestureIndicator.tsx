import type { Gesture } from '../types';

const GESTURE_LABELS: Record<Gesture, string> = {
  INDEX_DRAW: '☝ DRAW',
  FIST_ERASE: '✊ ERASE',
  OPEN_PALM: '🖐 BRUSH SIZE',
  PINCH: '🤏 COLOR',
  UNKNOWN: '—',
};

interface GestureIndicatorProps {
  gesture: Gesture;
  detected: boolean;
  brushSize: number;
  color: string;
}

export function GestureIndicator({ gesture, detected, brushSize, color }: GestureIndicatorProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-black/60 text-white text-sm rounded-xl backdrop-blur">
      <span className={detected ? 'text-green-400' : 'text-red-400'}>
        {detected ? '✓ Hand detected' : '✗ No hand'}
      </span>
      <span className="text-indigo-300">{GESTURE_LABELS[gesture]}</span>
      <span className="flex items-center gap-1">
        <span
          className="rounded-full inline-block"
          style={{ width: Math.max(8, brushSize / 2), height: Math.max(8, brushSize / 2), background: color }}
        />
        <span className="text-gray-400">{brushSize}px</span>
      </span>
    </div>
  );
}
