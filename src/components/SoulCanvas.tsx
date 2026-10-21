// src/components/SoulCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { SOUL_SKINS, SoulConfig, hexToRgb } from '../lib/soulMath';

export interface SoulCanvasProps {
  soul?: SoulConfig;
  skinKey?: string;
  width?: number;
  height?: number;
  scale?: number;
  mode?: 'LISTENING' | 'THINKING' | 'TALKING' | 'YAWNING' | 'MUTED';
  interactive?: boolean;
  annoyance?: number;
  isHit?: boolean;
  isBreathingRelief?: boolean;
  lookOverride?: { x: number; y: number } | null;
  expression?: 'NORMAL' | 'PEEKING' | 'EXCITED' | 'POINTING' | 'HAPPY' | 'WINK' | 'YAWNING';
  onClick?: (e?: any) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  phase: number;
}

export const SoulCanvas: React.FC<SoulCanvasProps> = ({
  soul: soulProp,
  skinKey = 'flame_hitodama',
  width = 84,
  height = 64,
  scale = 1,
  mode = 'LISTENING',
  interactive = true,
  annoyance = 0,
  isHit = false,
  isBreathingRelief = false,
  lookOverride = null,
  expression = 'NORMAL',
  onClick,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const soul = soulProp || (skinKey ? SOUL_SKINS.find((s) => s.key === skinKey) : null) || SOUL_SKINS[0];

  const annoyanceRef = useRef(annoyance);
  annoyanceRef.current = annoyance;

  const isHitRef = useRef(isHit);
  isHitRef.current = isHit;

  const isBreathingReliefRef = useRef(isBreathingRelief);
  isBreathingReliefRef.current = isBreathingRelief;

  const lookOverrideRef = useRef(lookOverride);
  lookOverrideRef.current = lookOverride;

  const expressionRef = useRef(expression);
  expressionRef.current = expression;

  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Smooth tracking across a comfortable desktop distance (280px)
      const rawDx = (e.clientX - cx) / 280;
      const rawDy = (e.clientY - cy) / 220;
      const clampedDx = Math.max(-1, Math.min(1, rawDx));
      const clampedDy = Math.max(-1, Math.min(1, rawDy));
      // Organic curve so fine movements near center are calm and never twitchy
      mouseRef.current = {
        x: Math.sign(clampedDx) * Math.pow(Math.abs(clampedDx), 0.9),
        y: Math.sign(clampedDy) * Math.pow(Math.abs(clampedDy), 0.9),
      };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.scale(dpr, dpr);

    // Extract colors from SoulConfig
    const s = soul as any;
    const baseMid = s?.mid || s?.primaryColor || s?.color || '#5CB8FF';
    const baseGlow = s?.glow || s?.secondaryColor || s?.glowColor || '#0284C7';
    const baseCore = s?.core || s?.coreColor || '#E0F7FF';

    const baseMidRgb = hexToRgb(baseMid);
    const baseGlowRgb = hexToRgb(baseGlow);
    const baseCoreRgb = hexToRgb(baseCore);

    // Enraged fiery crimson targets
    const angryMidRgb: [number, number, number] = [239, 68, 68];
    const angryGlowRgb: [number, number, number] = [220, 38, 38];
    const angryCoreRgb: [number, number, number] = [254, 202, 202];

    // Rising spirit ember particles
    const embers: EmberParticle[] = Array.from({ length: 14 }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 0,
      alpha: 0,
      decay: 0.02,
      phase: Math.random() * Math.PI * 2,
    }));

    const spawnEmber = (p: EmberParticle, cx: number, cy: number, r: number) => {
      p.x = cx + (Math.random() - 0.5) * r * 1.1;
      p.y = cy - r * (0.3 + Math.random() * 0.8);
      p.vx = (Math.random() - 0.5) * 0.24;
      p.vy = -(0.22 + Math.random() * 0.38);
      p.radius = (1.0 + Math.random() * 1.5) * scale;
      p.alpha = 0.65 + Math.random() * 0.35;
      p.decay = 0.012 + Math.random() * 0.014;
      p.phase = Math.random() * Math.PI * 2;
    };

    let animId: number;
    let time = Math.random() * 100;
    let blinkTimer = 0;
    let isBlinking = false;
    let currentGaze = { x: 0, y: 0 };
    let currentAnnoyance = annoyanceRef.current;
    let wasHit = false;
    let flinchRemaining = 0;
    let reliefElapsed = 0;
    let wasBreathing = false;
    let lastTime = performance.now();

    // Multi-octave upward-advecting flame contour generator (organic Ghibli fire spirit advection)
    const drawFlameLayer = (
      cx: number,
      cy: number,
      baseR: number,
      flameHeight: number,
      t: number,
      turbulence: number,
      phaseOffset: number,
      swayX: number
    ) => {
      const steps = 64;
      ctx.beginPath();

      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        // theta = 0 is right, PI/2 is bottom, PI is left, 3*PI/2 is top crown
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);

        // Normalized height factor: 0 at bottom belly, 1 at top crown
        const heightFactor = Math.pow(Math.max(0, (1 - sinT) * 0.5), 1.15);

        // Upward-traveling Kelvin-Helmholtz fire waves advecting with lively flame energy
        const upwardWave1 = Math.sin(heightFactor * 5.8 - t * 3.6 + phaseOffset + cosT * 1.3);
        const upwardWave2 = Math.cos(heightFactor * 9.2 - t * 4.8 - phaseOffset * 1.0);
        const microFlicker = Math.sin(t * 7.0 + cosT * 4.0) * 0.06;
        const crownLicks =
          heightFactor > 0.35
            ? Math.sin(cosT * 4.2 + Math.sin(t * 2.8 + phaseOffset) * 1.2) *
              Math.pow((heightFactor - 0.35) / 0.65, 1.25)
            : 0;

        // Horizontal width pinches inward toward the top but flares into licking fire tongues
        const pinch = 1 - Math.pow(heightFactor, 1.65) * 0.72;
        const sideFlicker =
          heightFactor *
          turbulence *
          baseR *
          (0.16 * upwardWave1 + 0.08 * upwardWave2 + 0.22 * crownLicks + microFlicker);

        const rx = baseR * pinch + sideFlicker;

        // Vertical stretch: round buoyant bottom, tall dancing fire tongues at the crown
        let yOffset = sinT * baseR * 0.88;
        if (sinT < 0) {
          const crownReach =
            flameHeight *
            Math.pow(-sinT, 1.35) *
            (1 + 0.22 * upwardWave1 * turbulence + 0.28 * crownLicks * turbulence);
          yOffset = -crownReach;
        }

        // Top of the flame sways gently with mouse drag and upward waves
        const xSway =
          Math.pow(heightFactor, 1.4) *
          (swayX + Math.sin(t * 2.6 + heightFactor * 2.8 + phaseOffset) * baseR * 0.22 * turbulence);

        const px = cx + cosT * rx + xSway;
        const py = cy + yOffset;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.closePath();
    };

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Speed & energy scale by mode: lively organic fire dance
      const speedMult =
        mode === 'TALKING' ? 1.45 : mode === 'THINKING' ? 1.25 : mode === 'MUTED' ? 0.6 : 1.0;
      time += dt * (2.1 * speedMult);

      // Smooth annoyance interpolation
      const annoyanceLerp = 1 - Math.exp(-6.0 * dt);
      currentAnnoyance += (annoyanceRef.current - currentAnnoyance) * annoyanceLerp;

      // Smooth, curious mouse tracking or lookOverride target with silky lag and gradual deceleration
      const targetGazeX = lookOverrideRef.current ? lookOverrideRef.current.x : mouseRef.current.x;
      const targetGazeY = lookOverrideRef.current ? lookOverrideRef.current.y : mouseRef.current.y;
      const gazeLerp = 1 - Math.exp(-2.6 * dt);
      currentGaze.x += (targetGazeX - currentGaze.x) * gazeLerp;
      currentGaze.y += (targetGazeY - currentGaze.y) * gazeLerp;

      // Flinch squash & stretch physics on click/poke
      if (isHitRef.current && !wasHit) {
        flinchRemaining = 0.36;
      }
      wasHit = isHitRef.current;

      let squash = 1;
      if (flinchRemaining > 0) {
        flinchRemaining = Math.max(0, flinchRemaining - dt);
        const prog = flinchRemaining / 0.36;
        squash = 1 - 0.30 * Math.sin(prog * Math.PI) * Math.cos(prog * Math.PI * 2.2);
      } else if (mode === 'YAWNING' || expressionRef.current === 'YAWNING') {
        const yawnWave = Math.max(0, Math.sin(time * 2.1));
        squash = 1 + yawnWave * 0.22;
      }

      // Relief breath animation
      const isBreathing = Boolean(isBreathingReliefRef.current);
      if (isBreathing) {
        if (!wasBreathing) reliefElapsed = 0;
        reliefElapsed += dt;
      } else {
        reliefElapsed = 0;
      }
      wasBreathing = isBreathing;
      const breathProg = Math.min(1, reliefElapsed / 2.6);

      let breathExpansion = 0;
      if (isBreathing) {
        breathExpansion = breathProg < 0.38
          ? Math.sin((breathProg / 0.38) * (Math.PI / 2)) * 0.18
          : Math.cos(((breathProg - 0.38) / 0.62) * (Math.PI / 2)) * 0.18;
      }

      // Interpolate colors based on annoyance (progressively enraged blazing crimson)
      const annT = Math.min(1, currentAnnoyance);
      const curMid: [number, number, number] = [
        Math.round(baseMidRgb[0] + (angryMidRgb[0] - baseMidRgb[0]) * annT),
        Math.round(baseMidRgb[1] + (angryMidRgb[1] - baseMidRgb[1]) * annT),
        Math.round(baseMidRgb[2] + (angryMidRgb[2] - baseMidRgb[2]) * annT),
      ];
      const curGlow: [number, number, number] = [
        Math.round(baseGlowRgb[0] + (angryGlowRgb[0] - baseGlowRgb[0]) * annT),
        Math.round(baseGlowRgb[1] + (angryGlowRgb[1] - baseGlowRgb[1]) * annT),
        Math.round(baseGlowRgb[2] + (angryGlowRgb[2] - baseGlowRgb[2]) * annT),
      ];
      const curCore: [number, number, number] = [
        Math.round(baseCoreRgb[0] + (angryCoreRgb[0] - baseCoreRgb[0]) * annT),
        Math.round(baseCoreRgb[1] + (angryCoreRgb[1] - baseCoreRgb[1]) * annT),
        Math.round(baseCoreRgb[2] + (angryCoreRgb[2] - baseCoreRgb[2]) * annT),
      ];

      const primaryColor = `rgb(${curMid[0]}, ${curMid[1]}, ${curMid[2]})`;
      const secondaryColor = `rgb(${curGlow[0]}, ${curGlow[1]}, ${curGlow[2]})`;
      const coreColor = `rgb(${curCore[0]}, ${curCore[1]}, ${curCore[2]})`;

      ctx.clearRect(0, 0, width, height);

      const talkPulse =
        mode === 'TALKING'
          ? 1 + 0.16 * Math.abs(Math.sin(time * 4.5))
          : 1;

      // Subtle angry tremble when annoyance rises above 0.35
      const angerTrembleX = currentAnnoyance > 0.35 ? (currentAnnoyance - 0.35) * 2.4 * Math.sin(time * 36) * scale : 0;
      const angerTrembleY = currentAnnoyance > 0.35 ? (currentAnnoyance - 0.35) * 1.6 * Math.cos(time * 30) * scale : 0;

      // Vertical centering: keep body centered in canvas with head room for dancing flames
      const yOffset = height >= 52 ? 0.64 : 0.60;
      const bobY = Math.sin(time * 1.5) * 1.4 * Math.min(1.2, scale);
      const cx = width / 2 + currentGaze.x * 2.5 * scale + angerTrembleX;
      const cy = height * yOffset + bobY + angerTrembleY;
      const swayX = -currentGaze.x * 4.5 * scale;

      // Base radius calculation: calibrated for perfectly balanced character proportions
      const rawBaseR = Math.min(width, height) * 0.24 * scale;
      const baseR = rawBaseR * (1 + breathExpansion) * (mode === 'TALKING' ? 0.96 + 0.08 * talkPulse : 1);
      const flameH =
        baseR *
        (mode === 'TALKING' ? 1.85 * talkPulse : mode === 'MUTED' ? 1.35 : 1.62);
      const turb = mode === 'TALKING' ? 1.25 : mode === 'MUTED' ? 0.55 : 1.0;

      ctx.save();

      // Apply hit flinch squash
      if (squash !== 1) {
        ctx.translate(cx, cy);
        ctx.scale(1 / Math.sqrt(squash), squash);
        ctx.translate(-cx, -cy);
      }

      // 1. AMBIENT OUTER SPIRIT GLOW AURA (Comfortably bounded so edge clipping is impossible)
      const auraAlpha = 0.32 + annT * 0.16;
      const maxAuraR = Math.min(baseR * 2.2, Math.min(width, height) * 0.46);
      const auraGrad = ctx.createRadialGradient(
        cx,
        cy - baseR * 0.3,
        baseR * 0.1,
        cx,
        cy - baseR * 0.3,
        maxAuraR
      );
      auraGrad.addColorStop(0, `rgba(${curMid[0]}, ${curMid[1]}, ${curMid[2]}, ${auraAlpha})`);
      auraGrad.addColorStop(0.55, `rgba(${curGlow[0]}, ${curGlow[1]}, ${curGlow[2]}, 0.10)`);
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy - baseR * 0.3, maxAuraR, 0, Math.PI * 2);
      ctx.fill();

      // 2. RISING SPIRIT EMBER PARTICLES (Behind & around crown)
      ctx.globalCompositeOperation = 'screen';
      for (const p of embers) {
        if (p.alpha <= 0.02) {
          spawnEmber(p, cx, cy, baseR);
        }
        p.x += p.vx + Math.sin(time * 2.0 + p.phase) * 0.16;
        p.y += p.vy * speedMult;
        p.alpha -= p.decay;
        p.radius *= 0.99;

        if (p.alpha > 0.02) {
          ctx.fillStyle = primaryColor;
          ctx.globalAlpha = Math.max(0, p.alpha * 0.85);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.4, p.radius), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // 3. LAYER 1: OUTER ETHEREAL FLAME BODY (Secondary -> Primary Gradient)
      const outerGrad = ctx.createLinearGradient(cx, cy + baseR, cx, cy - flameH * 1.15);
      outerGrad.addColorStop(0, secondaryColor);
      outerGrad.addColorStop(0.55, primaryColor);
      outerGrad.addColorStop(1, `rgba(${curMid[0]}, ${curMid[1]}, ${curMid[2]}, 0.15)`);

      drawFlameLayer(cx, cy, baseR * 1.08, flameH * 1.12, time, turb * 1.05, 0, swayX);
      ctx.fillStyle = outerGrad;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 8 * scale;
      ctx.fill();

      // 4. LAYER 2: DANCING MID-FLAME TONGUES (Primary -> Core Gradient)
      const midGrad = ctx.createLinearGradient(cx, cy + baseR * 0.8, cx, cy - flameH * 0.92);
      midGrad.addColorStop(0, primaryColor);
      midGrad.addColorStop(0.65, coreColor);
      midGrad.addColorStop(1, `rgba(${curMid[0]}, ${curMid[1]}, ${curMid[2]}, 0)`);

      drawFlameLayer(
        cx,
        cy + 1 * scale,
        baseR * 0.84,
        flameH * 0.9,
        time * 1.08,
        turb * 1.15,
        2.1,
        swayX * 0.8
      );
      ctx.fillStyle = midGrad;
      ctx.shadowBlur = 4 * scale;
      ctx.fill();

      // 5. LAYER 3: INCANDESCENT WHITE-HOT INNER SPIRIT HEART
      const coreGrad = ctx.createRadialGradient(
        cx,
        cy + baseR * 0.1,
        baseR * 0.05,
        cx,
        cy - baseR * 0.1,
        baseR * 0.72
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.55, coreColor);
      coreGrad.addColorStop(1, 'transparent');

      drawFlameLayer(
        cx,
        cy + 2 * scale,
        baseR * 0.56,
        flameH * 0.55,
        time * 1.15,
        turb * 0.75,
        4.2,
        swayX * 0.4
      );
      ctx.fillStyle = coreGrad;
      ctx.shadowBlur = 0;
      ctx.fill();

      // 6. EXPRESSIVE HITODAMA EYES & EMOTIONS
      ctx.globalCompositeOperation = 'source-over';
      blinkTimer++;
      if (!isBlinking && blinkTimer > 180 && Math.random() < 0.025) {
        isBlinking = true;
        blinkTimer = 0;
      } else if (isBlinking && blinkTimer > 10) {
        isBlinking = false;
        blinkTimer = 0;
      }

      const flameSizeScale = baseR / 17.28;
      const eyeSpacing = baseR * 0.40;
      const lookX = currentGaze.x * 2.6 * flameSizeScale;
      const lookY =
        mode === 'THINKING'
          ? -2.2 * flameSizeScale
          : currentGaze.y * 1.8 * flameSizeScale;
      const eyeY = cy + baseR * 0.06 + lookY;
      const eyeLX = cx - eyeSpacing + lookX;
      const eyeRX = cx + eyeSpacing + lookX;
      const eyeColor = currentAnnoyance > 0.4 ? '#2B0B0E' : '#0B1120';

      const isWincing = flinchRemaining > 0 || isHitRef.current;

      if (isWincing) {
        // TACTILE POKED WINCE EYES (> <)
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = Math.max(0.8, 2.6 * flameSizeScale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Left eye: >
        ctx.beginPath();
        ctx.moveTo(eyeLX - 2.8 * flameSizeScale, eyeY - 2.5 * flameSizeScale);
        ctx.lineTo(eyeLX + 2.2 * flameSizeScale, eyeY);
        ctx.lineTo(eyeLX - 2.8 * flameSizeScale, eyeY + 2.5 * flameSizeScale);
        ctx.stroke();

        // Right eye: <
        ctx.beginPath();
        ctx.moveTo(eyeRX + 2.8 * flameSizeScale, eyeY - 2.5 * flameSizeScale);
        ctx.lineTo(eyeRX - 2.2 * flameSizeScale, eyeY);
        ctx.lineTo(eyeRX + 2.8 * flameSizeScale, eyeY + 2.5 * flameSizeScale);
        ctx.stroke();
      } else if (expressionRef.current === 'WINK') {
        // CUTE HITODAMA WINK: Left eye is an arched smiling wink, right eye is open with sparkle
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = Math.max(0.8, 2.4 * flameSizeScale);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(eyeLX, eyeY + 1.2 * flameSizeScale, 3.4 * flameSizeScale, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();

        ctx.save();
        ctx.translate(eyeRX, eyeY);
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.6 * flameSizeScale, 3.8 * flameSizeScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-0.6 * flameSizeScale, -1.0 * flameSizeScale, Math.max(0.2, 0.95 * flameSizeScale), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (mode === 'YAWNING' || expressionRef.current === 'YAWNING') {
        // Squeezed morning yawn eyes (> <)
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = Math.max(0.8, 2.4 * flameSizeScale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Left eye: >
        ctx.beginPath();
        ctx.moveTo(eyeLX - 2.5 * flameSizeScale, eyeY - 2.0 * flameSizeScale);
        ctx.lineTo(eyeLX + 1.8 * flameSizeScale, eyeY);
        ctx.lineTo(eyeLX - 2.5 * flameSizeScale, eyeY + 2.0 * flameSizeScale);
        ctx.stroke();

        // Right eye: <
        ctx.beginPath();
        ctx.moveTo(eyeRX + 2.5 * flameSizeScale, eyeY - 2.0 * flameSizeScale);
        ctx.lineTo(eyeRX - 1.8 * flameSizeScale, eyeY);
        ctx.lineTo(eyeRX + 2.5 * flameSizeScale, eyeY + 2.0 * flameSizeScale);
        ctx.stroke();

        // Wide yawning oval mouth
        const yawnCycle = Math.max(0, Math.sin(time * 2.1));
        const mouthW = (1.8 + yawnCycle * 2.0) * flameSizeScale;
        const mouthH = (2.2 + yawnCycle * 2.4) * flameSizeScale;
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(cx, eyeY + 6.0 * flameSizeScale, mouthW, mouthH, 0, 0, Math.PI * 2);
        ctx.fill();

        // Soft spirit breath puff
        const puffAlpha = yawnCycle * 0.45;
        if (puffAlpha > 0.05) {
          ctx.fillStyle = `rgba(224, 247, 255, ${puffAlpha})`;
          ctx.beginPath();
          ctx.arc(cx + 3.8 * flameSizeScale, eyeY - 3.5 * flameSizeScale, (2 + yawnCycle * 2.4) * flameSizeScale, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (isBreathing || expressionRef.current === 'HAPPY') {
        // CONTENTED SMILING EYES (^ ^) DURING RELIEF BREATH OR HAPPY EXPRESSION
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = Math.max(0.8, 2.2 * flameSizeScale);
        ctx.lineCap = 'round';
        [eyeLX, eyeRX].forEach((ex) => {
          ctx.beginPath();
          ctx.arc(ex, eyeY + 1.2 * flameSizeScale, 3.4 * flameSizeScale, Math.PI * 1.15, Math.PI * 1.85, false);
          ctx.stroke();
        });

        // Soft exhale relief breath vapor particle
        if (isBreathing) {
          const breathProg = Math.min(1, reliefElapsed / 2.6);
          if (breathProg > 0.12 && breathProg < 0.88) {
            const exhaleProg = (breathProg - 0.12) / 0.76;
            const puffAlpha = Math.sin(exhaleProg * Math.PI) * 0.45;
            ctx.fillStyle = `rgba(224, 247, 255, ${puffAlpha})`;
            ctx.beginPath();
            ctx.arc(
              cx + Math.sin(exhaleProg * 3) * 2 * flameSizeScale,
              eyeY + 5 * flameSizeScale - exhaleProg * 15 * flameSizeScale,
              (2.2 + exhaleProg * 3.8) * flameSizeScale,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      } else {
        // ANGRY, CALM, PEEKING, EXCITED, OR POINTING EYES
        const expr = expressionRef.current;
        const isAnnoyed = currentAnnoyance > 0.25;
        let narrowness = isAnnoyed ? Math.max(0.42, 1.25 - currentAnnoyance * 0.8) : 1.0;
        if (expr === 'PEEKING') narrowness = 0.58;

        let eyeW = Math.max(0.5, 2.3 * flameSizeScale);
        let eyeH =
          isBlinking || mode === 'MUTED'
            ? 0.6 * flameSizeScale
            : mode === 'TALKING'
            ? (2.8 + Math.sin(time * 6) * 0.5) * flameSizeScale
            : 3.4 * flameSizeScale * narrowness;

        if (expr === 'EXCITED') {
          eyeW = 2.9 * flameSizeScale;
          eyeH = 4.4 * flameSizeScale;
        } else if (expr === 'POINTING') {
          eyeW = 2.4 * flameSizeScale;
          eyeH = 3.6 * flameSizeScale;
        }

        // Left eye
        ctx.save();
        ctx.translate(eyeLX, eyeY);
        if (isAnnoyed) ctx.rotate(-0.22 * annT);
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        if (!isBlinking && mode !== 'MUTED') {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-0.5 * flameSizeScale, -0.9 * flameSizeScale, Math.max(0.2, 0.85 * flameSizeScale), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Right eye
        ctx.save();
        ctx.translate(eyeRX, eyeY);
        if (isAnnoyed) ctx.rotate(0.22 * annT);
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        if (!isBlinking && mode !== 'MUTED') {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(0.5 * flameSizeScale, -0.9 * flameSizeScale, Math.max(0.2, 0.85 * flameSizeScale), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // SHARP FURROWED EYEBROWS (\ /) WHEN ANNOYED OR ANGRY
        if (isAnnoyed) {
          const browDrop = (currentAnnoyance - 0.2) * 2.8 * flameSizeScale;
          ctx.strokeStyle = eyeColor;
          ctx.lineWidth = Math.max(0.8, 2.2 * flameSizeScale);
          ctx.lineCap = 'round';

          // Left eyebrow (\) slants down sharply toward center
          ctx.beginPath();
          ctx.moveTo(eyeLX - 3.6 * flameSizeScale, eyeY - 4.2 * flameSizeScale);
          ctx.lineTo(eyeLX + 2.8 * flameSizeScale, eyeY - 2.2 * flameSizeScale + browDrop);
          ctx.stroke();

          // Right eyebrow (/) slants down sharply toward center
          ctx.beginPath();
          ctx.moveTo(eyeRX + 3.6 * flameSizeScale, eyeY - 4.2 * flameSizeScale);
          ctx.lineTo(eyeRX - 2.8 * flameSizeScale, eyeY - 2.2 * flameSizeScale + browDrop);
          ctx.stroke();

          // IRRITATED FROWN / POUT WHEN ANGRY
          if (currentAnnoyance > 0.45 && mode !== 'TALKING') {
            ctx.strokeStyle = eyeColor;
            ctx.lineWidth = Math.max(0.6, 1.8 * flameSizeScale);
            ctx.beginPath();
            ctx.arc(cx + lookX * 0.3, eyeY + 4.2 * flameSizeScale, 3.2 * flameSizeScale, 1.25 * Math.PI, 1.75 * Math.PI);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [soul, width, height, scale, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onClick={onClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
        pointerEvents: interactive ? 'auto' : 'none',
        cursor: interactive ? 'pointer' : 'default',
        // Feather outer boundaries smoothly so no hard rectangle clipping can occur
        WebkitMaskImage: 'radial-gradient(ellipse 95% 92% at 50% 58%, #000000 80%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 95% 92% at 50% 58%, #000000 80%, transparent 100%)',
        ...style,
      }}
    />
  );
};
