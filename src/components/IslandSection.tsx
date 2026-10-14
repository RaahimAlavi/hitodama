import React from 'react';
import { SoulCanvas } from './SoulCanvas';

export const IslandSection: React.FC = () => {
  return (
    <section className="section IslandSection_section__2Zx_o" id="island" style={{ padding: '100px 20px', maxWidth: '1140px', margin: '0 auto', textAlign: 'center' }}>
      <div className="IslandSection_copy__y1l_g" style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: 'clamp(2.5rem, 4.5vw, 4.2rem)', fontFamily: 'var(--font-display)', margin: '0 0 16px 0', lineHeight: 1.1 }}>
          A more beautiful Windows. <br />
          <em style={{ fontStyle: 'italic', color: '#5CB8FF' }}>A more productive you.</em>
        </h2>
        <p style={{ fontSize: '18px', color: '#5e5a4c', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
          Scroll down on the island and your music, settings, plans, clipboard, apps, and wallpapers are right there. Your desktop looks better, and everything you reach for is one flick away.
        </p>
      </div>

      {/* Floating Island Showcase Card */}
      <div
        style={{
          background: 'linear-gradient(180deg, #18191e 0%, #0d0e12 100%)',
          borderRadius: '24px',
          padding: '60px 40px',
          boxShadow: '0 32px 90px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Glow backdrop */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(92, 184, 255, 0.25) 0%, rgba(92, 184, 255, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Central Dynamic Island with Living Soul */}
        <div
          style={{
            background: 'linear-gradient(180deg, #191a20, #0a0b0e)',
            borderRadius: '40px',
            padding: '12px 28px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '24px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.12)',
            zIndex: 2,
          }}
        >
          <div style={{ width: '80px', height: '60px' }}>
            <SoulCanvas width={80} height={60} scale={1.1} mode="LISTENING" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#fff' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Hitodama Island</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#8ED92F' }}>Ready for commands</p>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#aaa' }}>
              <span>🎙 Active</span>
              <span>·</span>
              <span>5 Apps</span>
              <span>·</span>
              <span>Spotify ⏸</span>
            </div>
          </div>
        </div>

        {/* Grid of features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%', marginTop: '50px', zIndex: 2 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '16px' }}>Dynamic Island on PC</h4>
            <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
              A permanent, non-intrusive HUD at the top of your screen that expands when needed and tucks away cleanly.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '16px' }}>Instant Media Controls</h4>
            <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
              Spotify, YouTube, and system audio scrubbers live right in the island drawer without switching windows.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '16px' }}>Universal Clipboard</h4>
            <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
              Access recent snippets, copied links, and screenshots in one swipe or by asking Hitodama to paste.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
