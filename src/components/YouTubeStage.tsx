import React, { useState, useEffect } from 'react';
import { SoulCanvas } from './SoulCanvas';

export const YouTubeStage: React.FC = () => {
  const [stage, setStage] = useState<'search' | 'playing'>('search');

  // Auto-advance through the stages with loop
  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => (prev === 'search' ? 'playing' : 'search'));
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="section YouTube_section"
      id="youtube-automation"
      style={{
        padding: '90px 20px',
        maxWidth: '1160px',
        margin: '0 auto',
      }}
    >
      {/* Top Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <p
          style={{
            fontSize: '18px',
            color: '#1a1814',
            margin: 0,
            fontFamily: 'var(--font-body)',
          }}
        >
          Tell your computer what to search, and Hito takes care of the clicks.
        </p>
      </div>

      {/* Monitor Display Frame */}
      <div
        style={{
          background: '#0d0d0f',
          borderRadius: '26px',
          padding: '12px',
          boxShadow: '0 32px 90px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.1)',
          border: '1px solid #232328',
          position: 'relative',
        }}
      >
        {/* Hardware Notch at Top Center of Monitor */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '38px',
            background: '#050507',
            borderRadius: '0 0 20px 20px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ width: '40px', height: '28px' }}>
            <SoulCanvas width={40} height={28} scale={0.6} mode="LISTENING" />
          </div>
        </div>

        {/* Floating Tooltip Card Hanging Directly Below the Notch (Screenshots 4 & 5) */}
        <div
          style={{
            position: 'absolute',
            top: '46px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#111215',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '10px 16px',
            zIndex: 12,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '240px',
            transition: 'all 0.35s ease',
          }}
        >
          {/* Red YouTube Logo Icon */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '20px',
                height: '14px',
                borderRadius: '4px',
                background: '#ff0000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '3px solid transparent',
                  borderBottom: '3px solid transparent',
                  borderLeft: '5px solid #ffffff',
                  marginLeft: '2px',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#888892' }}>
              {stage === 'search' ? 'Opened · youtube.com' : 'Playing · youtube.com'}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>lofi beats</div>
            {stage === 'search' && (
              <div style={{ fontSize: '10px', color: '#71717a', marginTop: '1px' }}>
                Search results. Nothing is playing yet.
              </div>
            )}
          </div>
        </div>

        {/* Browser Window inside Monitor Frame */}
        <div
          style={{
            background: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
            borderRadius: '16px',
            overflow: 'hidden',
            minHeight: '520px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Browser Chrome Window Container */}
          <div
            style={{
              margin: '32px 36px 40px 36px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Browser Tabstrip */}
            <div
              style={{
                background: '#dfe3e8',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid #d0d5dd',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', marginRight: '10px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#27c93f' }} />
              </div>

              {/* Tab Title */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '8px 8px 0 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1a1814',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: '#ff0000', fontSize: '11px' }}>▶</span>
                <span>{stage === 'search' ? 'lofi beats - YouTube' : 'lofi beats to study and relax'}</span>
              </div>
              <span style={{ color: '#888', fontSize: '14px', cursor: 'pointer' }}>+</span>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', fontSize: '11px', color: '#888' }}>
                <span>─</span>
                <span>□</span>
                <span>✕</span>
              </div>
            </div>

            {/* Omnibox / URL Bar */}
            <div
              style={{
                background: '#f1f3f4',
                padding: '6px 16px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  color: '#555',
                  flex: 1,
                  maxWidth: '380px',
                }}
              >
                {stage === 'search'
                  ? 'youtube.com/results?search_query=lofi+beats'
                  : 'youtube.com/watch?v=lofi'}
              </div>
            </div>

            {/* YouTube Search Bar Header */}
            <div
              style={{
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#ff0000', fontSize: '18px', fontWeight: 800 }}>▶</span>
                <strong style={{ fontSize: '15px', color: '#1a1814' }}>YouTube</strong>
              </div>

              <div
                style={{
                  background: '#f8f8f8',
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  width: '320px',
                  fontSize: '13px',
                  color: '#333',
                }}
              >
                lofi beats
              </div>

              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0e0e0' }} />
            </div>

            {/* YouTube Body Content */}
            {stage === 'search' ? (
              /* ================= STAGE 1: SEARCH RESULTS GRID (Screenshot 4) ================= */
              <div
                style={{
                  padding: '24px 28px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px',
                  minHeight: '340px',
                }}
              >
                {[
                  {
                    title: 'lofi beats to study and relax',
                    sub: 'lofi radio • 2M views',
                    bg: 'linear-gradient(135deg, #4c2d58 0%, #85476a 100%)',
                  },
                  {
                    title: 'rainy night lofi • chill mix',
                    sub: 'lofi radio • 3M views',
                    bg: 'linear-gradient(135deg, #32536b 0%, #46708f 100%)',
                  },
                  {
                    title: '3 AM coding session - lofi',
                    sub: 'lofi radio • 4M views',
                    bg: 'linear-gradient(135deg, #6c4b2f 0%, #946944 100%)',
                  },
                  {
                    title: 'sunday morning lofi beats',
                    sub: 'lofi radio • 1.5M views',
                    bg: 'linear-gradient(135deg, #51335f 0%, #7d4d8a 100%)',
                  },
                  {
                    title: 'lofi for late night focus',
                    sub: 'lofi radio • 2.8M views',
                    bg: 'linear-gradient(135deg, #375266 0%, #4a7491 100%)',
                  },
                  {
                    title: 'coffee shop ambient lofi',
                    sub: 'lofi radio • 5M views',
                    bg: 'linear-gradient(135deg, #6b533a 0%, #8f7253 100%)',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setStage('playing')}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <div
                      style={{
                        height: '110px',
                        borderRadius: '12px',
                        background: item.bg,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1814' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ================= STAGE 2: PLAYING VIDEO (Screenshot 5) ================= */
              <div
                style={{
                  padding: '24px 28px',
                  display: 'grid',
                  gridTemplateColumns: '1.75fr 1fr',
                  gap: '24px',
                  minHeight: '340px',
                }}
              >
                {/* Main Video Player */}
                <div>
                  <div
                    style={{
                      height: '240px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #3c234a 0%, #5f366e 50%, #854d80 100%)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    }}
                  >
                    {/* Scrub line at bottom */}
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', width: '100%' }}>
                      <div style={{ height: '100%', width: '45%', background: '#ff0000' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: '#1a1814' }}>
                      lofi beats to study and relax
                    </h2>
                    <p style={{ margin: 0, fontSize: '12px', color: '#777' }}>
                      lofi radio • 2M views
                    </p>
                  </div>
                </div>

                {/* Related Videos Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { title: 'rainy night lofi • chill mix', bg: '#3a5870' },
                    { title: '3 AM coding session • lofi', bg: '#735235' },
                    { title: 'sunday morning lofi beats', bg: '#5e3a6e' },
                    { title: 'lofi for late night focus', bg: '#3e586b' },
                  ].map((rel, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '90px',
                          height: '52px',
                          borderRadius: '8px',
                          background: rel.bg,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#333' }}>
                        {rel.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating Speech Bubble at Bottom of Monitor (Screenshots 4 & 5) */}
          <div
            style={{
              alignSelf: 'center',
              marginBottom: '20px',
              background: '#121215',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#888892',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              HITODAMA
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {stage === 'search' ? "Here's lo-fi beats on YouTube." : 'Playing it.'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
