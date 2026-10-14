import type { Gesture } from '../types';

const GESTURE_LABELS: Record<Gesture, string> = {
  INDEX_DRAW: 'Draw',
  FIST_ERASE: 'Erase',
  OPEN_PALM: 'Brush size',
  PINCH: 'Color',
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
      <span className={detected ? 'text-trace' : 'text-red-400'}>
        {detected ? 'Hand detected' : 'No hand'}
      </span>
      <span className="text-trace/80">{GESTURE_LABELS[gesture]}</span>
      <span className="flex items-center gap-1">
        <span
          className="rounded-full inline-block"
          style={{ width: Math.max(8, brushSize / 2), height: Math.max(8, brushSize / 2), background: color }}
        />
        <span className="text-white/40">{brushSize}px</span>
      </span>
    </div>
  );
}
