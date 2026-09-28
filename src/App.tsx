// src/App.tsx
import { useCallback, useRef, useState } from 'react';
import type { AppScreen, Gesture, Landmark, ChallengeResult, ScoringResult } from './types';
import { initHandTracking, type HandTracker } from './vision/handTracking';
import { classifyGesture, createGestureDebouncer, brushSizeFromPalm } from './vision/gestures';
import { PALETTE } from './drawing/colors';
import { Camera } from './components/Camera';
import { Challenge } from './components/Challenge';
import { ResultScreen } from './components/ResultScreen';
import { CHALLENGES } from './data/challenges';
import { aggregateScore } from './challenges/scoring';

const CAM_W = 640;
const CAM_H = 480;

const gestureDebounce = createGestureDebouncer(3, 500);
let prevPinch = false;

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
  const [pinchActive, setPinchActive] = useState(false);
  const trackerRef = useRef<HandTracker | null>(null);

  async function startApp() {
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

    // OPEN_PALM: brush size from index[8] ↔ pinky[20] spread (camera-distance invariant)
    if (g === 'OPEN_PALM') {
      setBrushSize(brushSizeFromPalm(raw));
    }

    // PINCH: open color palette overlay
    setPinchActive(g === 'PINCH');
  }, []);

  function handleChallengeComplete(scoring: ScoringResult) {
    const current = CHALLENGES[challengeIndex];
    const newResult: ChallengeResult = { id: current.id, name: current.name, scoring };
    const newResults = [...results, newResult];
    setResults(newResults);

    if (challengeIndex + 1 < CHALLENGES.length) {
      setChallengeIndex(i => i + 1);
    } else {
      setScreen('result');
    }
  }

  function restart() {
    setChallengeIndex(0);
    setResults([]);
    setScreen('camera');
    setStartTime(Date.now());
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);

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

  if (screen === 'camera') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e] text-white gap-6">
      <h2 className="text-2xl font-bold">CAMERA CHECK</h2>
      {cameraError ? (
        <div className="text-red-400 max-w-sm text-center">{cameraError}</div>
      ) : (
        <>
          <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-600">
            <Camera
              onFrame={handleFrame}
              onError={setCameraError}
              onReady={() => {}}
              className="w-80 h-60 object-cover"
            />
          </div>
          <p className="text-gray-400">
            {landmarks ? 'Hand detected — ready!' : 'Move your hand into frame'}
          </p>
          {landmarks && (
            <button
              onClick={() => { setStartTime(Date.now()); setScreen('challenge'); }}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition-colors"
            >
              START CHALLENGE
            </button>
          )}
        </>
      )}
    </div>
  );

  if (screen === 'challenge') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e]">
      {/* Hidden camera (still running for tracking) */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1, overflow: 'hidden' }}>
        <Camera onFrame={handleFrame} onError={() => {}} onReady={() => {}} />
      </div>
      {/* PINCH color palette overlay */}
      {pinchActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-black/80 px-6 py-4 rounded-2xl flex gap-3 items-center">
          <span className="text-white text-sm mr-2">COLOR</span>
          {PALETTE.map((c) => (
            <button
              key={c.id}
              onClick={() => setBrushColor(c.hex)}
              className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-125"
              style={{ background: c.hex, borderColor: brushColor === c.hex ? '#fff' : 'transparent' }}
              title={c.label}
            />
          ))}
        </div>
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

  if (screen === 'result') return (
    <ResultScreen
      finalScore={aggregateScore(results, totalTime)}
      onRestart={restart}
    />
  );

  return null;
}
