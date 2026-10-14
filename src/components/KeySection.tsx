import React from 'react';

export const KeySection: React.FC = () => {
  return (
    <section className="section Key_section__D_fSz" id="key" style={{ padding: '90px 20px', maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', fontFamily: 'var(--font-display)', margin: '0 0 16px 0', lineHeight: 1.1 }}>
          How to <em style={{ fontStyle: 'italic', color: '#5CB8FF' }}>set up.</em>
        </h2>
        <p style={{ fontSize: '18px', color: '#5e5a4c', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
          One key. One paste. Then talk. Built directly for Google Gemini's generous free tier.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {/* Step 1 */}
        <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid rgba(64,52,20,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#888', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
            01 · MAKE
          </span>
          <h3 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>Get your key.</h3>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
            Open Google AI Studio and click "Create API key". Completely free, zero billing setup, no card required.
          </p>

          <div style={{ background: '#f5f5f5', padding: '12px 14px', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#333' }}>
            <span style={{ color: '#888' }}>Google AI Studio · API key:</span>
            <div style={{ fontWeight: 700, marginTop: '4px', color: '#1c1b17' }}>AIzaSy••••••••••••••4x</div>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid rgba(64,52,20,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#888', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
            02 · PASTE
          </span>
          <h3 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>Add it once.</h3>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
            Paste your key into Hitodama's Settings drawer. It is stored securely on your local machine only.
          </p>

          <div style={{ background: '#f5f5f5', padding: '12px 14px', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#333' }}>
            <span style={{ color: '#888' }}>Settings · Gemini Key:</span>
            <div style={{ color: '#8ED92F', fontWeight: 700, marginTop: '4px' }}>✓ Saved to local keystore</div>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ background: '#1c1b17', color: '#fff', padding: '32px', borderRadius: '20px', boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#8ED92F', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
            03 · TALK
          </span>
          <h3 style={{ fontSize: '20px', margin: '0 0 10px 0', color: '#fff' }}>Start talking.</h3>
          <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
            Hold your shortcut or click the island. Ask research questions, automate folders, or dictate messy speech.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 14px', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#5CB8FF' }}>
            "Hitodama, what's on my screen right now?"
          </div>
        </div>
      </div>
    </section>
  );
};
