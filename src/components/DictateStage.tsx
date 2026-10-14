import React, { useState, useEffect } from 'react';

export const DictateStage: React.FC = () => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="section Dictate_section__wj0ju"
      id="dictate"
      data-gap-top="close"
      data-gap-bottom="tight"
      data-reveal="true"
      style={{ padding: '80px 24px', background: '#faf9f5' }}
    >
      <div
        className="feature-row"
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: '64px',
          alignItems: 'center',
        }}
      >
        {/* Left Monitor Display Frame */}
        <div className="feature-art" data-motion-item="true">
          <div
            style={{
              position: 'relative',
              background: '#0d0d0f',
              padding: '10px',
              borderRadius: '24px',
              boxShadow: '0 32px 80px rgba(0, 0, 0, 0.16), 0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid #232328',
            }}
          >
            {/* Monitor Screen Glass */}
            <div
              style={{
                position: 'relative',
                height: '420px',
                borderRadius: '16px',
                background: 'linear-gradient(145deg, #eaf0f6 0%, #f4f7fa 55%, #e6eff7 100%)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '36px 36px 28px 36px',
                boxSizing: 'border-box',
              }}
            >
              {/* Ghost background chat pill shapes */}
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  left: '-20px',
                  width: '120px',
                  height: '24px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.65)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '56px',
                  left: '-30px',
                  width: '140px',
                  height: '24px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.65)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '72px',
                  right: '-10px',
                  width: '160px',
                  height: '28px',
                  borderRadius: '14px',
                  background: 'rgba(203, 219, 233, 0.5)',
                }}
              />

              {/* Chat Thread Bubble (Top-Left Area) */}
              <div style={{ maxWidth: '340px', zIndex: 2, marginTop: '12px' }}>
                <div
                  style={{
                    background: '#ffffff',
                    color: '#2d3338',
                    padding: '20px 24px',
                    borderRadius: '22px',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    fontFamily: 'var(--font-body)',
                    boxShadow: '0 14px 34px rgba(45, 60, 80, 0.09), 0 2px 6px rgba(45, 60, 80, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                  }}
                >
                  Hey John! Let’s go together at make it 9am, after that let’s go together. Also, take care of of yours!
                </div>
              </div>

              {/* Floating Input Card with Audio Wave Pill at Bottom */}
              <div style={{ position: 'relative', width: '100%', zIndex: 2, marginTop: 'auto' }}>
                {/* Text input container */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 10px 30px rgba(50, 65, 85, 0.08), 0 1px 4px rgba(50, 65, 85, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <span style={{ color: '#8c9aa6', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
                    Message John M
                  </span>

                  {/* Send circle button */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#60a5fa',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ›
                  </div>
                </div>

                {/* Overlapping black audio pill with cyan waveform */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#121214',
                    borderRadius: '999px',
                    padding: '6px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px rgba(92, 184, 255, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '3px',
                      height: pulse ? '12px' : '6px',
                      borderRadius: '2px',
                      background: '#5cb8ff',
                      transition: 'height 0.25s ease',
                    }}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      width: '3px',
                      height: pulse ? '18px' : '14px',
                      borderRadius: '2px',
                      background: '#5cb8ff',
                      transition: 'height 0.25s ease',
                    }}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      width: '3px',
                      height: pulse ? '8px' : '16px',
                      borderRadius: '2px',
                      background: '#5cb8ff',
                      transition: 'height 0.25s ease',
                    }}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      width: '3px',
                      height: pulse ? '16px' : '10px',
                      borderRadius: '2px',
                      background: '#5cb8ff',
                      transition: 'height 0.25s ease',
                    }}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      width: '3px',
                      height: pulse ? '6px' : '12px',
                      borderRadius: '2px',
                      background: '#5cb8ff',
                      transition: 'height 0.25s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Copy Column */}
        <div className="feature-copy" style={{ padding: '0 12px' }}>
          <h2
            style={{
              fontSize: 'clamp(2.6rem, 4.2vw, 4.2rem)',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.15,
              margin: '0 0 20px 0',
              color: '#1a1814',
              fontWeight: 400,
            }}
          >
            Talk badly.{' '}
            <span
              style={{
                fontStyle: 'italic',
                fontFamily: 'var(--font-display)',
                color: '#4a463a',
                fontWeight: 400,
              }}
            >
              Send it clean.
            </span>
          </h2>

          <p
            style={{
              fontSize: '18px',
              color: '#555146',
              lineHeight: 1.6,
              margin: '0',
            }}
          >
            Hold{' '}
            <kbd
              style={{
                display: 'inline-block',
                background: '#121214',
                color: '#ffffff',
                padding: '2px 9px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                margin: '0 3px',
                verticalAlign: 'baseline',
              }}
            >
              Ctrl
            </kbd>{' '}
            +{' '}
            <kbd
              style={{
                display: 'inline-block',
                background: '#121214',
                color: '#ffffff',
                padding: '2px 9px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                margin: '0 3px',
                verticalAlign: 'baseline',
              }}
            >
              Win
            </kbd>{' '}
            anywhere in Windows and just talk. False starts, corrections, the lot. Let go and the finished sentence is already in the box.
          </p>
        </div>
      </div>
    </section>
  );
};
