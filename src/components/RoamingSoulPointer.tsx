// src/components/RoamingSoulPointer.tsx
// Choreographed Roaming Spirit Pointer ("Peek, Fly & Point")

import React, { useEffect, useState, useRef } from 'react';
import { SoulConfig } from '../lib/soulMath';
import { PointedTarget } from '../lib/screenPointerFinder';
import { SoulCanvas } from './SoulCanvas';

export interface RoamingSoulPointerProps {
  soul: SoulConfig;
  target: PointedTarget | null;
  query: string;
  stage: 'PEEKING' | 'FLYING' | 'POINTING' | 'RETURNING' | 'IDLE';
  isVoid?: boolean;
  onDismiss: () => void;
  onTargetClick?: () => void;
  onReturningDone: () => void;
}

export const RoamingSoulPointer: React.FC<RoamingSoulPointerProps> = ({
  soul,
  target,
  query,
  stage,
  isVoid = false,
  onDismiss,
  onTargetClick,
  onReturningDone,
}) => {
  const [spiritPos, setSpiritPos] = useState({ x: 960, y: -30 });
  const [spiritRotation, setSpiritRotation] = useState(0);
  const [spiritScale, setSpiritScale] = useState(1.12);
  const [spiritOpacity, setSpiritOpacity] = useState(1);
  const [lookGaze, setLookGaze] = useState<{ x: number; y: number } | null>(null);
  const [localExpression, setLocalExpression] = useState<
    'NORMAL' | 'PEEKING' | 'EXCITED' | 'POINTING' | 'HAPPY' | 'WINK'
  >('PEEKING');

  const animFrameRef = useRef<number | null>(null);

  // Initialize position to notch center
  useEffect(() => {
    const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 960;
    setSpiritPos({ x: cx, y: -30 });
  }, []);

  // Global Escape & dismiss handlers via Electron IPC + local keydown fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stage !== 'IDLE' && stage !== 'RETURNING') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Global shortcut listener from Electron main process
    const unbindGlobal = (window as any).hitodamaAPI?.onRoamingDismiss?.(() => {
      if (stage !== 'IDLE' && stage !== 'RETURNING') {
        onDismiss();
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (unbindGlobal) unbindGlobal();
    };
  }, [stage, onDismiss]);

  // Tell Electron when roaming is active (for global shortcut & click-through management)
  useEffect(() => {
    if (stage !== 'IDLE') {
      (window as any).hitodamaAPI?.setRoamingActive?.(true);
    } else {
      (window as any).hitodamaAPI?.setRoamingActive?.(false);
      (window as any).hitodamaAPI?.setRoamingTargetRect?.(null);
    }
  }, [stage]);

  // Update Electron hitboxes: target reticle + compact HUD pill + soul body
  useEffect(() => {
    if (stage === 'POINTING' && target) {
      const rx = Math.max(0, target.x - target.width / 2 - 14);
      const ry = Math.max(0, target.y - target.height / 2 - 14);
      const rw = target.width + 28;
      const rh = target.height + 28;

      // Compact floating pill position
      const pillW = 220;
      const pillX = Math.max(16, Math.min(window.innerWidth - pillW - 16, target.x - pillW / 2));
      const pillY =
        target.y > 90
          ? Math.max(16, target.y - target.height / 2 - 42)
          : target.y + target.height / 2 + 14;

      (window as any).hitodamaAPI?.setRoamingTargetRect?.([
        { x: rx, y: ry, width: rw, height: rh },
        { x: pillX - 8, y: pillY - 8, width: pillW + 16, height: 48 },
        { x: spiritPos.x - 42, y: spiritPos.y - 34, width: 84, height: 68 },
      ]);
    } else {
      (window as any).hitodamaAPI?.setRoamingTargetRect?.(null);
    }
  }, [stage, target, spiritPos.x, spiritPos.y]);

  // Choreographed animations
  useEffect(() => {
    if (stage === 'IDLE') return;

    const notchX = window.innerWidth / 2;
    const mouthY = 46;
    const startX = spiritPos.x;
    const startY = spiritPos.y;

    // 1. PEEKING: Slides down smoothly from inside notch bezel and scans curiously
    if (stage === 'PEEKING') {
      setLocalExpression('PEEKING');
      setSpiritScale(1.12);
      setSpiritOpacity(1);
      const t0 = performance.now();

      const loop = (now: number) => {
        const elapsed = now - t0;
        // Ease down out of the bezel from -30px to 46px over 480ms
        const progress = Math.min(1, elapsed / 480);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const baseY = -30 + (mouthY - (-30)) * easeOut;

        // Subtle hovering and rhythmic scanning
        const tSec = elapsed / 1000;
        const curY = baseY + Math.sin(tSec * 4) * 2.5;
        const scanGazeX = Math.sin(tSec * 3) * 0.75;

        setSpiritPos({ x: notchX, y: curY });
        setLookGaze({ x: scanGazeX, y: 0.92 });
        setSpiritRotation(scanGazeX * 4.5);

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    // 2. FLYING: Swoops along a graceful Bezier curve towards the target
    if (stage === 'FLYING') {
      setLocalExpression('EXCITED');
      setSpiritScale(1.12);
      setSpiritOpacity(1);
      if (!target) return;

      const preferRight = target.x < window.innerWidth - 240;
      const destX = preferRight
        ? target.x + target.width / 2 + 54
        : target.x - target.width / 2 - 54;
      const destY = Math.max(70, target.y - 8);

      const midX = (startX + destX) / 2 + (preferRight ? -25 : 25);
      const midY = Math.min(startY, destY) - 50;

      const durationMs = 820;
      const t0 = performance.now();

      const fly = (now: number) => {
        const elapsed = now - t0;
        const p = Math.min(1, elapsed / durationMs);
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

        const u = 1 - ease;
        const curX = u * u * startX + 2 * u * ease * midX + ease * ease * destX;
        const curY = u * u * startY + 2 * u * ease * midY + ease * ease * destY;

        const dx = destX - startX;
        const bank = Math.max(-22, Math.min(22, (dx / 40) * Math.sin(p * Math.PI)));

        setSpiritPos({ x: curX, y: curY });
        setSpiritRotation(bank);
        setLookGaze({
          x: Math.max(-1, Math.min(1, (target.x - curX) / 100)),
          y: Math.max(-1, Math.min(1, (target.y - curY) / 100)),
        });

        if (p < 1) {
          animFrameRef.current = requestAnimationFrame(fly);
        } else {
          setSpiritPos({ x: destX, y: destY });
          setSpiritRotation(0);
        }
      };

      animFrameRef.current = requestAnimationFrame(fly);
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    // 3. POINTING: Parks beside the target, locking gaze and displaying reticle
    if (stage === 'POINTING') {
      setLocalExpression('POINTING');
      setSpiritScale(1.12);
      setSpiritOpacity(1);
      if (!target) return;

      let t = 0;
      const preferRight = target.x < window.innerWidth - 240;
      const baseDestX = preferRight
        ? target.x + target.width / 2 + 54
        : target.x - target.width / 2 - 54;
      const baseDestY = Math.max(70, target.y - 8);

      const loop = () => {
        t += 0.045;
        const curX = baseDestX + Math.sin(t * 1.6) * 3;
        const curY = baseDestY + Math.cos(t * 2.2) * 4;

        setSpiritPos({ x: curX, y: curY });
        setLookGaze({
          x: Math.max(-1, Math.min(1, (target.x - curX) / 80)),
          y: Math.max(-1, Math.min(1, (target.y - curY) / 80)),
        });
        setSpiritRotation(Math.sin(t * 1.8) * 3.5);

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    // 4. RETURNING: 3-Phase Return (Swoop to Notch Mouth -> Cute Wink & Bob -> Slide Up into Notch)
    if (stage === 'RETURNING') {
      const curX = spiritPos.x;
      const curY = spiritPos.y;
      const targetMouthY = 46;
      const t0 = performance.now();

      const returnLoop = (now: number) => {
        const elapsed = now - t0;

        if (elapsed < 520) {
          // Phase 1: Swoop gracefully back to the notch mouth
          setLocalExpression('HAPPY');
          const p = elapsed / 520;
          const ease = 1 - Math.pow(1 - p, 3); // cubic ease out
          const x = curX + (notchX - curX) * ease;
          const y = curY + (targetMouthY - curY) * ease;
          const dx = notchX - curX;
          const bank = Math.max(-18, Math.min(18, (dx / 32) * (1 - p)));

          setSpiritPos({ x, y });
          setSpiritRotation(bank);
          setSpiritScale(1.12);
          setSpiritOpacity(1);
          setLookGaze({ x: (notchX - x) / 100, y: -0.5 });
          animFrameRef.current = requestAnimationFrame(returnLoop);
        } else if (elapsed < 900) {
          // Phase 2: Stop right below the notch aperture, face user, and give a cute wink with buoyant bob
          setLocalExpression('WINK');
          const p2 = (elapsed - 520) / 380;
          // Buoyant bob: rises ~5px then settles
          const bobY = Math.sin(p2 * Math.PI) * -5;

          setSpiritPos({ x: notchX, y: targetMouthY + bobY });
          setSpiritRotation(0);
          setSpiritScale(1.12);
          setSpiritOpacity(1);
          setLookGaze({ x: 0, y: 0.1 });
          animFrameRef.current = requestAnimationFrame(returnLoop);
        } else if (elapsed < 1220) {
          // Phase 3: Slide straight up into the notch bezel and tuck home
          const p3 = Math.min(1, (elapsed - 900) / 320);
          const easeIn = Math.pow(p3, 2.5);
          const y = targetMouthY - easeIn * (targetMouthY + 50); // straight into bezel to -50px
          const scale = 1.12 - easeIn * 0.45;
          const alpha = Math.max(0, 1 - easeIn * 1.25);

          setSpiritPos({ x: notchX, y });
          setSpiritRotation(0);
          setSpiritScale(scale);
          setSpiritOpacity(alpha);
          setLookGaze({ x: 0, y: -1 });

          if (p3 < 1) {
            animFrameRef.current = requestAnimationFrame(returnLoop);
          } else {
            setSpiritPos({ x: notchX, y: -50 });
            setSpiritOpacity(0);
            (window as any).hitodamaAPI?.setRoamingActive?.(false);
            (window as any).hitodamaAPI?.setRoamingTargetRect?.(null);
            onReturningDone();
          }
        } else {
          setSpiritPos({ x: notchX, y: -50 });
          setSpiritOpacity(0);
          (window as any).hitodamaAPI?.setRoamingActive?.(false);
          (window as any).hitodamaAPI?.setRoamingTargetRect?.(null);
          onReturningDone();
        }
      };

      animFrameRef.current = requestAnimationFrame(returnLoop);
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [stage, target]);

  if (stage === 'IDLE') return null;

  // Compute sleek floating pill coordinates
  const pillW = 210;
  const pillX = target ? Math.max(16, Math.min(window.innerWidth - pillW - 16, target.x - pillW / 2)) : 0;
  const pillY = target
    ? target.y > 90
      ? Math.max(16, target.y - target.height / 2 - 40)
      : target.y + target.height / 2 + 12
    : 0;

  return (
    <div className="roaming-stage-overlay">
      {/* 1. TARGET RETICLE & CONNECTING LASER TENDRIL */}
      {target && (stage === 'POINTING' || stage === 'FLYING') && (
        <>
          {/* Pulsing Target Bounding Box */}
          <div
            className="roaming-target-reticle"
            style={{
              left: `${target.x - target.width / 2}px`,
              top: `${target.y - target.height / 2}px`,
              width: `${target.width}px`,
              height: `${target.height}px`,
              borderColor: isVoid ? '#C4B5FD' : '#5CB8FF',
            }}
            onClick={() => {
              if (onTargetClick) onTargetClick();
              onDismiss();
            }}
            title="Click to select target (Esc to return)"
          >
            <span className="roaming-target-corner tl" />
            <span className="roaming-target-corner tr" />
            <span className="roaming-target-corner bl" />
            <span className="roaming-target-corner br" />
          </div>

          {/* Curved glowing pointer arc connecting Hitodama to target */}
          {stage === 'POINTING' && (
            <svg
              style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 99998,
              }}
            >
              <defs>
                <linearGradient id="spiritBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isVoid ? '#A78BFA' : '#38BDF8'} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={isVoid ? '#DDD6FE' : '#BAE6FD'} stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d={`M ${spiritPos.x} ${spiritPos.y} Q ${(spiritPos.x + target.x) / 2} ${
                  Math.min(spiritPos.y, target.y) - 25
                } ${target.x} ${target.y}`}
                stroke="url(#spiritBeam)"
                strokeWidth="2.4"
                strokeDasharray="6 4"
                fill="none"
                style={{
                  filter: isVoid
                    ? 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.7))'
                    : 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.7))',
                }}
              />
            </svg>
          )}

          {/* 2. SLEEK MINIMALIST FLOATING HUD CAPSULE PILL */}
          {stage === 'POINTING' && (
            <div
              className={`roaming-target-pill ${isVoid ? 'is-void' : ''}`}
              style={{
                left: `${pillX}px`,
                top: `${pillY}px`,
              }}
            >
              <div className="roaming-pill-pin">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="roaming-pill-label">{target.label || query}</span>
              <span className="roaming-pill-sep">·</span>
              <span className="roaming-pill-hint">Esc to return</span>
              <button className="roaming-pill-done" onClick={onDismiss} title="Dismiss (Esc)">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* 3. ROAMING HITODAMA SPIRIT BODY */}
      <div
        style={{
          position: 'fixed',
          left: `${spiritPos.x}px`,
          top: `${spiritPos.y}px`,
          transform: `translate(-50%, -50%) rotate(${spiritRotation}deg) scale(${spiritScale})`,
          opacity: spiritOpacity,
          pointerEvents: 'none',
          zIndex: 100000,
          transition: stage === 'POINTING' ? 'none' : 'transform 0.05s linear',
        }}
      >
        <SoulCanvas
          soul={soul}
          width={84}
          height={68}
          scale={1.12}
          mode={stage === 'POINTING' ? 'TALKING' : 'LISTENING'}
          interactive={false}
          lookOverride={lookGaze}
          expression={localExpression}
        />
      </div>
    </div>
  );
};
