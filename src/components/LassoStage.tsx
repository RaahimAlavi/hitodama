import React, { useState, useEffect, useRef } from 'react';
import { SoulCanvas } from './SoulCanvas';

export const LassoStage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'store'>('list');
  const [isLassoing, setIsLassoing] = useState(false);
  const wakeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto trigger lasso animation cycle
  useEffect(() => {
    const cycle = setInterval(() => {
      setIsLassoing(true);
      setTimeout(() => {
        setActiveTab('store');
        setIsLassoing(false);
        setTimeout(() => {
          setActiveTab('list');
        }, 5000);
      }, 2800);
    }, 9500);

    return () => clearInterval(cycle);
  }, []);

  // Draw animated glowing lasso wake matching Screenshot 5
  useEffect(() => {
    const canvas = wakeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let progress = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!isLassoing) {
        progress = 0;
        return;
      }

      progress = Math.min(1, progress + 0.018);

      // Center around Ashfall row (left ~ 110px, top ~ 140px, rx ~ 160px, ry ~ 70px)
      const cx = 240;
      const cy = 200;
      const rx = 190;
      const ry = 75;

      ctx.save();
      ctx.strokeStyle = '#5CB8FF';
      ctx.lineWidth = 2.8;
      ctx.shadowColor = '#5CB8FF';
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';

      ctx.beginPath();
      const maxAngle = progress * Math.PI * 2.15;
      for (let a = 0; a <= maxAngle; a += 0.05) {
        const wobble = Math.sin(a * 4) * 2;
        const x = cx + Math.cos(a) * (rx + wobble);
        const y = cy + Math.sin(a) * (ry + wobble);
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw cursor arrow pointer
      const tipX = cx + Math.cos(maxAngle) * rx;
      const tipY = cy + Math.sin(maxAngle) * ry;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + 10, tipY + 12);
      ctx.lineTo(tipX + 4, tipY + 11);
      ctx.lineTo(tipX + 1, tipY + 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isLassoing]);

  return (
    <section className="section Lasso_section__TM3g_" id="lasso" style={{ padding: '80px 20px', maxWidth: '1140px', margin: '0 auto' }}>
      {/* Top Header & Keycaps (Matches Screenshot 5) */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{ fontSize: '18px', color: '#1c1b17', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Hold{' '}
          <kbd style={{ background: '#1c1b17', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '13px', boxShadow: '0 2px 0 #000' }}>
            Ctrl
          </kbd>
          <span>+</span>
          <kbd style={{ background: '#1c1b17', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '13px', boxShadow: '0 2px 0 #000' }}>
            Shift
          </kbd>
          , circle anything on screen, and ask about it out loud.
        </p>
      </div>

      {/* Monitor Mockup with Top Dynamic Island (Matches Screenshot 5) */}
      <div
        style={{
          background: '#0c0d10',
          borderRadius: '24px',
          padding: '16px 16px 20px 16px',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.35)',
          position: 'relative',
        }}
      >
        {/* Dynamic Island Resting in Monitor Bezel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '180px',
            height: '28px',
            background: '#000000',
            borderRadius: '0 0 16px 16px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5CB8FF', boxShadow: '0 0 6px #5CB8FF' }} />
        </div>

        {/* Browser Window inside Monitor */}
        <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          {/* Tabstrip */}
          <div style={{ background: '#e8eaed', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #dadce0' }}>
            <div style={{ display: 'flex', gap: '6px', marginRight: '12px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff5f56' }} />
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#27c93f' }} />
            </div>

            <div style={{ background: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#333' }}>
              Top 20 Adventure Games
            </div>
            <span style={{ color: '#888', fontSize: '14px' }}>+</span>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', fontSize: '12px', color: '#888' }}>
              <span>─</span>
              <span>□</span>
              <span>✕</span>
            </div>
          </div>

          {/* Omnibox */}
          <div style={{ background: '#f1f3f4', padding: '6px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ background: '#fff', padding: '4px 14px', borderRadius: '14px', fontSize: '12px', color: '#666', flex: 1, maxWidth: '400px' }}>
              gamelists.example/top-20-adventure
            </div>
          </div>

          {/* Page Content: Top 20 Adventure Games list + Right Skeletons */}
          <div style={{ padding: '36px 40px', minHeight: '480px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '40px', position: 'relative' }}>
            {/* Games Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '28px' }}>
                <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', margin: 0, fontWeight: 700 }}>
                  Top 20 Adventure Games
                </h1>
                <span style={{ color: '#888', fontSize: '13px' }}>20 items</span>
              </div>

              {/* Game 1: Ashfall (Target) */}
              <div style={{ display: 'flex', gap: '18px', marginBottom: '24px', alignItems: 'flex-start' }}>
                <img src="/images/lasso/ashfall-poster.jpg" alt="Ashfall" width="76" height="110" style={{ borderRadius: '6px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 700 }}>1. Ashfall</h3>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#888' }}>2018 · 16+ · Video Game</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555', fontWeight: 600 }}>★ 9.8 <span style={{ color: '#888', fontWeight: 400 }}>(84K)</span></p>
                  <div style={{ height: '6px', background: '#e9ecef', borderRadius: '3px', width: '85%', marginBottom: '4px' }} />
                  <div style={{ height: '6px', background: '#e9ecef', borderRadius: '3px', width: '60%' }} />
                </div>
              </div>

              {/* Game 2: Neon Tide */}
              <div style={{ display: 'flex', gap: '18px', marginBottom: '24px', alignItems: 'flex-start' }}>
                <img src="/images/lasso/neon-tide-poster.jpg" alt="Neon Tide" width="76" height="110" style={{ borderRadius: '6px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 700 }}>2. Neon Tide</h3>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#888' }}>2013 · 16+ · Video Game</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555', fontWeight: 600 }}>★ 9.1 <span style={{ color: '#888', fontWeight: 400 }}>(24K)</span></p>
                  <div style={{ height: '6px', background: '#e9ecef', borderRadius: '3px', width: '75%', marginBottom: '4px' }} />
                  <div style={{ height: '6px', background: '#e9ecef', borderRadius: '3px', width: '45%' }} />
                </div>
              </div>

              {/* Game 3: The Long Hollow */}
              <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                <img src="/images/lasso/long-hollow-poster.jpg" alt="The Long Hollow" width="76" height="110" style={{ borderRadius: '6px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 700 }}>3. The Long Hollow</h3>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#888' }}>2013 · 16+ · Video Game</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555', fontWeight: 600 }}>★ 9.7 <span style={{ color: '#888', fontWeight: 400 }}>(92K)</span></p>
                  <div style={{ height: '6px', background: '#e9ecef', borderRadius: '3px', width: '80%' }} />
                </div>
              </div>
            </div>

            {/* Right Column (Placeholder skeleton cards matching Screenshot 5) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '48px' }}>
              <div style={{ height: '64px', background: '#f4f5f7', borderRadius: '10px' }} />
              <div style={{ height: '80px', background: '#f4f5f7', borderRadius: '10px' }} />
              <div style={{ height: '80px', background: '#f4f5f7', borderRadius: '10px' }} />
            </div>

            {/* Canvas Wake Animation */}
            <canvas
              ref={wakeCanvasRef}
              width={900}
              height={480}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />

            {/* Bottom Right Floating Voice Pill (Matches Screenshot 5) */}
            <div
              style={{
                position: 'absolute',
                right: '40px',
                bottom: '30px',
                background: '#ffffff',
                color: '#1c1b17',
                padding: '12px 24px',
                borderRadius: '24px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                fontSize: '15px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 6,
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontSize: '11px', color: '#888', fontWeight: 700 }}>YOU</span>
              <span>Can you please open the store page of this game?</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
