import React, { useEffect, useRef } from 'react';
import { useLounge } from '@/context/LoungeContext';

interface VisualizerProps {
  className?: string;
  barCount?: number;
}

export const AudioVisualizer: React.FC<VisualizerProps> = ({ className = '', barCount = 36 }) => {
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

      // Color gradient: Electric Lavender to Warm Coral
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, 'rgba(185, 154, 255, 0.4)');
      gradient.addColorStop(0.7, 'rgba(185, 154, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(255, 128, 107, 0.95)');

      for (let i = 0; i < barCount; i++) {
        let barHeight = 6;
        if (isPlaying) {
          // harmonic wave equation simulating realistic audio spectrum
          const freq1 = Math.sin((i / barCount) * Math.PI * 4 + phase) * 0.35;
          const freq2 = Math.cos((i / barCount) * Math.PI * 2.5 - phase * 0.8) * 0.25;
          const freq3 = Math.sin((i / 5) + phase * 1.5) * 0.15;
          const centerWeight = Math.sin((i / barCount) * Math.PI); // center emphasis
          const intensity = Math.max(0.1, (0.5 + freq1 + freq2 + freq3) * centerWeight);
          barHeight = Math.min(height, Math.max(4, intensity * height * 0.85));
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        ctx.fillStyle = gradient;
        // Rounded bar caps
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.045;
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
      <div className={`h-8 flex items-center justify-center opacity-30 ${className}`}>
        <div className="w-full h-[1px] bg-lavender-400/40" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={360}
        height={48}
        className="w-full h-12 block"
      />
    </div>
  );
};
