import { useEffect, useRef } from 'react';

interface CameraProps {
  onFrame: (video: HTMLVideoElement, ts: number) => void;
  onError: (msg: string) => void;
  onReady: () => void;
  className?: string;
}

export function Camera({ onFrame, onError, onReady, className }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const onFrameRef = useRef(onFrame);
  const onErrorRef = useRef(onError);
  const onReadyRef = useRef(onReady);

  onFrameRef.current = onFrame;
  onErrorRef.current = onError;
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function start(attempt = 0) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        if (!videoRef.current) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        onReadyRef.current();
        loop();
      } catch (err) {
        if (cancelled) return;
        const name = (err as DOMException).name;
        console.error('[Camera] getUserMedia/play failed:', name, err);
        // React StrictMode fires two concurrent getUserMedia calls; Firefox aborts both.
        // Retry once after a short delay to let the first request clear.
        if (name === 'AbortError' && attempt === 0) {
          retryTimer = setTimeout(() => { if (!cancelled) start(1); }, 300);
          return;
        }
        const msg =
          name === 'NotReadableError'
            ? 'Camera is in use by another app — close it and reload.'
            : name === 'NotFoundError'
            ? 'No camera found on this device.'
            : name === 'OverconstrainedError'
            ? 'Camera does not support the requested constraints.'
            : 'Camera unavailable — allow camera access and reload.';
        onErrorRef.current(msg);
      }
    }

    function loop() {
      const video = videoRef.current;
      if (!video || cancelled) return;
      onFrameRef.current(video, performance.now());
      rafRef.current = requestAnimationFrame(loop);
    }

    start();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      style={{ transform: 'scaleX(-1)' }}
      playsInline
      muted
    />
  );
}
