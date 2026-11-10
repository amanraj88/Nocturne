import React, { useEffect, useRef } from 'react';
import { useLounge } from '@/context/LoungeContext';

interface VisualizerProps {
  className?: string;
  lineCount?: number;
}

/**
 * AudioVisualizer — Technically honest playback state harmonic monitor.
 * Reflects active playback state with dual-wave harmonic oscillation.
 * Does not fabricate FFT frequency telemetry.
 */
export const AudioVisualizer: React.FC<VisualizerProps> = ({ className = '', lineCount = 48 }) => {
  const { isPlaying, quality } = useLounge();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (quality === 'off') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const displayWidth = 380;
    const displayHeight = 36;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      const centerY = displayHeight / 2;
      const step = displayWidth / (lineCount - 1);

      // Resting baseline rail
      ctx.strokeStyle = '#292E2A'; // graphite
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(displayWidth, centerY);
      ctx.stroke();

      if (isPlaying) {
        // Ghost persistence harmonic wave (Mineral subtle)
        ctx.strokeStyle = 'rgba(160, 183, 168, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < lineCount; i++) {
          const x = i * step;
          const envelope = Math.sin((i / (lineCount - 1)) * Math.PI);
          const y = centerY + Math.sin(i * 0.35 - phase * 0.6) * 5 * envelope;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Primary harmonic amplitude wave (Mineral)
        ctx.strokeStyle = '#A0B7A8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < lineCount; i++) {
          const x = i * step;
          const envelope = Math.sin((i / (lineCount - 1)) * Math.PI);
          const wave1 = Math.sin(i * 0.42 + phase) * 8;
          const wave2 = Math.cos(i * 0.28 - phase * 0.75) * 4;
          const y = centerY + (wave1 + wave2) * envelope;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        phase += 0.045;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, quality, lineCount]);

  if (quality === 'off') {
    return (
      <div className={`h-9 flex items-center justify-center opacity-30 ${className}`}>
        <div className="w-full h-[1px] bg-mineral" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden w-full max-w-full flex justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ width: '100%', height: '36px', maxWidth: '380px' }}
        className="block"
      />
    </div>
  );
};
