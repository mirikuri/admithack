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
const MENU_ZONES: ButtonZone[] = [
  { id: 'freeDraw',  xMin: 0.05, xMax: 0.47, yMin: 0.25, yMax: 0.80 },
  { id: 'challenge', xMin: 0.53, xMax: 0.95, yMin: 0.25, yMax: 0.80 },
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
        border: '2px solid #6366f1',
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e] text-white gap-8">
      <h1 className="text-5xl font-black tracking-tight">AIR PAINTER</h1>
      <p className="text-gray-400 text-xl italic">Draw without touching anything</p>
      <button
        onClick={startApp}
        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-xl transition-colors"
      >
        START DRAWING
      </button>
      <p className="text-gray-500 text-sm">Allow camera access to start</p>
    </div>
  );

  // ── Camera check ──────────────────────────────────────────────────────────
  if (screen === 'camera') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e] text-white gap-6">
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

      <h2 className="text-2xl font-bold">CAMERA CHECK</h2>

      {cameraError ? (
        <div className="text-red-400 max-w-sm text-center">{cameraError}</div>
      ) : (
        <>
          <div style={{ height: 256 }} />
          <p className="text-gray-400">
            {landmarks ? 'Hand detected — ready!' : 'Move your hand into frame'}
          </p>
          <button
            onClick={() => setScreen('menu')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-colors"
          >
            CONTINUE →
          </button>
        </>
      )}
    </div>
  );

  // ── Menu ─────────────────────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e] text-white gap-12">
      {/* Persistent camera (small corner preview for hand cursor orientation) */}
      <div style={getCameraStyle()}>
        <Camera
          onFrame={handleFrame}
          onError={() => {}}
          onReady={() => {}}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-black tracking-tight">AIR PAINTER</h1>
        <p className="text-gray-500 text-sm tracking-widest">CHOOSE MODE</p>
      </div>

      <div className="flex gap-8">
        <button
          onClick={() => setScreen('freeDraw')}
          className="flex flex-col items-center gap-4 px-12 py-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400 rounded-2xl transition-all"
          style={{ minWidth: 200 }}
        >
          <span className="text-5xl">✏️</span>
          <span className="font-black text-xl tracking-widest text-indigo-300">FREE DRAW</span>
          <span className="text-gray-500 text-xs">No limits, just paint</span>
        </button>

        <button
          onClick={startChallenge}
          className="flex flex-col items-center gap-4 px-12 py-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400 rounded-2xl transition-all"
          style={{ minWidth: 200 }}
        >
          <span className="text-5xl">🎯</span>
          <span className="font-black text-xl tracking-widest text-indigo-300">CHALLENGES</span>
          <span className="text-gray-500 text-xs">{CHALLENGES.length} shapes to draw</span>
        </button>
      </div>

      <p className="text-gray-600 text-xs tracking-widest">
        POINT AT BUTTON AND HOLD 2s · OR PINCH TO SELECT
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e]">
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e]">
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
