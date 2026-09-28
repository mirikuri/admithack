interface FeedbackProps {
  message: string | null;
}

export function Feedback({ message }: FeedbackProps) {
  if (!message) return null;
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black font-bold px-6 py-3 rounded-xl text-center text-sm shadow-lg animate-pulse max-w-xs">
      ⚠️ {message}
    </div>
  );
}
