import { useEffect, useRef, useState } from 'react';
import type { Landmark } from '../types';
import { PALETTE } from '../drawing/colors';

interface PaletteOverlayProps {
  landmarks: Landmark[] | null;
  brushColor: string;
  onSelect: (hex: string) => void;
}

export function PaletteOverlay({ landmarks, brushColor, onSelect }: PaletteOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredHex, setHoveredHex] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);

  const hoveredRef = useRef<string | null>(null);
  const hasFiredRef = useRef(false);
  const dwellStartRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Runs every render — always has fresh landmarks
  useEffect(() => {
    if (!landmarks || !containerRef.current) {
      if (hoveredRef.current !== null) {
        hoveredRef.current = null;
        hasFiredRef.current = false;
        setHoveredHex(null);
        setDwellProgress(0);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      }
      return;
    }

    const fingerX = (1 - landmarks[8].x) * window.innerWidth;
    const fingerY = landmarks[8].y * window.innerHeight;

    // Hit-test each swatch button via live DOM rects
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-color]');
    let found: string | null = null;
    for (const btn of buttons) {
      const r = btn.getBoundingClientRect();
      if (fingerX >= r.left && fingerX <= r.right && fingerY >= r.top && fingerY <= r.bottom) {
        found = btn.getAttribute('data-color');
        break;
      }
    }

    if (found !== hoveredRef.current) {
      hoveredRef.current = found;
      hasFiredRef.current = false;
      setHoveredHex(found);
      setDwellProgress(0);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (found) {
        dwellStartRef.current = Date.now();
        const captured = found;
        timerRef.current = setInterval(() => {
          const p = Math.min(1, (Date.now() - (dwellStartRef.current ?? 0)) / 800);
          setDwellProgress(p);
          if (p >= 1 && !hasFiredRef.current) {
            hasFiredRef.current = true;
            onSelect(captured);
            clearInterval(timerRef.current!);
            timerRef.current = null;
          }
        }, 50);
      }
    }
  });

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const fingerScreenX = landmarks ? (1 - landmarks[8].x) * 100 : null;
  const fingerScreenY = landmarks ? landmarks[8].y * 100 : null;

  return (
    <>
      {/* Palette panel */}
      <div
        ref={containerRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/80 px-6 py-4 rounded-2xl flex gap-3 items-center"
      >
        <span className="text-white text-sm mr-2">COLOR</span>
        {PALETTE.map(c => (
          <button
            key={c.id}
            data-color={c.hex}
            onClick={() => onSelect(c.hex)}
            className="rounded-full border-2 transition-all"
            style={{
              width: 36,
              height: 36,
              background: c.hex,
              borderColor: brushColor === c.hex || hoveredHex === c.hex ? '#fff' : 'transparent',
              transform: hoveredHex === c.hex ? 'scale(1.3)' : 'scale(1)',
              boxShadow: hoveredHex === c.hex ? `0 0 10px ${c.hex}` : 'none',
            }}
            title={c.label}
          />
        ))}
      </div>

      {/* Finger cursor over palette */}
      {fingerScreenX !== null && fingerScreenY !== null && (
        <div
          className="fixed pointer-events-none z-30"
          style={{
            left: `${fingerScreenX}%`,
            top: `${fingerScreenY}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {hoveredHex && dwellProgress > 0 && (
            <svg
              width="44" height="44"
              className="absolute"
              style={{ left: -22, top: -22 }}
              viewBox="0 0 44 44"
            >
              <circle
                cx="22" cy="22" r="18"
                fill="none"
                stroke={hoveredHex}
                strokeWidth="2.5"
                strokeDasharray={`${dwellProgress * 113.1} 113.1`}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
              />
            </svg>
          )}
          <div
            style={{
              width: 14, height: 14,
              borderRadius: '50%',
              background: hoveredHex ?? 'transparent',
              border: `2px solid ${hoveredHex ?? '#ffffff88'}`,
            }}
          />
        </div>
      )}
    </>
  );
}
