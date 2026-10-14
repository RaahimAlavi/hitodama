import React from 'react';

interface EditionsSectionProps {
  onBuyClick?: () => void;
  currency?: 'IN' | 'INTL';
}

export const EditionsSection: React.FC<EditionsSectionProps> = ({ onBuyClick, currency = 'INTL' }) => {
  return (
    <section className="section Editions_section__0yUjS" id="editions" style={{ padding: '90px 20px', maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', fontFamily: 'var(--font-display)', margin: '0 0 16px 0', lineHeight: 1.1 }}>
          Editions. <em style={{ fontStyle: 'italic', color: '#8ED92F' }}>The first one won’t stay open.</em>
        </h2>
        <p style={{ fontSize: '18px', color: '#5e5a4c', maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
          Founders Edition closes for good the day the next edition opens. Lock in lifetime access while Edition 01 is live.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'stretch' }}>
        {/* Founders Edition Card */}
        <div
          style={{
            background: '#1c1b17',
            color: '#fff',
            borderRadius: '24px',
            padding: '40px',
            border: '2px solid #8ED92F',
            boxShadow: '0 24px 70px rgba(0,0,0,0.25)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', background: '#8ED92F', color: '#000', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', fontFamily: 'var(--font-mono)' }}>
              EDITION 01 · OPEN NOW
            </span>
            <span style={{ fontSize: '18px', fontFamily: 'var(--font-jp)', color: '#8ED92F' }}>
              人魂
            </span>
          </div>

          <h3 style={{ fontSize: '28px', margin: '0 0 12px 0' }}>Founders Edition</h3>
          <p style={{ color: '#aaa', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            Pay once. Never a subscription. Yours for good, long after Edition 01 closes.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, fontSize: '14px', color: '#ddd' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#8ED92F', fontWeight: 700 }}>✓</span>
              Every Founders Edition update, free. Major ones too.
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#8ED92F', fontWeight: 700 }}>✓</span>
              Runs on your own free Gemini API key (no credit card required).
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#8ED92F', fontWeight: 700 }}>✓</span>
              Windows 10 &amp; 11 native companion with Dynamic Island.
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#8ED92F', fontWeight: 700 }}>✓</span>
              Full memory, computer control, and dictation suite included.
            </li>
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#888', display: 'block' }}>ONE-TIME PAYMENT</span>
              <strong style={{ fontSize: '28px', color: '#fff' }}>
                {currency === 'IN' ? '₹499' : '$14'}
              </strong>
            </div>

            <button
              type="button"
              onClick={onBuyClick}
              style={{
                background: '#8ED92F',
                color: '#000',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Get Founders Edition
            </button>
          </div>
        </div>

        {/* Future Pass Card */}
        <div
          style={{
            background: 'rgba(64,52,20,0.03)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px dashed rgba(64,52,20,0.2)',
            display: 'flex',
            flexDirection: 'column',
            opacity: 0.8,
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', background: '#e0ded3', color: '#555', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', fontFamily: 'var(--font-mono)' }}>
              EDITION 02 · COMING LATER
            </span>
          </div>

          <h3 style={{ fontSize: '28px', margin: '0 0 12px 0', color: '#333' }}>Hitodama Pass</h3>
          <p style={{ color: '#777', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            For enterprise teams and cross-device sync requiring cloud hosting.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, fontSize: '14px', color: '#666' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>○</span> Cross-device sync (Windows + Mobile).
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>○</span> Team shared routines and memory slots.
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>○</span> Cloud-hosted fallback LLM endpoints.
            </li>
          </ul>

          <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)', color: '#888', fontSize: '13px' }}>
            Will require an active monthly subscription when released.
          </div>
        </div>
      </div>
    </section>
  );
};
