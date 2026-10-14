import React, { useEffect, useRef } from 'react';
import { SOUL_SKINS, ParticleSystem, drawSoul, SoulConfig } from '../lib/soulMath';

interface SoulCanvasProps {
  soul?: SoulConfig;
  skinKey?: string;
  width?: number;
  height?: number;
  scale?: number;
  mode?: 'LISTENING' | 'THINKING' | 'TALKING' | 'YAWNING' | 'MUTED';
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SoulCanvas: React.FC<SoulCanvasProps> = ({
  soul: soulProp,
  skinKey = 'flame_hitodama',
  width = 200,
  height = 160,
  scale = 1,
  mode = 'LISTENING',
  interactive = true,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const soul = soulProp || SOUL_SKINS.find(s => s.key === skinKey) || SOUL_SKINS[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const particles = new ParticleSystem(soul.aura, soul.mid, soul.glow);

    let animId = 0;
    let lastTime = performance.now();
    let totalTime = 0;

    const gaze = { x: 0, y: 0 };
    let lastMoveTime = performance.now();

    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) / (rect.width * 1.5);
      const dy = (e.clientY - centerY) / (rect.height * 1.5);
      gaze.x = Math.max(-1, Math.min(1, dx));
      gaze.y = Math.max(-1, Math.min(1, dy));
      lastMoveTime = performance.now();
    };

    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      totalTime += dt;

      // Idle gaze wandering if pointer hasn't moved
      if (now - lastMoveTime > 3000) {
        gaze.x += (Math.sin(totalTime * 0.7) * 0.4 - gaze.x) * 0.05;
        gaze.y += (Math.sin(totalTime * 0.5 + 1) * 0.25 - gaze.y) * 0.05;
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const center = { x: width / 2, y: height / 2 + 6 };
      const radius = Math.min(width, height) * 0.28 * scale;

      // Update & render aura particles
      particles.update(dt, 1, {
        x: center.x - radius,
        y: center.y - radius * 1.2,
        w: radius * 2,
        h: radius * 2.2,
      });
      particles.paint(ctx, totalTime);

      // Draw character body & face
      drawSoul(ctx, center, radius, {
        core: soul.core,
        mid: soul.mid,
        glow: soul.glow,
        time: totalTime,
        mode,
        gaze,
      });

      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove);
      }
    };
  }, [soul, width, height, scale, mode, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
        ...style,
      }}
      role="img"
      aria-label={`${soul.name} Soul`}
    />
  );
};
