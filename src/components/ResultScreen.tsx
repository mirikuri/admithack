import type { FinalScore } from '../challenges/scoring';

interface ResultScreenProps {
  finalScore: FinalScore;
  onRestart: () => void;
}

export function ResultScreen({ finalScore, onRestart }: ResultScreenProps) {
  const minutes = Math.floor(finalScore.totalTime / 60).toString().padStart(2, '0');
  const seconds = (finalScore.totalTime % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e2e] text-white gap-6">
      <h1 className="text-3xl font-bold">🎨 YOUR RESULT</h1>
      <div className="text-6xl font-black text-indigo-400">{finalScore.total} / 100</div>
      <div className="text-xl text-yellow-400">{finalScore.level}</div>

      <div className="bg-white/10 rounded-2xl p-6 min-w-[280px]">
        {finalScore.results.map(r => (
          <div key={r.id} className="flex justify-between py-1 border-b border-white/10">
            <span>{r.name}</span>
            <span className="text-indigo-300 font-bold">{r.scoring.score}%</span>
          </div>
        ))}
        <div className="mt-3 text-gray-400 text-sm text-right">Total time: {minutes}:{seconds}</div>
      </div>

      <button
        onClick={onRestart}
        className="mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-colors"
      >
        BACK TO MENU
      </button>
    </div>
  );
}
