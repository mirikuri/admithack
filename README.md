# Air Painter

Draw in the air with your webcam — no mouse, no keyboard, no touchscreen.

Air Painter uses MediaPipe hand tracking to turn a webcam into a contactless drawing tablet. Everything runs client-side; no server, no sign-in, no install.

## Live Demo

_Deploy pending — run locally with the instructions below._

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Allow camera access when prompted.

## How It Works

```
Welcome → Camera Check → Menu ─┬─ Free Draw
                                └─ Challenges (5 shapes) → Result
```

| Screen | What happens |
| --- | --- |
| **Welcome** | Click START, camera permission is requested |
| **Camera check** | Live preview confirms the camera works; click CONTINUE |
| **Menu** | Choose Free Draw or Challenges — by mouse click or by hand |
| **Free Draw** | Unlimited canvas, no timer; PINCH opens the colour palette |
| **Challenges** | Five timed shapes played in sequence |
| **Result** | Per-shape scores and an aggregate 0–100 with a level label |

## Gestures

| Gesture | How to make it | What it does |
| --- | --- | --- |
| ☝ **Index draw** | Index finger extended, rest folded | Draws under the fingertip |
| ✊ **Fist erase** | All fingers folded, held 500 ms | Erases area under the fist |
| 🖐 **Open palm** | All four fingers extended | Sets brush size from hand spread |
| 🤏 **Pinch** | Thumb tip meets index tip | Opens colour palette; selects menu items |

### Menu navigation by hand

A cursor dot follows your index finger. Point at a button and hold still — a ring fills over 2 seconds, then the button activates. PINCH while hovering selects immediately. A small camera preview in the bottom-right corner shows where your hand is in the frame.

### Colour selection by hand

While the PINCH palette is open, move your finger over a colour swatch. A ring fills over 0.8 seconds — release to confirm. The swatch highlights and scales up as you hover.

### Gesture design notes

- **Distance-invariant sizing.** Pinch threshold and brush-size mapping both divide by `handSize = dist(wrist, middleMCP)`, so moving closer or further from the camera has no effect.
- **Erase guard.** Fist-erase requires 500 ms continuous hold on top of 3-frame debounce — brief fists during transitions don't wipe the canvas.
- **Pinch hysteresis.** Enters at `normalizedDist < 0.18`, exits at `> 0.25` to prevent flicker.

## Challenges

| # | Shape | Time | How it's scored |
| --- | --- | --- | --- |
| 1 | ○ Circle | 20 s | Radius consistency, closure, template coverage |
| 2 | △ Triangle | 25 s | Corner detection (3 corners needed), closure |
| 3 | ★ Star | 30 s | Peak counting (5 spikes needed) |
| 4 | □ Square | 25 s | Aspect ratio, 4-side coverage, straightness, closure |
| 5 | 🌀 Spiral | 35 s | Total rotation (≥ 2 turns), monotonically growing radius |

A dashed template is drawn behind the canvas as a guide. Real-time feedback appears every 1.5 s while drawing — specific messages like "Make the circle larger" or "Draw at least 2 full rotations", not just "wrong".

## Scoring

Each challenge returns `{ score, accuracy, smoothness, error }` on 0–100 scales. The final score is the mean across all challenges.

| Score | Level |
| --- | --- |
| ≥ 90 | Master Artist |
| 75–89 | Artist Level |
| 55–74 | Apprentice |
| < 55 | Beginner |

## Tech Stack

| | |
| --- | --- |
| **React 19 + TypeScript + Vite** | UI and build |
| **@mediapipe/tasks-vision 0.10.3** | Hand landmark detection, WASM, runs in browser |
| **Canvas 2D** | Drawing surface |
| **Tailwind CSS 3** | Styling |
| **Vitest + happy-dom** | Unit tests |

No trained gesture model — all gesture logic is hand-written rules over 21 MediaPipe landmarks.

## Project Structure

```
src/
├── vision/
│   ├── handTracking.ts      MediaPipe wrapper
│   ├── gestures.ts          classifyGesture, debouncer, brushSizeFromPalm
│   └── smoothing.ts         EMA smoother (α=0.35), landmark→canvas mapper
├── drawing/
│   ├── brush.ts             drawLine
│   ├── eraser.ts            erase
│   └── colors.ts            8-colour palette
├── challenges/
│   ├── circle.ts            trajectory-based scoring
│   ├── triangle.ts          corner-detection scoring
│   ├── star.ts              peak-counting scoring
│   ├── square.ts            bounding-box + straightness scoring
│   ├── spiral.ts            rotation + monotonic-radius scoring
│   └── scoring.ts           aggregateScore, level mapping
├── components/
│   ├── Camera.tsx           getUserMedia + rAF loop, mirrored, StrictMode-safe
│   ├── Canvas.tsx           drawing surface with imperative handle
│   ├── HandSkeleton.tsx     SVG landmark overlay
│   ├── HandCursor.tsx       cursor dot, dwell ring, PINCH trigger
│   ├── PaletteOverlay.tsx   colour picker with hand-hover selection
│   ├── FreeDraw.tsx         free-draw canvas, CLEAR / MENU controls
│   ├── Challenge.tsx        template, timer, gesture→draw routing
│   ├── GestureIndicator.tsx current gesture HUD
│   ├── Feedback.tsx         real-time hint display
│   └── ResultScreen.tsx     final scores
├── data/challenges.ts       challenge config array
├── types.ts                 shared TypeScript types
└── App.tsx                  screen state machine, single Camera instance
```

## Implementation Notes

**Single Camera instance.** One `<Camera>` component stays mounted for the entire session after the camera check. Its container's CSS changes per screen: large and centred on the camera check screen, a small corner preview on the menu, a hidden 1×1 div on drawing screens. This avoids stream restarts on navigation.

**StrictMode-safe camera.** React 18+ dev mode mounts effects twice, producing two concurrent `getUserMedia` calls. Firefox aborts both with `AbortError`. `Camera.tsx` catches this and retries once after 300 ms.

**Mirroring.** The `<video>` uses `scaleX(-1)` CSS. Cursor and canvas mapping use `x = (1 - landmark.x) * width` so drawing tracks the hand naturally without having to think about left/right.

**Smoothing.** The index fingertip (`landmark[8]`) passes through an EMA (α = 0.35) before canvas mapping — enough to kill jitter without adding visible lag.

**Timer isolation.** The challenge timer's `useEffect` depends only on `[config]`, not on `onComplete`. This prevents the interval from tearing down and recreating on every frame.

## Scripts

```bash
npm run dev        # dev server with HMR
npm run build      # production build → dist/
npm run preview    # serve the built output locally
npm run test       # vitest in watch mode
npm run test:run   # single test run
npm run lint       # oxlint
```

## Deployment

`vercel.json` is already configured for a Vite build:

```bash
npx vercel --prod
```

## Requirements Compliance

| Requirement | Implementation |
| --- | --- |
| Webcam, browser-only | MediaPipe Tasks Vision WASM in `handTracking.ts` |
| Real-time processing | `requestAnimationFrame` loop at display refresh rate |
| No keyboard/mouse during play | All drawing input is gesture-driven |
| ≥ 3 gestures with distinct actions | 4 gestures: draw, erase, resize brush, open palette |
| Visual gesture feedback | Hand skeleton overlay + GestureIndicator HUD |
| Full user scenario | Welcome → camera → menu → free draw or 5 challenges → result |
| Specific error detection | Per-challenge trajectory analysis with targeted hint messages |
| Custom gesture logic | Hand-written landmark rules — no trained classifier |
| Web deployment | Vite build + `vercel.json` |
| Zero end-user install | Any modern browser with a webcam |
