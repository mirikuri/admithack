import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { AppScreen, Gesture, Landmark, ChallengeResult, ScoringResult } from './types';
import { initHandTracking, type HandTracker } from './vision/handTracking';
import { classifyGesture, createGestureDebouncer, brushSizeFromPalm } from './vision/gestures';
import { Camera } from './components/Camera';
import { Challenge } from './components/Challenge';
import { FreeDraw } from './components/FreeDraw';
import { HandCursor, type ButtonZone } from './components/HandCursor';
import { PaletteOverlay } from './components/PaletteOverlay';
import { ResultScreen } from './components/ResultScreen';
import { CHALLENGES } from './data/challenges';
import { aggregateScore } from './challenges/scoring';

const CAM_W = 640;
const CAM_H = 480;

const gestureDebounce = createGestureDebouncer(3, 500);
let prevPinch = false;

// Viewport zones for hand-gesture menu navigation (nx = 1 - landmark.x, ny = landmark.y)
// Vertical split: top half = free draw, bottom half = challenges
const MENU_ZONES: ButtonZone[] = [
  { id: 'freeDraw',  xMin: 0.05, xMax: 0.95, yMin: 0.20, yMax: 0.52 },
  { id: 'challenge', xMin: 0.05, xMax: 0.95, yMin: 0.54, yMax: 0.85 },
];

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [gesture, setGesture] = useState<Gesture>('UNKNOWN');
  const [brushSize, setBrushSize] = useState(12);
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [pinchActive, setPinchActive] = useState(false);
  const trackerRef = useRef<HandTracker | null>(null);

  async function startApp() {
    setCameraStarted(true);
    setScreen('camera');
    try {
      trackerRef.current = await initHandTracking();
    } catch {
      setCameraError('Failed to load hand tracking model. Check your internet connection.');
    }
  }

  const handleFrame = useCallback((video: HTMLVideoElement, ts: number) => {
    if (!trackerRef.current) return;
    const raw = trackerRef.current.detect(video, ts);
    if (!raw) {
      setLandmarks(null);
      setGesture('UNKNOWN');
      return;
    }
    setLandmarks(raw);
    const rawGesture = classifyGesture(raw, prevPinch);
    prevPinch = rawGesture === 'PINCH';
    const g = gestureDebounce(rawGesture, performance.now());
    setGesture(g);
    if (g === 'OPEN_PALM') setBrushSize(brushSizeFromPalm(raw));
    setPinchActive(g === 'PINCH');
  }, []);

  function handleChallengeComplete(scoring: ScoringResult) {
    const current = CHALLENGES[challengeIndex];
    const newResults = [...results, { id: current.id, name: current.name, scoring }];
    setResults(newResults);
    if (challengeIndex + 1 < CHALLENGES.length) {
      setChallengeIndex(i => i + 1);
    } else {
      setScreen('result');
    }
  }

  function goToMenu() {
    setChallengeIndex(0);
    setResults([]);
    setScreen('menu');
  }

  function startChallenge() {
    setChallengeIndex(0);
    setResults([]);
    setStartTime(Date.now());
    setScreen('challenge');
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);

  // Single Camera instance — style changes per screen so it's never unmounted after start
  const getCameraStyle = (): CSSProperties => {
    if (screen === 'camera') {
      return {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 320, height: 240,
        borderRadius: 16, overflow: 'hidden',
        border: '2px solid #D4622A',
        zIndex: 10,
      };
    }
    if (screen === 'menu') {
      return {
        position: 'fixed', bottom: 16, right: 16,
        width: 160, height: 120,
        borderRadius: 12, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
        zIndex: 10,
      };
    }
    return {
      position: 'fixed', top: 0, left: 0,
      width: 1, height: 1, overflow: 'hidden',
      opacity: 0, pointerEvents: 'none',
    };
  };

  // ── Welcome ──────────────────────────────────────────────────────────────
  if (screen === 'welcome') return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-ink text-paper overflow-hidden gap-8">
      {/* Animated brushstroke — the hero decorative element */}
      <svg
        viewBox="0 0 800 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-x-0 top-1/4 w-full opacity-20 pointer-events-none"
        aria-hidden="true"
      >
        <path
          d="M 20 140 C 80 40, 160 170, 260 100 C 360 30, 420 160, 520 90 C 620 20, 700 130, 780 80"
          stroke="#D4622A"
          strokeWidth="6"
          strokeLinecap="round"
          pathLength="1"
          className="animate-draw-stroke"
        />
        <path
          d="M 40 160 C 120 80, 200 150, 320 110 C 440 70, 500 140, 600 100 C 680 68, 740 120, 790 100"
          stroke="#39C9A8"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="1"
          className="animate-draw-stroke"
          style={{ animationDelay: '0.4s' }}
        />
      </svg>

      <div className="relative flex flex-col items-center gap-3 text-center">
        <h1 className="text-7xl font-extrabold leading-none tracking-tight">Air Painter</h1>
        <p className="text-paper/50 text-lg">Draw in the air — no mouse, no keyboard</p>
      </div>

      <button
        onClick={startApp}
        className="relative px-10 py-4 bg-stroke hover:bg-stroke/80 text-white rounded-lg font-semibold text-lg transition-colors"
      >
        Start drawing
      </button>

      <p className="text-paper/30 text-xs">Allow camera access when prompted</p>
    </div>
  );

  // ── Camera check ──────────────────────────────────────────────────────────
  if (screen === 'camera') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink text-paper gap-6">
      {cameraStarted && (
        <div style={getCameraStyle()}>
          <Camera
            onFrame={handleFrame}
            onError={setCameraError}
            onReady={() => {}}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <h2 className="text-2xl font-semibold">Camera check</h2>

      {cameraError ? (
        <div className="text-red-400 max-w-sm text-center text-sm">{cameraError}</div>
      ) : (
        <>
          <div style={{ height: 256 }} />
          <p className="text-paper/50 text-sm">
            {landmarks ? 'Hand detected — ready' : 'Move your hand into the frame'}
          </p>
          <button
            onClick={() => setScreen('menu')}
            className="px-8 py-3 bg-stroke hover:bg-stroke/80 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );

  // ── Menu ─────────────────────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink text-paper gap-8">
      {/* Persistent camera (small corner preview for hand cursor orientation) */}
      <div style={getCameraStyle()}>
        <Camera
          onFrame={handleFrame}
          onError={() => {}}
          onReady={() => {}}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-1">
        <h1 className="text-3xl font-extrabold">Air Painter</h1>
        <p className="text-paper/40 text-sm">Choose a mode</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm px-6">
        <button
          onClick={() => setScreen('freeDraw')}
          className="flex flex-col gap-1 px-8 py-7 bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-stroke rounded-xl transition-all text-left"
        >
          <span className="font-semibold text-xl text-paper">Free draw</span>
          <span className="text-paper/40 text-sm">Paint without limits</span>
        </button>

        <button
          onClick={startChallenge}
          className="flex flex-col gap-1 px-8 py-7 bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-stroke rounded-xl transition-all text-left"
        >
          <span className="font-semibold text-xl text-paper">Challenges</span>
          <span className="text-paper/40 text-sm">{CHALLENGES.length} shapes to trace</span>
        </button>
      </div>

      <p className="text-paper/20 text-xs">
        Point and hold 2 s — or pinch to select
      </p>

      <HandCursor
        landmarks={landmarks}
        gesture={gesture}
        zones={MENU_ZONES}
        dwellMs={2000}
        onSelect={id => {
          if (id === 'freeDraw') setScreen('freeDraw');
          else if (id === 'challenge') startChallenge();
        }}
      />
    </div>
  );

  // ── Free Draw ─────────────────────────────────────────────────────────────
  if (screen === 'freeDraw') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink">
      <div style={getCameraStyle()}>
        <Camera onFrame={handleFrame} onError={() => {}} onReady={() => {}} />
      </div>

      {pinchActive && (
        <PaletteOverlay
          landmarks={landmarks}
          brushColor={brushColor}
          onSelect={setBrushColor}
        />
      )}

      <FreeDraw
        landmarks={landmarks}
        gesture={gesture}
        brushColor={brushColor}
        brushSize={brushSize}
        cameraWidth={CAM_W}
        cameraHeight={CAM_H}
        onBack={() => setScreen('menu')}
      />
    </div>
  );

  // ── Challenge ─────────────────────────────────────────────────────────────
  if (screen === 'challenge') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink">
      <div style={getCameraStyle()}>
        <Camera onFrame={handleFrame} onError={() => {}} onReady={() => {}} />
      </div>

      {pinchActive && (
        <PaletteOverlay
          landmarks={landmarks}
          brushColor={brushColor}
          onSelect={setBrushColor}
        />
      )}

      <Challenge
        key={challengeIndex}
        config={CHALLENGES[challengeIndex]}
        landmarks={landmarks}
        gesture={gesture}
        brushColor={brushColor}
        brushSize={brushSize}
        onComplete={handleChallengeComplete}
        cameraWidth={CAM_W}
        cameraHeight={CAM_H}
      />
    </div>
  );

  // ── Result ────────────────────────────────────────────────────────────────
  if (screen === 'result') return (
    <ResultScreen
      finalScore={aggregateScore(results, totalTime)}
      onRestart={goToMenu}
    />
  );

  return null;
}
