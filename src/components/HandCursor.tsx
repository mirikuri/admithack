import { useEffect, useRef, useState } from 'react';
import type { Gesture, Landmark } from '../types';

export interface ButtonZone {
  id: string;
  xMin: number; xMax: number;
  yMin: number; yMax: number;
}

interface HandCursorProps {
  landmarks: Landmark[] | null;
  gesture: Gesture;
  zones: ButtonZone[];
  onSelect: (id: string) => void;
  dwellMs?: number;
}

export function HandCursor({ landmarks, gesture, zones, onSelect, dwellMs = 2000 }: HandCursorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);

  const hoveredRef = useRef<string | null>(null);
  const dwellStartRef = useRef<number | null>(null);
  const hasFiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPinchRef = useRef(false);

  useEffect(() => {
    if (!landmarks) {
      if (hoveredRef.current !== null) {
        hoveredRef.current = null;
        hasFiredRef.current = false;
        setHoveredId(null);
        setDwellProgress(0);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      }
      prevPinchRef.current = false;
      return;
    }

    const nx = 1 - landmarks[8].x;
    const ny = landmarks[8].y;
    const zone = zones.find(z => nx >= z.xMin && nx <= z.xMax && ny >= z.yMin && ny <= z.yMax);
    const zoneId = zone?.id ?? null;

    if (zoneId !== hoveredRef.current) {
      hoveredRef.current = zoneId;
      hasFiredRef.current = false;
      setHoveredId(zoneId);
      setDwellProgress(0);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (zoneId) {
        dwellStartRef.current = Date.now();
        timerRef.current = setInterval(() => {
          const p = Math.min(1, (Date.now() - (dwellStartRef.current ?? 0)) / dwellMs);
          setDwellProgress(p);
          if (p >= 1 && !hasFiredRef.current) {
            hasFiredRef.current = true;
            onSelect(zoneId);
            clearInterval(timerRef.current!);
            timerRef.current = null;
          }
        }, 50);
      }
    }

    const isPinch = gesture === 'PINCH';
    if (isPinch && !prevPinchRef.current && zoneId && !hasFiredRef.current) {
      hasFiredRef.current = true;
      onSelect(zoneId);
    }
    prevPinchRef.current = isPinch;
  });

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  if (!landmarks) return null;

  const cx = (1 - landmarks[8].x) * 100;
  const cy = landmarks[8].y * 100;
  const isPinch = gesture === 'PINCH';
  const isHovering = !!hoveredId;
  const CIRC = 2 * Math.PI * 20;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
    >
      {isHovering && dwellProgress > 0 && (
        <svg
          width="56" height="56"
          className="absolute"
          style={{ left: -28, top: -28 }}
          viewBox="0 0 56 56"
        >
          <circle
            cx="28" cy="28" r="20"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2.5"
            strokeDasharray={`${dwellProgress * CIRC} ${CIRC}`}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
          />
        </svg>
      )}
      <div
        style={{
          width: isPinch ? 20 : 14,
          height: isPinch ? 20 : 14,
          borderRadius: '50%',
          background: isPinch ? 'rgba(255,255,255,0.9)' : isHovering ? 'rgba(255,255,255,0.3)' : 'transparent',
          border: '2px solid rgba(255,255,255,0.7)',
          transition: 'all 0.1s ease',
        }}
      />
    </div>
  );
}
