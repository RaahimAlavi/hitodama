import React, { useState } from 'react';
import { SOUL_SKINS, SoulConfig } from '../lib/soulMath';
import { SoulCanvas } from './SoulCanvas';

const VOICES = [
  { key: 'voice_charon', name: 'Charon', blurb: 'The OG voice of the soul' },
  { key: 'voice_puck', name: 'Puck', blurb: "Relatable developer voice" },
  { key: 'voice_leda', name: 'Leda', blurb: 'Vibrant companion voice' },
  { key: 'voice_jack', name: 'Jack', blurb: 'Warm conversational friend' },
];

export const PersonaSection: React.FC = () => {
  const [selectedSoul, setSelectedSoul] = useState<SoulConfig>(SOUL_SKINS[0]);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [activeSlot, setActiveSlot] = useState<'soul' | 'abilities' | 'personality' | 'voice'>('soul');

  return (
    <section
      className="section Persona_section__nPD83"
      id="soul"
      style={{
        padding: '90px 20px',
        maxWidth: '1140px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2
          style={{
            fontSize: 'clamp(2.4rem, 4.5vw, 4rem)',
            fontFamily: 'var(--font-display)',
            margin: '0 0 16px 0',
            lineHeight: 1.1,
            color: '#1a1814',
            fontWeight: 400,
          }}
        >
          Shape your{' '}
          <em style={{ fontStyle: 'italic', fontFamily: 'var(--font-display)', color: '#3d3a2f' }}>
            Hitodama.
          </em>
        </h2>
        <p
          style={{
            fontSize: '18px',
            color: '#555146',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          The soul is powered by four slots. Customize each of them and make your soul unique, and actually yours.
        </p>
      </div>

      {/* Mind-Map Interactive Loadout Window (Matching Screenshot 5) */}
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          height: '520px',
          background: '#1c1b1e',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 32px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Title Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>💧</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Hitodama</span>
          </div>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </div>
        </div>

        <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '12px' }}>
          Loadout
        </div>

        {/* Mind-Map Graph Canvas */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Curved Connector Cables SVG */}
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            {/* Top-Left node to center */}
            <path
              d="M 270 115 C 330 115, 330 165, 360 165"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Bottom-Left node to center */}
            <path
              d="M 270 215 C 330 215, 330 165, 360 165"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Top-Right node to center */}
            <path
              d="M 450 115 C 390 115, 390 165, 360 165"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Bottom-Right node to center */}
            <path
              d="M 450 215 C 390 215, 390 165, 360 165"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>

          {/* Central Soul Portal */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(92, 184, 255, 0.25) 0%, rgba(20, 25, 35, 0.85) 70%)',
              boxShadow: `0 0 36px ${selectedSoul.glow}`,
              border: '2px solid rgba(92, 184, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <SoulCanvas
              soul={selectedSoul}
              width={76}
              height={62}
              scale={0.95}
              mode="LISTENING"
              interactive={true}
            />
          </div>

          {/* Node 1: Top-Left (Soul) */}
          <div
            onClick={() => setActiveSlot('soul')}
            style={{
              position: 'absolute',
              top: '90px',
              left: '140px',
              background: activeSlot === 'soul' ? '#2c2e36' : '#23252b',
              border: activeSlot === 'soul' ? '1px solid #5cb8ff' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              zIndex: 3,
              boxShadow: activeSlot === 'soul' ? '0 0 16px rgba(92, 184, 255, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '15px' }}>✨</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                {selectedSoul.name}
              </div>
              <div style={{ fontSize: '10px', color: '#888892' }}>Soul</div>
            </div>
          </div>

          {/* Node 2: Bottom-Left (Abilities) */}
          <div
            onClick={() => setActiveSlot('abilities')}
            style={{
              position: 'absolute',
              bottom: '90px',
              left: '140px',
              background: activeSlot === 'abilities' ? '#2c2e36' : '#23252b',
              border: activeSlot === 'abilities' ? '1px solid #5cb8ff' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              zIndex: 3,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '15px' }}>🚀</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>—</div>
              <div style={{ fontSize: '10px', color: '#888892' }}>Abilities</div>
            </div>
          </div>

          {/* Node 3: Top-Right (Personality) */}
          <div
            onClick={() => setActiveSlot('personality')}
            style={{
              position: 'absolute',
              top: '90px',
              right: '140px',
              background: activeSlot === 'personality' ? '#2c2e36' : '#23252b',
              border: activeSlot === 'personality' ? '1px solid #5cb8ff' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              zIndex: 3,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '15px' }}>☻</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>True Chad</div>
              <div style={{ fontSize: '10px', color: '#888892' }}>Personality</div>
            </div>
          </div>

          {/* Node 4: Bottom-Right (Voice) */}
          <div
            onClick={() => setActiveSlot('voice')}
            style={{
              position: 'absolute',
              bottom: '90px',
              right: '140px',
              background: activeSlot === 'voice' ? '#2c2e36' : '#23252b',
              border: activeSlot === 'voice' ? '1px solid #5cb8ff' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              zIndex: 3,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '15px' }}>🕪</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                {selectedVoice.name}
              </div>
              <div style={{ fontSize: '10px', color: '#888892' }}>Voice</div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Navigation Pill Dock */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <div
            style={{
              background: '#23252b',
              borderRadius: '999px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 12px', fontSize: '14px', cursor: 'pointer' }}>🏠</button>
            <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 12px', fontSize: '14px', cursor: 'pointer' }}>🔗</button>
            <button
              style={{
                background: '#323238',
                border: 'none',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              💧 Soul
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 12px', fontSize: '14px', cursor: 'pointer' }}>A</button>
            <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 12px', fontSize: '14px', cursor: 'pointer' }}>⚙</button>
          </div>
        </div>
      </div>
    </section>
  );
};
