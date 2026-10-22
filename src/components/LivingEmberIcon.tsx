// src/components/LivingEmberIcon.tsx
import React, { useEffect, useRef } from 'react';

interface LivingEmberIconProps {
  size?: number;
  isDull?: boolean;
}

export const LivingEmberIcon: React.FC<LivingEmberIconProps> = ({
  size = 16,
  isDull = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animId: number;
    let t = Math.random() * 50;

    const render = () => {
      t += isDull ? 0.025 : 0.055;
      ctx.clearRect(0, 0, size, size);

      const cx = size * 0.5;
      const cy = size * 0.62 + Math.sin(t * 1.4) * (size * 0.04);
      const r = size * 0.25;
      const flameH = r * (isDull ? 1.4 : 1.75 + Math.sin(t * 2.3) * 0.14);
      const sway = Math.sin(t * 1.8) * (size * 0.08);

      const outerColor = isDull ? '#64748B' : '#F59E0B';
      const midColor = isDull ? '#94A3B8' : '#FBBF24';
      const coreColor = isDull ? '#CBD5E1' : '#FFFBEB';

      // Soft ambient aura
      const aura = ctx.createRadialGradient(cx, cy - r * 0.2, 0.5, cx, cy - r * 0.2, r * 1.8);
      aura.addColorStop(0, isDull ? 'rgba(148, 163, 184, 0.22)' : 'rgba(245, 158, 11, 0.38)');
      aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.2, r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Outer swaying Hitodama ember teardrop
      ctx.fillStyle = outerColor;
      ctx.beginPath();
      ctx.moveTo(cx + sway, cy - flameH);
      ctx.bezierCurveTo(
        cx + r * 1.35 + sway * 0.4,
        cy - flameH * 0.3,
        cx + r * 1.25,
        cy + r * 0.95,
        cx,
        cy + r
      );
      ctx.bezierCurveTo(
        cx - r * 1.25,
        cy + r * 0.95,
        cx - r * 1.35 + sway * 0.4,
        cy - flameH * 0.3,
        cx + sway,
        cy - flameH
      );
      ctx.fill();

      // Mid golden-amber tongue
      ctx.fillStyle = midColor;
      ctx.beginPath();
      ctx.moveTo(cx + sway * 0.7, cy - flameH * 0.72);
      ctx.bezierCurveTo(
        cx + r * 0.9 + sway * 0.3,
        cy - flameH * 0.2,
        cx + r * 0.85,
        cy + r * 0.75,
        cx,
        cy + r * 0.8
      );
      ctx.bezierCurveTo(
        cx - r * 0.85,
        cy + r * 0.75,
        cx - r * 0.9 + sway * 0.3,
        cy - flameH * 0.2,
        cx + sway * 0.7,
        cy - flameH * 0.72
      );
      ctx.fill();

      // White-hot inner ember heart
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.15, r * 0.42, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [size, isDull]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block',
        pointerEvents: 'none',
        flexShrink: 0,
      }}
    />
  );
};
