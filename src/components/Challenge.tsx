// src/components/Challenge.tsx
import { useEffect, useRef, useState } from 'react';
import type { Gesture, Landmark, Point, ScoringResult } from '../types';
import type { ChallengeConfig } from '../data/challenges';
import { Canvas, type CanvasHandle } from './Canvas';
import { HandSkeleton } from './HandSkeleton';
import { GestureIndicator } from './GestureIndicator';
import { Feedback } from './Feedback';
import { drawLine } from '../drawing/brush';
import { erase } from '../drawing/eraser';
import { mapToCanvas, createSmoother } from '../vision/smoothing';

// Per-component smoother so it resets fresh on each challenge mount
const fingerSmoother = createSmoother(0.35);

interface ChallengeProps {
  config: ChallengeConfig;
  landmarks: Landmark[] | null;
  gesture: Gesture;
  brushColor: string;
  brushSize: number;
  onComplete: (result: ScoringResult) => void;
  cameraWidth: number;
  cameraHeight: number;
}

function drawTemplate(ctx: CanvasRenderingContext2D, type: string, w: number, h: number) {
  const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) * 0.3;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  if (type === 'circle') {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (type === 'triangle') {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.87, cy + r * 0.5);
    ctx.lineTo(cx - r * 0.87, cy + r * 0.5);
    ctx.closePath();
  } else if (type === 'star') {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.4;
      const x = cx + rad * Math.cos(angle);
      const y = cy + rad * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

export function Challenge({
  config, landmarks, gesture, brushColor, brushSize, onComplete, cameraWidth, cameraHeight,
}: ChallengeProps) {
  const [timeLeft, setTimeLeft] = useState(config.durationSeconds);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const lastPointRef = useRef<Point | null>(null);
  const templateDrawnRef = useRef(false);

  // Draw template once after initial render
  useEffect(() => {
    if (templateDrawnRef.current) return;
    const ctx = canvasRef.current?.getContext();
    if (!ctx) return;
    drawTemplate(ctx, config.templateDescription, cameraWidth, cameraHeight);
    templateDrawnRef.current = true;
    canvasRef.current?.startTrajectory();
  });

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          const trajectory = canvasRef.current?.getTrajectory() ?? [];
          onComplete(config.score(trajectory));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [config, onComplete]);

  // Real-time feedback polling
  useEffect(() => {
    const interval = setInterval(() => {
      const traj = canvasRef.current?.getTrajectory() ?? [];
      if (traj.length > 10) {
        const result = config.score(traj);
        setFeedback(result.error);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [config]);

  // Draw from gesture
  useEffect(() => {
    if (!landmarks) {
      lastPointRef.current = null;
      fingerSmoother.reset(); // clear smoother when hand leaves frame
      return;
    }
    const ctx = canvasRef.current?.getContext();
    if (!ctx) return;

    // Apply EMA smoothing to raw landmark before mapping — reduces jitter/wobble
    const [sx, sy] = fingerSmoother(landmarks[8].x, landmarks[8].y);
    const [cx, cy] = mapToCanvas(sx, sy, cameraWidth, cameraHeight, true);
    const curr: Point = { x: cx, y: cy };

    if (gesture === 'INDEX_DRAW') {
      if (lastPointRef.current) {
        drawLine(ctx, lastPointRef.current, curr, brushSize, brushColor);
        canvasRef.current?.addTrajectoryPoint(curr);
      }
      lastPointRef.current = curr;
    } else if (gesture === 'FIST_ERASE') {
      erase(ctx, cx, cy, brushSize * 3);
      lastPointRef.current = null;
    } else {
      lastPointRef.current = null;
    }
  }, [landmarks, gesture, brushSize, brushColor, cameraWidth, cameraHeight]);

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const ss = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="relative" style={{ width: cameraWidth, height: cameraHeight }}>
      <Canvas ref={canvasRef} width={cameraWidth} height={cameraHeight} className="absolute inset-0" />
      <HandSkeleton landmarks={landmarks} width={cameraWidth} height={cameraHeight} />
      <Feedback message={feedback} />

      {/* HUD */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/60 px-6 py-2 rounded-xl text-white">
        <span className="font-bold text-lg">{config.icon} {config.name}</span>
        <span className="text-yellow-400 font-mono text-lg">⏱ {mm}:{ss}</span>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <GestureIndicator gesture={gesture} detected={!!landmarks} brushSize={brushSize} color={brushColor} />
      </div>
    </div>
  );
}
