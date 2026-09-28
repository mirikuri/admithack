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

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        onReady();
        loop();
      } catch {
        onError('Camera unavailable — allow camera access and reload.');
      }
    }

    function loop() {
      const video = videoRef.current;
      if (!video) return;
      onFrame(video, performance.now());
      rafRef.current = requestAnimationFrame(loop);
    }

    start();
    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [onFrame, onError, onReady]);

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
