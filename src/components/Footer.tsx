import React from 'react';

interface FooterProps {
  onBuyClick?: () => void;
  currency?: 'IN' | 'INTL';
}

export const Footer: React.FC<FooterProps> = ({ onBuyClick, currency = 'INTL' }) => {
  return (
    <footer className="Footer_foot__8sZDc" style={{ background: '#14151a', color: '#fff', padding: '90px 20px 40px 20px', marginTop: '80px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Top CTA Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '60px', marginBottom: '60px' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontFamily: 'var(--font-display)', margin: '0 0 10px 0' }}>
              A soul for your Windows.
            </h2>
            <p style={{ margin: 0, color: '#888', fontSize: '15px' }}>
              Give your computer a voice companion that lives in the dynamic island.
            </p>
          </div>

          <button
            type="button"
            onClick={onBuyClick}
            style={{
              background: '#8ED92F',
              color: '#000',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M0 2.4 6.5 1.5v6H0Zm7.4-1L16 0v7.4H7.4ZM0 8.5h6.5v6L0 13.6Zm7.4 0H16V16l-8.6-1.2Z" />
            </svg>
            Download for Windows · {currency === 'IN' ? '₹499' : '$14'}
          </button>
        </div>

        {/* Links Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '60px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <img src="/hitodama-logo.png" alt="" width="28" height="28" />
              <strong style={{ fontSize: '16px', letterSpacing: '1px' }}>HITODAMA</strong>
              <span style={{ fontSize: '12px', color: '#8ED92F', fontFamily: 'var(--font-jp)' }}>人魂</span>
            </div>
            <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
              A voice-first Windows companion that researches, remembers, and acts across your real computer.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><a href="#demo" style={{ color: '#aaa', textDecoration: 'none' }}>How it works</a></li>
              <li><a href="#productivity" style={{ color: '#aaa', textDecoration: 'none' }}>Productivity suite</a></li>
              <li><a href="#soul" style={{ color: '#aaa', textDecoration: 'none' }}>Soul loadout</a></li>
              <li><a href="#key" style={{ color: '#aaa', textDecoration: 'none' }}>Setup guide</a></li>
              <li><a href="#faq" style={{ color: '#aaa', textDecoration: 'none' }}>FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><a href="#terms" style={{ color: '#aaa', textDecoration: 'none' }}>Licence terms</a></li>
              <li><a href="#privacy" style={{ color: '#aaa', textDecoration: 'none' }}>Privacy policy</a></li>
              <li><a href="#refunds" style={{ color: '#aaa', textDecoration: 'none' }}>Refund policy</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>Otism</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <li><span style={{ color: '#aaa' }}>Created by Mainak Deb Das</span></li>
              <li><a href="mailto:support@hitodama.in" style={{ color: '#5CB8FF', textDecoration: 'none' }}>support@hitodama.in</a></li>
              <li><a href="https://www.youtube.com/@Otism_dev/videos" target="_blank" rel="noreferrer" style={{ color: '#ff0033', textDecoration: 'none' }}>YouTube Channel ↗</a></li>
            </ul>
          </div>
        </div>

        {/* Fine Print */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#666' }}>
          <div>
            © 2026 Mainak Deb Das, Otism. All rights reserved. Hitodama · 人魂
          </div>
          <div>
            YouTube, Gmail, Google, Gemini, Chrome, Amazon, Netflix, Spotify and Windows are trademarks of their respective owners. Hitodama is not affiliated with or endorsed by them.
          </div>
        </div>
      </div>
    </footer>
  );
};
