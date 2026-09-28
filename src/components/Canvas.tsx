import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { Point } from '../types';

export interface CanvasHandle {
  getContext(): CanvasRenderingContext2D | null;
  clear(): void;
  startTrajectory(): void;
  addTrajectoryPoint(p: Point): void;
  getTrajectory(): Point[];
}

interface CanvasProps {
  width: number;
  height: number;
  className?: string;
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ width, height, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const trajectoryRef = useRef<Point[]>([]);

    useImperativeHandle(ref, () => ({
      getContext() { return canvasRef.current?.getContext('2d') ?? null; },
      clear() {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width, height);
        trajectoryRef.current = [];
      },
      startTrajectory() { trajectoryRef.current = []; },
      addTrajectoryPoint(p) { trajectoryRef.current.push(p); },
      getTrajectory() { return [...trajectoryRef.current]; },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
        style={{ background: 'transparent' }}
      />
    );
  }
);
Canvas.displayName = 'Canvas';
