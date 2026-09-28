# 🎨 Air Painter

**Draw without touching anything.**

Air Painter is a web application that transforms your ordinary webcam into a touchless drawing interface. Move your hand in front of the camera and use intuitive gestures to draw, erase, change brush size, and select colors—all without touching the screen.

## Live Demo

[Live Demo](https://air-painter.vercel.app)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`. Allow camera access and start drawing!

## How It Works

### Gesture Recognition

Air Painter uses **custom gesture logic** built on MediaPipe hand landmarks—no machine learning model training required.

Each gesture is defined by analyzing the position and state of hand landmarks (wrist, thumb, index, middle, ring, and pinky fingers):

- **☝️ Index Finger (DRAW)**: Index finger extended, other fingers folded → draws a line
- **✊ Fist (ERASE)**: All fingers bent close to palm → erases the drawing
- **🖐 Open Palm (BRUSH SIZE)**: All fingers extended → adjusts brush size based on thumb-to-index distance
- **🤏 Pinch (COLOR)**: Thumb and index finger touching → selects color from palette

The system processes video landmarks in real-time and converts finger positions to canvas coordinates, accounting for camera mirroring so gestures feel natural.

### Error Detection & Feedback

Real-time trajectory analysis provides specific, actionable feedback:

- **"Too Fast"** — User is moving too quickly for accurate drawing
- **"Move Closer"** — Hand is too small in the frame for reliable tracking
- **"Wrong Shape"** — Drawn shape doesn't match the target template
- **"Make It Larger"** — Circle/shape is too small to evaluate
- **"Complete the Shape"** — User hasn't finished the gesture
- **"Hand Position Unclear"** — Gesture is ambiguous; hand needs adjustment

Each challenge (circle, triangle, star) has custom validation rules that measure:
- Distance from target trajectory
- Shape continuity
- Movement speed and smoothness
- Completion and closure

## Features

### Challenge Mode
Draw geometric shapes (circle, triangle, star) against semi-transparent templates. Each challenge:
- Shows the target shape as a guide
- Runs a 20-second timer
- Provides real-time error feedback
- Calculates accuracy score

### Real-Time Feedback
- **Hand skeleton overlay** on the camera preview (wrist, fingers, joints)
- **Gesture indicator** shows current detected gesture and confidence
- **Status messages** confirm hand detection and provide guidance

### Result Screen
After completing challenges, view:
- Overall score
- Per-challenge accuracy percentages
- Time taken
- Difficulty rating ("Artist Level", "Great Job", etc.)

### Responsive Design
Works on desktop and mobile devices. Simply allow camera access and start drawing.

## Hackathon Requirements

| Requirement | Implementation |
| --- | --- |
| **Webcam Recognition** | MediaPipe Hands in browser |
| **Real-Time Processing** | Landmarks processed live from video stream |
| **No Keyboard/Mouse** | Pure gesture control |
| **Minimum 3 Gestures** | Index, Fist, Open Palm, Pinch (4 total) |
| **Gesture Actions** | Draw, Erase, Brush Size, Color Selection |
| **Visual Feedback** | Hand skeleton + gesture indicator + status messages |
| **Complete Scenario** | Camera → Tutorial → Challenges (3) → Results |
| **Error Detection** | Trajectory analysis with specific hints |
| **Actionable Feedback** | "Move closer", "Slow down", "Draw wider circle", etc. |
| **Custom Logic** | Hand landmark rules, no external ML model |
| **Web Deployment** | React/TypeScript + Vite on Vercel |
| **Zero Installation** | Standard web app (no native software needed) |
| **Bonus: Leaderboard** | localStorage-based score tracking |
| **Bonus: Mobile** | Responsive camera UI and touch-friendly layout |
| **Bonus: Audio** | Success and error sound effects |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Vision**: MediaPipe Hands (for landmark detection)
- **Drawing**: Canvas API
- **Styling**: Tailwind CSS
- **Bundler**: Vite
- **Testing**: Vitest + Happy DOM
- **Deployment**: Vercel

## Project Structure

```
src/
├── components/        # React components (Camera, Canvas, etc.)
├── vision/           # Hand tracking and landmark processing
├── drawing/          # Brush, eraser, and color logic
├── challenges/       # Challenge definitions and scoring
├── data/            # Challenge templates and configuration
└── App.tsx          # Main application component
```

## Development

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test:run

# Run tests in watch mode
npm run test
```

## Notes

- Camera permission is required; the app requests it on first load
- Hand tracking works best in well-lit environments
- The app runs entirely in the browser—no server required
- Drawing data is stored in browser memory only (no persistence)

---

Built for HackAdmit 2024 🚀
