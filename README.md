# Air Painter

Draw in the air with your webcam. No mouse, no keyboard, no touchscreen — just gestures.

Air Painter turns a webcam into a contactless drawing tablet using MediaPipe hand tracking and hand-written gesture rules. Everything runs client-side in the browser.

## Live Demo

_Deploy pending — run locally with the instructions below._

## Quick Start

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`. Allow camera access when prompted and move your hand into frame.

## Gestures

| Gesture | Landmark rule | Action |
| --- | --- | --- |
| ☝ **Index draw** | Index extended, other fingers folded | Draws a line under the fingertip |
| ✊ **Fist erase** | All four fingers folded, held for 500 ms | Erases the area around the fist |
| 🖐 **Open palm** | All four fingers extended | Sets brush size from index-to-pinky spread |
| 🤏 **Pinch** | Thumb tip near index tip (normalised) | Opens the colour palette |

Two design decisions that matter:

- **Camera-distance invariant sizing.** The pinch threshold and the brush-size mapping both divide by `handSize = dist(wrist, middleMCP)`. Moving the hand closer or further from the camera changes the raw distances but leaves the ratios unchanged.
- **Destructive-gesture guard.** Fist-erase requires 500 ms of continuous hold on top of the 3-frame debounce, so brief fists during hand transitions don't wipe the canvas.

Pinch uses hysteresis to avoid flicker: enters at `normalizedDist < 0.18`, exits at `> 0.25`.

## The App Flow

1. **Welcome** — start button, requests camera permission.
2. **Camera check** — live preview with hand-skeleton overlay; confirms a hand is detected.
3. **Challenges** — three timed prompts, in order:
   - Draw a circle (20 s)
   - Draw a triangle (25 s)
   - Draw a star (30 s)

   A dashed template appears behind the canvas as a guide. Real-time hints appear every 1.5 s while drawing.
4. **Result** — per-challenge scores plus an aggregate 0–100 score and level: _Beginner_ (< 55), _Apprentice_ (55–74), _Artist Level_ (75–89), _Master Artist_ (≥ 90).

## Real-Time Error Feedback

The scoring functions inspect the trajectory as it's drawn and return specific hints, not just "wrong". Actual messages returned by the code:

**Circle:** `No drawing detected` · `Too fast — slow down your hand` · `Make the circle larger` · `Try making a continuous circular movement` · `Complete the circle back to the start`

**Triangle:** `No drawing detected` · `Need 3 clear corners — draw sharper turns` · `Connect the last point back to the start`

**Star:** `No drawing detected` · `The star has too few points — try sharper corners` · `Only N points found — aim for 5`

## Scoring

Each challenge produces `{ score, accuracy, smoothness, error }` on 0–100 scales.

**Circle** uses an explicit two-term formula:

```
accuracy = max(0, (1 - avgDistToTemplate / avgRadius) * 100)
coverage = coveredTemplatePoints / 100 * 100   // "covered" if a drawn point is within 5% of radius
score    = round(accuracy * 0.6 + coverage * 0.4)
```

**Triangle** and **star** use shape-detection heuristics (corner detection for triangle, local-extrema peak counting for star) — they can't share the circle's `templateRadius`, so they map heuristic feature counts to a 0–100 score directly.

The final score is the mean of the three challenge scores.

## Tech Stack

- **React 19** + **TypeScript** + **Vite** — UI and build
- **`@mediapipe/tasks-vision@0.10.3`** — hand landmark detection (WASM URL pinned to the same version)
- **Canvas 2D** — drawing surface
- **Tailwind CSS 3** — styling
- **Vitest** + **happy-dom** — 33 unit tests covering smoothing, gesture classification, debounce/hold, and challenge scoring

No custom ML model — gestures are hand-written rules on 21 MediaPipe landmarks. No backend, no auth, no persistence.

## Project Structure

```
src/
├── vision/
│   ├── handTracking.ts     MediaPipe wrapper
│   ├── gestures.ts         classifyGesture + debouncer + brushSizeFromPalm
│   └── smoothing.ts        EMA smoother (α=0.35) + landmark→canvas mapper
├── drawing/
│   ├── brush.ts            drawLine
│   ├── eraser.ts           erase
│   └── colors.ts           8-colour palette
├── challenges/
│   ├── circle.ts           trajectory-based circle scoring
│   ├── triangle.ts         corner-detection scoring
│   ├── star.ts             peak-detection scoring
│   └── scoring.ts          aggregateScore + level mapping
├── components/
│   ├── Camera.tsx          getUserMedia + rAF loop, mirrored
│   ├── HandSkeleton.tsx    SVG landmark overlay
│   ├── Canvas.tsx          drawing canvas with imperative handle
│   ├── Challenge.tsx       template + timer + gesture→draw routing
│   ├── GestureIndicator.tsx, Feedback.tsx, ResultScreen.tsx
├── data/challenges.ts      challenge configs
├── types.ts                shared types
└── App.tsx                 state machine + screen routing
```

## Notes on Implementation

- **Mirroring.** The video element uses CSS `transform: scaleX(-1)`, and the cursor mapping does `canvasX = (1 - landmark.x) * width`, so the drawing tracks your hand naturally. MediaPipe's `Left`/`Right` labels are therefore inverted and are ignored — only landmark coordinates are used.
- **Smoothing.** The index fingertip (`landmark[8]`) passes through an EMA (`α = 0.35`) inside `Challenge.tsx` before being mapped to canvas pixels — enough to kill jitter without adding visible lag.
- **Debouncing.** Gestures need 3 stable frames to activate. Fist adds a 500 ms wall-clock hold on top of that.
- **Timer isolation.** The challenge timer's `useEffect` depends only on `[config]`, not on the `onComplete` callback whose identity changes every frame — otherwise the interval would tear down and recreate before it could tick.

## Scripts

```bash
npm run dev        # dev server with HMR
npm run build      # tsc -b && vite build → dist/
npm run preview    # preview the built output
npm run test       # vitest watch mode
npm run test:run   # vitest single run
npm run lint       # oxlint
```

## Deployment

`vercel.json` targets a Vite build. To deploy:

```bash
npx vercel --prod
```

Update the "Live Demo" link above with the returned URL.

## Requirements Compliance

| Requirement | Where |
| --- | --- |
| Webcam recognition, browser-only | `src/vision/handTracking.ts` (MediaPipe Tasks Vision) |
| Real-time processing | `requestAnimationFrame` loop in `Camera.tsx` (runs at the display refresh rate; MediaPipe's `VIDEO` mode consumes each frame) |
| No keyboard / mouse / touch during play | All input is gesture-driven; only the start buttons are clickable |
| ≥ 3 distinct gestures with distinct actions | 4 gestures: draw, erase, brush size, colour |
| Visual gesture feedback | Hand skeleton overlay + `GestureIndicator` HUD |
| Complete user scenario | Welcome → camera check → 3 challenges → result screen |
| Specific error detection | Trajectory analysis with per-challenge hint text |
| Custom gesture logic | Hand-written rules on 21 landmarks — no trained model |
| Web deployment | Vite build, `vercel.json` present |
| Zero installation for end user | Any modern browser with camera access |
