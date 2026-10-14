import React, { useState, useEffect } from 'react';

export const SpeedSection: React.FC = () => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="section Speed_section__34FUa"
      id="speed"
      style={{
        padding: '90px 20px',
        maxWidth: '1080px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Comparison Grid (Matching Screenshot 1: media_1791933758753_db551ffe) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '28px',
          width: '100%',
          alignItems: 'stretch',
        }}
      >
        {/* Left Card: Typing it (35 WORDS A MINUTE) */}
        <div
          style={{
            background: '#faf8f2',
            borderRadius: '24px',
            padding: '36px 36px 28px 36px',
            border: '1px solid rgba(64, 52, 20, 0.08)',
            boxShadow: '0 8px 28px rgba(64, 52, 20, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            justifyContent: 'space-between',
            minHeight: '340px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#1a1916',
                margin: '0 0 6px 0',
                fontFamily: 'var(--font-body)',
              }}
            >
              Typing it
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#8a867b',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              35 words a minute
            </span>
          </div>

          {/* Body Sentence */}
          <p
            style={{
              fontSize: '20px',
              lineHeight: 1.5,
              color: '#78756c',
              maxWidth: '380px',
              margin: '20px 0',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ color: '#1a1916', fontWeight: 600 }}>Pull</span> up last quarter's numbers, compare them with this one, and tell me what actually changed.
          </p>

          {/* Action prompt */}
          <div style={{ fontSize: '12px', color: '#9c978b', marginBottom: '16px' }}>
            Click and type it
          </div>

          {/* Progress row */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#78756c', fontFamily: 'var(--font-mono)', width: '38px', textAlign: 'left' }}>
              2.78s
            </span>
            <div style={{ flex: 1, height: '3px', background: '#eae5d8', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '15%', height: '100%', background: '#78756c' }} />
            </div>
          </div>
        </div>

        {/* Right Card: Saying it (190 WORDS A MINUTE) */}
        <div
          style={{
            background: '#14161c',
            borderRadius: '24px',
            padding: '36px 36px 28px 36px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            justifyContent: 'space-between',
            minHeight: '340px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#ffffff',
                margin: '0 0 6px 0',
                fontFamily: 'var(--font-body)',
              }}
            >
              Saying it
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#78c7ff',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              190 words a minute
            </span>
          </div>

          {/* Body Sentence */}
          <p
            style={{
              fontSize: '20px',
              lineHeight: 1.5,
              color: '#4a4d56',
              maxWidth: '380px',
              margin: '20px 0',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              Pull up last quarter's numbers, compare them with{' '}
            </span>
            this one, and tell me what actually changed.
          </p>

          {/* Hotkey + Animated Waveform Capsule */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: '#1d2028',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '6px 16px',
              borderRadius: '999px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>
              <kbd style={{ background: '#252936', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)' }}>
                Ctrl
              </kbd>
              <span style={{ color: '#888' }}>+</span>
              <kbd style={{ background: '#252936', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)' }}>
                Win
              </kbd>
            </div>

            {/* Cyan Waveform Bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5px', height: '14px' }}>
              {[6, 12, 16, 10, 14, 18, 12, 16, 8, 14].map((h, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: pulse ? `${h}px` : `${Math.max(4, h * 0.6)}px`,
                    background: '#5cb8ff',
                    borderRadius: '1px',
                    transition: 'height 0.25s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress row */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#78c7ff', fontFamily: 'var(--font-mono)', width: '38px', textAlign: 'left' }}>
              2.78s
            </span>
            <div style={{ flex: 1, height: '3px', background: '#222632', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '65%', height: '100%', background: '#3b82f6' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Callout */}
      <h3
        style={{
          textAlign: 'center',
          fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
          fontWeight: 400,
          color: '#3d3a33',
          marginTop: '44px',
          fontFamily: 'var(--font-body)',
        }}
      >
        <em
          style={{
            fontStyle: 'italic',
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '1.25em',
            marginRight: '6px',
          }}
        >
          5.4× faster.
        </em>{' '}
        An hour of typing is 11 minutes of talking.
      </h3>
    </section>
  );
};
