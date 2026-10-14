import type { FinalScore } from '../challenges/scoring';

interface ResultScreenProps {
  finalScore: FinalScore;
  onRestart: () => void;
}

export function ResultScreen({ finalScore, onRestart }: ResultScreenProps) {
  const minutes = Math.floor(finalScore.totalTime / 60).toString().padStart(2, '0');
  const seconds = (finalScore.totalTime % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ink text-paper gap-6 px-6">
      <div className="text-[6rem] font-extrabold leading-none text-stroke tabular-nums">
        {finalScore.total}
      </div>
      <div className="text-sm text-paper/50 -mt-4">out of 100</div>
      <div className="text-2xl font-semibold text-trace">{finalScore.level}</div>

      <div className="w-full max-w-xs mt-2">
        {finalScore.results.map(r => (
          <div key={r.id} className="flex justify-between py-2 border-b border-white/10 text-sm">
            <span className="text-paper/70">{r.name}</span>
            <span className="font-semibold text-paper">{r.scoring.score}%</span>
          </div>
        ))}
        <div className="mt-3 text-white/30 text-xs text-right">{minutes}:{seconds}</div>
      </div>

      <button
        onClick={onRestart}
        className="mt-4 px-8 py-3 bg-stroke hover:bg-stroke/80 text-white rounded-lg font-semibold transition-colors"
      >
        Back to menu
      </button>
    </div>
  );
}
