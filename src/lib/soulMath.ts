// Mathematical model and particle systems for the Hitodama Soul

export interface SoulConfig {
  key: string;
  name: string;
  core: string;
  mid: string;
  glow: string;
  aura: 'none' | 'ember' | 'wisp' | 'shard' | 'glint' | 'void';
  blurb?: string;
  price?: number;
  free?: boolean;
}

export const SOUL_SKINS: SoulConfig[] = [
  {
    key: "flame_hitodama",
    name: "Hitodama",
    core: "#FFFFFF",
    mid: "#BFE9FF",
    glow: "#5CB8FF",
    aura: "none",
    blurb: "The soul as it woke: white-hot core, cold blue halo.",
    free: true,
    price: 0
  },
  {
    key: "flame_ember",
    name: "Ember",
    core: "#FFFFFF",
    mid: "#FFA070",
    glow: "#FF4530",
    aura: "ember",
    blurb: "What it looks like the moment it wakes up angry.",
    free: false,
    price: 160
  },
  {
    key: "flame_wisp",
    name: "Wisp",
    core: "#FFFFFF",
    mid: "#C9F5D8",
    glow: "#6FD79A",
    aura: "wisp",
    blurb: "Marsh-light green, the colour of something leading you off the path.",
    free: false,
    price: 160
  },
  {
    key: "flame_amethyst",
    name: "Amethyst",
    core: "#FFFFFF",
    mid: "#E2CCFF",
    glow: "#A97BFF",
    aura: "shard",
    blurb: "Quieter than it looks. Burns slow and deep.",
    free: false,
    price: 400
  },
  {
    key: "flame_gilded",
    name: "Gilded",
    core: "#FFFFFF",
    mid: "#FFEEB8",
    glow: "#FFC24A",
    aura: "glint",
    blurb: "Old temple gold, the kind left burning for someone who never came back.",
    free: false,
    price: 400
  },
  {
    key: "flame_void",
    name: "Void",
    core: "#F2E9FF",
    mid: "#8A6FC7",
    glow: "#2B1E52",
    aura: "void",
    blurb: "The dark it drifted through, carried on purpose this time. Includes the Collapse ability, free.",
    free: false,
    price: 1000
  }
];

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

export function rgba(rgb: [number, number, number], alpha = 1): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const l = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * l),
    Math.round(a[1] + (b[1] - a[1]) * l),
    Math.round(a[2] + (b[2] - a[2]) * l),
  ];
}

// Lamé Superellipse calculation
export function superellipsePoint(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  theta: number
): [number, number] {
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const x = cx + rx * Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n);
  const y = cy + ry * Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n);
  return [x, y];
}

// Particle System
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  spin: number;
  seed: number;
  lift: number;
}

export class ParticleSystem {
  style: string;
  mid: [number, number, number];
  glow: [number, number, number];
  particles: Particle[] = [];
  infalling: Particle[] = [];
  pending = 0;
  infallPending = 0;

  constructor(style: string, midHex: string, glowHex: string) {
    this.style = style;
    this.mid = hexToRgb(midHex);
    this.glow = hexToRgb(glowHex);
  }

  update(dt: number, intensity: number, bounds: { x: number; y: number; w: number; h: number }, scale = 1) {
    if (this.style === "none") {
      this.particles = [];
      return;
    }

    const clampedDt = Math.max(0, Math.min(0.1, dt));
    const clampedInt = Math.max(0, Math.min(1, intensity));

    // Update existing particles
    for (const p of this.particles) {
      p.age += clampedDt;
      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
      p.vx -= 1.6 * p.vx * clampedDt;
      p.vy -= p.lift * clampedDt;
    }
    this.particles = this.particles.filter(p => p.age < p.life);

    // Spawn new particles
    if (clampedInt > 0.001 && bounds.h > 1) {
      const rate = this.style === "void" ? 4 : 8;
      this.pending += rate * clampedInt * clampedDt;
      while (this.pending >= 1 && this.particles.length < 30) {
        this.pending -= 1;
        this.particles.push(this.spawn(bounds, clampedInt));
      }
      this.pending = Math.min(this.pending, 4);

      if (this.style === "void") {
        this.updateInfall(clampedDt, clampedInt, bounds);
      }
    }
  }

  updateInfall(dt: number, intensity: number, bounds: { x: number; y: number; w: number; h: number }) {
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const r = 0.5 * Math.max(bounds.w, bounds.h);
    if (r <= 1) return;

    for (const p of this.infalling) {
      p.age += dt;
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      const force = 5.5 * r * Math.pow(r / Math.max(dist, 0.6 * r), 2);
      p.vx += (dx / dist) * force * dt;
      p.vy += (dy / dist) * force * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (dist <= 0.34 * r) {
        p.age = p.life;
      }
    }
    this.infalling = this.infalling.filter(p => p.age < p.life);

    this.infallPending += 3.4 * intensity * dt;
    while (this.infallPending >= 1 && this.infalling.length < 10) {
      this.infallPending -= 1;
      const angle = Math.random() * Math.PI * 2;
      const dist = r * (1.6 + Math.random());
      const speed = (Math.random() > 0.5 ? -1 : 1) * 0.55 * r;
      this.infalling.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist * 0.75,
        vx: -Math.sin(angle) * speed,
        vy: Math.cos(angle) * speed * 0.75,
        age: 0,
        life: 2.2 + Math.random() * 1.2,
        size: Math.max(1, r * (0.055 + Math.random() * 0.045)),
        spin: 0,
        seed: Math.random() * 10,
        lift: 0,
      });
    }
    this.infallPending = Math.min(this.infallPending, 2);
  }

  spawn(bounds: { x: number; y: number; w: number; h: number }, intensity: number): Particle {
    const angle = Math.random() * Math.PI * 2;
    const distFactor = Math.pow(0.45 + Math.random() * 0.55, 0.6);
    const x = bounds.x + bounds.w / 2 + Math.cos(angle) * bounds.w * 0.5 * distFactor;
    const y = bounds.y + bounds.h / 2 + Math.sin(angle) * bounds.h * 0.5 * distFactor;
    const life = 0.9 + Math.random() * 0.8;
    const lift = 1.9 * bounds.h;
    const targetH = bounds.h * (0.45 + Math.random() * 0.5) * (0.7 + 0.5 * intensity);
    let vy = -targetH / life;

    return {
      x,
      y,
      vx: Math.cos(angle) * bounds.w * 0.375,
      vy,
      age: 0,
      life,
      size: Math.max(1, bounds.w * (0.035 + Math.random() * 0.05)),
      spin: (Math.random() - 0.5) * 6,
      seed: Math.random() * 10,
      lift,
    };
  }

  paint(ctx: CanvasRenderingContext2D, phase: number) {
    if (this.style === "none") return;

    if (this.style === "void" && this.infalling.length) {
      for (const p of this.infalling) {
        const progress = p.age / p.life;
        const alpha = progress < 0.2 ? progress / 0.2 : 1;
        ctx.fillStyle = rgba(this.mid, Math.min(1, (0.35 + 0.6 * progress) * alpha));
        const s = p.size * (0.6 + 0.6 * progress);
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const p of this.particles) {
      const progress = p.age / p.life;
      const alpha = Math.sin(progress * Math.PI);
      if (alpha <= 0.02) continue;

      ctx.save();
      switch (this.style) {
        case "ember": {
          const s = p.size * (0.75 + 0.25 * Math.sin(9 * progress + p.seed));
          ctx.fillStyle = rgba(this.glow, 0.75 * alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = rgba(this.mid, 0.55 * alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.45 * s, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "wisp": {
          ctx.fillStyle = rgba(this.glow, 0.5 * alpha);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, 1.8 * p.size, 0.7 * p.size, phase + p.seed, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "shard": {
          ctx.fillStyle = rgba(this.mid, 0.7 * alpha);
          const angle = p.seed + progress * p.spin;
          const r = 1.3 * p.size;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = angle + (i * Math.PI) / 2;
            const dist = r * (i % 2 === 0 ? 1.5 : 0.55);
            const px = p.x + Math.cos(a) * dist;
            const py = p.y + Math.sin(a) * dist;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "glint": {
          const twinkle = Math.max(0, Math.sin(6 * progress + 4 * p.seed));
          ctx.fillStyle = rgba(this.mid, 0.9 * alpha * twinkle);
          const r = p.size * (1.4 + 1.6 * twinkle);
          const n = 0.26 * p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - r);
          ctx.lineTo(p.x + n, p.y);
          ctx.lineTo(p.x, p.y + r);
          ctx.lineTo(p.x - n, p.y);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "void": {
          ctx.fillStyle = rgba(this.mid, 0.8 * alpha);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, 2.1 * p.size, 0.8 * p.size, phase + p.seed, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
      ctx.restore();
    }
  }
}

// Main Soul Renderer Function
export function drawSoul(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  config: {
    core: string;
    mid: string;
    glow: string;
    time: number;
    mode?: 'LISTENING' | 'THINKING' | 'TALKING' | 'YAWNING' | 'MUTED';
    gaze?: { x: number; y: number };
    talkingEnergy?: number;
    squash?: number;
    tilt?: number;
  }
) {
  const { core, mid, glow, time, mode = 'LISTENING', gaze = { x: 0, y: 0 } } = config;
  const coreRgb = hexToRgb(core);
  const midRgb = hexToRgb(mid);
  const glowRgb = hexToRgb(glow);

  const cx = center.x;
  const cy = center.y;
  const r = radius;

  ctx.save();

  // Mode params
  const isTalking = mode === 'TALKING';
  const isThinking = mode === 'THINKING';
  const isSleeping = mode === 'MUTED' || mode === 'YAWNING';

  const talkingPulse = isTalking ? 0.08 * Math.sin(time * 14) : 0;
  const idleFloat = 0.04 * Math.sin(time * 2.2);
  const curR = r * (1 + idleFloat + talkingPulse);

  // 1. Ambient Outer Halo
  const haloGrad = ctx.createRadialGradient(cx, cy, curR * 0.3, cx, cy, curR * 2.2);
  haloGrad.addColorStop(0, rgba(glowRgb, 0.35));
  haloGrad.addColorStop(0.5, rgba(glowRgb, 0.12));
  haloGrad.addColorStop(1, rgba(glowRgb, 0));
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, curR * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Flame Spine and Teardrop Body using Superellipse
  const spineWave = 0.12 * curR * Math.sin(time * 3.4);
  const apexY = cy - curR * 1.35;
  const baseY = cy + curR * 0.95;

  ctx.beginPath();
  // Draw top teardrop curve
  ctx.moveTo(cx + spineWave, apexY);
  ctx.bezierCurveTo(
    cx + curR * 1.15,
    cy - curR * 0.4,
    cx + curR * 1.05,
    baseY,
    cx,
    baseY
  );
  ctx.bezierCurveTo(
    cx - curR * 1.05,
    baseY,
    cx - curR * 1.15,
    cy - curR * 0.4,
    cx + spineWave,
    apexY
  );
  ctx.closePath();

  // 3. 3-stop Body Gradient
  const bodyGrad = ctx.createRadialGradient(
    cx - curR * 0.25,
    cy - curR * 0.35,
    curR * 0.1,
    cx,
    cy,
    curR * 1.4
  );
  bodyGrad.addColorStop(0, rgba(coreRgb, 0.98));
  bodyGrad.addColorStop(0.35, rgba(midRgb, 0.92));
  bodyGrad.addColorStop(0.75, rgba(glowRgb, 0.85));
  bodyGrad.addColorStop(1, rgba(glowRgb, 0.4));
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 4. Floating Hands (Left and Right)
  const handR = curR * 0.22;
  const handOffsetL = 0.05 * Math.sin(time * 2.5);
  const handOffsetR = 0.05 * Math.sin(time * 2.5 + Math.PI);

  const handLX = cx - curR * 1.18;
  const handLY = cy + curR * 0.35 + handOffsetL * curR;
  const handRX = cx + curR * 1.18;
  const handRY = cy + curR * 0.35 + handOffsetR * curR;

  // Left Hand
  const handGradL = ctx.createRadialGradient(handLX - handR * 0.2, handLY - handR * 0.2, 0, handLX, handLY, handR);
  handGradL.addColorStop(0, rgba(coreRgb, 0.9));
  handGradL.addColorStop(0.5, rgba(midRgb, 0.85));
  handGradL.addColorStop(1, rgba(glowRgb, 0.3));
  ctx.fillStyle = handGradL;
  ctx.beginPath();
  ctx.arc(handLX, handLY, handR, 0, Math.PI * 2);
  ctx.fill();

  // Right Hand
  const handGradR = ctx.createRadialGradient(handRX - handR * 0.2, handRY - handR * 0.2, 0, handRX, handRY, handR);
  handGradR.addColorStop(0, rgba(coreRgb, 0.9));
  handGradR.addColorStop(0.5, rgba(midRgb, 0.85));
  handGradR.addColorStop(1, rgba(glowRgb, 0.3));
  ctx.fillStyle = handGradR;
  ctx.beginPath();
  ctx.arc(handRX, handRY, handR, 0, Math.PI * 2);
  ctx.fill();

  // 5. Face / Eyes
  const eyeR = Math.max(2, curR * 0.095);
  const eyeSpacing = curR * 0.42;
  const gazeX = gaze.x * curR * 0.15;
  const gazeY = (isThinking ? -0.2 : gaze.y * 0.15) * curR;

  const eyeY = cy - curR * 0.05 + gazeY;
  const eyeLX = cx - eyeSpacing / 2 + gazeX;
  const eyeRX = cx + eyeSpacing / 2 + gazeX;

  // Eye color (dark soulful ink)
  ctx.fillStyle = "#14182A";

  if (isSleeping) {
    // Sleeping slits / curved closed eyes
    ctx.lineWidth = Math.max(1.5, curR * 0.04);
    ctx.strokeStyle = "#14182A";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(eyeLX, eyeY, eyeR * 1.1, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(eyeRX, eyeY, eyeR * 1.1, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Floating Z letters
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const zProgress = ((time * 0.4 + i / 3) % 1 + 1) % 1;
      const zX = cx + curR * 0.7 + Math.sin(zProgress * 4 + i) * curR * 0.2;
      const zY = cy - curR * 0.5 - zProgress * curR * 1.2;
      const zAlpha = Math.sin(zProgress * Math.PI);
      const zSize = Math.max(8, Math.round(curR * (0.2 + 0.15 * zProgress)));

      ctx.fillStyle = rgba([20, 24, 42], zAlpha * 0.7);
      ctx.font = `bold ${zSize}px Rubik, system-ui, sans-serif`;
      ctx.fillText("Z", zX, zY);
    }
    ctx.restore();
  } else {
    // Open eyes with blink interval
    const blinkCycle = time % 4.5;
    const isBlinking = blinkCycle < 0.15;

    if (isBlinking) {
      ctx.lineWidth = Math.max(1.5, curR * 0.04);
      ctx.strokeStyle = "#14182A";
      ctx.beginPath();
      ctx.moveTo(eyeLX - eyeR, eyeY);
      ctx.lineTo(eyeLX + eyeR, eyeY);
      ctx.moveTo(eyeRX - eyeR, eyeY);
      ctx.lineTo(eyeRX + eyeR, eyeY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(eyeLX, eyeY, eyeR * 0.85, eyeR * 1.35, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(eyeRX, eyeY, eyeR * 0.85, eyeR * 1.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Catchlights (tiny reflection sparkles)
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(eyeLX - eyeR * 0.25, eyeY - eyeR * 0.35, eyeR * 0.28, eyeR * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eyeRX - eyeR * 0.25, eyeY - eyeR * 0.35, eyeR * 0.28, eyeR * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Mouth / Talking Animation
  if (isTalking) {
    const mouthW = curR * 0.2;
    const mouthH = curR * (0.08 + 0.1 * Math.abs(Math.sin(time * 12)));
    const mouthY = cy + curR * 0.22;

    ctx.fillStyle = "#14182A";
    ctx.beginPath();
    ctx.ellipse(cx + gazeX * 0.5, mouthY, mouthW / 2, mouthH, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
