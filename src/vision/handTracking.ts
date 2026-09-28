import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { Landmark } from '../types';

// Both URLs must use the same version as the npm package (@0.10.3).
// Version mismatch between WASM and npm package causes cryptic init failures.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';

export interface HandTracker {
  detect: (video: HTMLVideoElement, timestampMs: number) => Landmark[] | null;
  close: () => void;
}

export async function initHandTracking(): Promise<HandTracker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands: 1,
  });

  return {
    detect(video, timestampMs) {
      const result = landmarker.detectForVideo(video, timestampMs);
      if (!result.landmarks || result.landmarks.length === 0) return null;
      return result.landmarks[0] as Landmark[];
    },
    close() {
      landmarker.close();
    },
  };
}
