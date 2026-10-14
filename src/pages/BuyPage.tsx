import React, { useState } from 'react';
import { LandingHeader } from '../components/LandingHeader';
import { Footer } from '../components/Footer';

interface BuyPageProps {
  onNavigate: (route: string) => void;
  currency?: 'IN' | 'INTL';
}

export const BuyPage: React.FC<BuyPageProps> = ({ onNavigate, currency = 'INTL' }) => {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const price = currency === 'IN' ? '₹499' : '$14';

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !agreed) return;
    setStatus('success');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingHeader currentRoute="/buy/" onNavigate={onNavigate} currency={currency} />

      <main style={{ flex: 1, padding: '60px 20px', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to website
        </button>

        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontFamily: 'var(--font-display)', margin: '0 0 12px 0' }}>
          Buy Hitodama
        </h1>
        <p style={{ color: '#5e5a4c', fontSize: '18px', margin: '0 0 40px 0' }}>
          Checkout · <strong>{price} once</strong> · Founders Edition · every update included.
        </p>

        {status === 'success' ? (
          <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', border: '1px solid rgba(64,52,20,0.1)', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#8ED92F', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px auto' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '24px', margin: '0 0 12px 0' }}>Access link sent!</h2>
            <p style={{ color: '#666', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              We've dispatched your Founders Edition license key and download link to <strong>{email}</strong>.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/account/')}
              style={{
                background: '#1c1b17',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Account
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleCheckout}
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid rgba(64,52,20,0.12)',
              boxShadow: '0 20px 60px rgba(58,46,14,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '1px solid #ddd',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '12px', color: '#888', marginTop: '6px', display: 'block' }}>
                Your purchase receipt and Windows activation key will be delivered here.
              </span>
            </div>

            {/* Summary Box */}
            <div style={{ background: '#fafaf6', borderRadius: '14px', padding: '20px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
                <span>Hitodama Founders Edition (Windows)</span>
                <strong>{price}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
                <span>Lifetime updates</span>
                <span>$0.00</span>
              </div>
              <div style={{ borderTop: '1px solid #eee', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px' }}>
                <span>Total Due</span>
                <span style={{ color: '#1c1b17' }}>{price}</span>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <span>
                I agree to the licence terms. I understand Hitodama requires a free Google Gemini API key to operate.
              </span>
            </label>

            <button
              type="submit"
              disabled={!agreed || !email}
              style={{
                background: agreed && email ? '#1c1b17' : '#aaa',
                color: '#fff',
                border: 'none',
                padding: '16px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '16px',
                cursor: agreed && email ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Complete Checkout · {price}
            </button>
          </form>
        )}
      </main>

      <Footer onBuyClick={() => {}} currency={currency} />
    </div>
  );
};
