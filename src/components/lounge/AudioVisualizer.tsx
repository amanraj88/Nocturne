import React, { useEffect, useRef } from 'react';
import { useLounge } from '@/context/LoungeContext';

interface VisualizerProps {
  className?: string;
  barCount?: number;
}

export const AudioVisualizer: React.FC<VisualizerProps> = ({ className = '', barCount = 32 }) => {
  const { isPlaying, quality } = useLounge();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (quality === 'off') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / barCount - 2;

      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, 'rgba(185, 154, 255, 0.25)');
      gradient.addColorStop(1, 'rgba(185, 154, 255, 0.85)');

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          const freq1 = Math.sin((i / barCount) * Math.PI * 4 + phase) * 0.35;
          const freq2 = Math.cos((i / barCount) * Math.PI * 2.5 - phase * 0.8) * 0.25;
          const centerWeight = Math.sin((i / barCount) * Math.PI);
          const intensity = Math.max(0.08, (0.45 + freq1 + freq2) * centerWeight);
          barHeight = Math.min(height, Math.max(4, intensity * height * 0.85));
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [1, 1, 0, 0]);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.04;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, quality, barCount]);

  if (quality === 'off') {
    return (
      <div className={`h-8 flex items-center justify-center opacity-20 ${className}`}>
        <div className="w-full h-[1px] bg-lavender/30" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        width={360}
        height={40}
        className="w-full h-10 block"
      />
    </div>
  );
};
