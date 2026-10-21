// src/lib/soundFX.ts

class HitodamaSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastHoverTime: number = 0;
  private lastSliderTickValue: number = -1;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hitodama_sfx_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
    }
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hitodama_sfx_enabled', String(val));
    }
    if (val) this.playToggle(true);
  }

  // Helper: Short filtered noise burst for physical "glass tap" texture
  private playTransientClick(freq = 2400, gainAmount = 0.04, duration = 0.008) {
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, ctx.currentTime);
    filter.Q.setValueAtTime(3.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainAmount, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  // 1. Island Expand (Liquid upward swell + airy shimmer)
  public playExpand() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    this.playTransientClick(1800, 0.035, 0.01);

    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);

    sub.type = 'triangle';
    sub.frequency.setValueAtTime(95, now);
    sub.frequency.exponentialRampToValueAtTime(260, now + 0.16);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.065, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.2);
    sub.stop(now + 0.2);
  }

  // 2. Island Collapse (Soft downward vacuum tuck)
  public playCollapse() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    this.playTransientClick(1400, 0.025, 0.007);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // 3. Navigation Tab Switch (Crisp Dynamic Island glass detent)
  public playTabSwitch() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    this.playTransientClick(3200, 0.04, 0.005);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(1120, now + 0.028);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  // 4. Control Tile Toggle (Ascending harmonic for ON, muted drop for OFF)
  public playToggle(isOn: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    this.playTransientClick(isOn ? 2800 : 1900, 0.04, 0.006);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (isOn) {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(783.99, now + 0.045); // G5
    } else {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(392.0, now + 0.045); // G4
    }

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 5. Subtle Micro-Hover Tick (Throttled so it never spams)
  public playHover() {
    const nowMs = performance.now();
    if (nowMs - this.lastHoverTime < 55) return;
    this.lastHoverTime = nowMs;

    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1650, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.012);

    gain.gain.setValueAtTime(0.014, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  }

  // 6. Volume / Media Scrubber Detent Tick (Fires every 4% change)
  public playSliderTick(pctValue: number) {
    if (Math.abs(pctValue - this.lastSliderTickValue) < 4) return;
    this.lastSliderTickValue = pctValue;

    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch scales subtly with volume percentage (400Hz -> 900Hz)
    const pitch = 400 + (pctValue / 100) * 500;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(0.022, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.014);
  }

  // 7. To-Do Checked / Clipboard Copied Chime (Ethereal pentatonic bell)
  public playSuccessChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  // 8. Soul Loadout / Skin Morph (Mystical harmonic chord)
  public playSoulPulse() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [293.66, 440.0, 554.37, 659.25]; // D Major 7th
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f * 0.98, now);
      osc.frequency.exponentialRampToValueAtTime(f, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.028, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  // 9. Voice Listening / Lasso Wake Chime
  public playWakeListening() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [440, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  // 10. Relief Breath / Sigh (Soft relaxing exhale after cooling down from anger)
  public playReliefBreath() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 1.4);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 1.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 1.1);

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(0.018, now + 0.3);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 1.4);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  // 14. Yawn Wake Stretch (Rising soulful pitch arc with breath sigh and wake chimes)
  public playYawnWake() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Wake yawn rising tone
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.6);
    osc.frequency.exponentialRampToValueAtTime(210, now + 1.4);

    sub.type = 'triangle';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(270, now + 0.6);
    sub.frequency.exponentialRampToValueAtTime(105, now + 1.4);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 1.5);
    sub.stop(now + 1.5);

    // Light awake blink chimes at end of yawn
    setTimeout(() => {
      if (!this.enabled) return;
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;
      [880, 1174.66].forEach((freq, idx) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + idx * 0.12);
        g.gain.setValueAtTime(0.028, t + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.12 + 0.28);
        o.connect(g);
        g.connect(c.destination);
        o.start(t + idx * 0.12);
        o.stop(t + idx * 0.12 + 0.3);
      });
    }, 900);
  }

  // 15. Quest Complete / Ember Reward Fanfare (Crisp 4-tone ascending arpeggio)
  public playQuestComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const shimmer = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = now + idx * 0.08;
      const dur = idx === notes.length - 1 ? 0.45 : 0.24;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(freq * 2, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.045, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gain);
      shimmer.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      shimmer.start(startTime);
      osc.stop(startTime + dur + 0.02);
      shimmer.stop(startTime + dur + 0.02);
    });
  }

  // 11. Spirit Swoop / Wisp flight SFX
  public playWisp() {
    this.playExpand();
  }

  // 12. Task Success / Target Lock Chime
  public playTaskSuccess() {
    this.playSuccessChime();
  }

  // 13. Crisp glass click
  public playClick() {
    this.playTabSwitch();
  }
}

export const soundFX = new HitodamaSoundEngine();
