import { useEffect, useRef } from 'react';
import type { Gesture, Landmark, Point } from '../types';
import { Canvas, type CanvasHandle } from './Canvas';
import { HandSkeleton } from './HandSkeleton';
import { GestureIndicator } from './GestureIndicator';
import { drawLine } from '../drawing/brush';
import { erase } from '../drawing/eraser';
import { mapToCanvas, createSmoother } from '../vision/smoothing';

const fingerSmoother = createSmoother(0.35);

interface FreeDrawProps {
  landmarks: Landmark[] | null;
  gesture: Gesture;
  brushColor: string;
  brushSize: number;
  cameraWidth: number;
  cameraHeight: number;
  onBack: () => void;
}

export function FreeDraw({
  landmarks, gesture, brushColor, brushSize, cameraWidth, cameraHeight, onBack,
}: FreeDrawProps) {
  const canvasRef = useRef<CanvasHandle>(null);
  const lastPointRef = useRef<Point | null>(null);

  useEffect(() => {
    if (!landmarks) {
      lastPointRef.current = null;
      fingerSmoother.reset();
      return;
    }
    const ctx = canvasRef.current?.getContext();
    if (!ctx) return;

    const [sx, sy] = fingerSmoother(landmarks[8].x, landmarks[8].y);
    const [cx, cy] = mapToCanvas(sx, sy, cameraWidth, cameraHeight, true);
    const curr: Point = { x: cx, y: cy };

    if (gesture === 'INDEX_DRAW') {
      if (lastPointRef.current) {
        drawLine(ctx, lastPointRef.current, curr, brushSize, brushColor);
      }
      lastPointRef.current = curr;
    } else if (gesture === 'FIST_ERASE') {
      erase(ctx, cx, cy, brushSize * 3);
      lastPointRef.current = null;
    } else {
      lastPointRef.current = null;
    }
  }, [landmarks, gesture, brushSize, brushColor, cameraWidth, cameraHeight]);

  return (
    <div className="relative" style={{ width: cameraWidth, height: cameraHeight }}>
      <Canvas ref={canvasRef} width={cameraWidth} height={cameraHeight} className="absolute inset-0" />
      <HandSkeleton landmarks={landmarks} width={cameraWidth} height={cameraHeight} />

      {/* HUD */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 px-5 py-2 rounded-xl text-white backdrop-blur">
        <span className="font-semibold text-stroke">Free draw</span>
        <button
          onClick={() => canvasRef.current?.clear()}
          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onBack}
          className="px-3 py-1 text-sm bg-stroke hover:bg-stroke/80 rounded-lg transition-colors"
        >
          Menu
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <GestureIndicator gesture={gesture} detected={!!landmarks} brushSize={brushSize} color={brushColor} />
      </div>
    </div>
  );
}
