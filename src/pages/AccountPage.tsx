import React, { useState } from 'react';
import { LandingHeader } from '../components/LandingHeader';
import { Footer } from '../components/Footer';

interface AccountPageProps {
  onNavigate: (route: string) => void;
  currency?: 'IN' | 'INTL';
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate, currency = 'INTL' }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingHeader currentRoute="/account/" onNavigate={onNavigate} currency={currency} />

      <main style={{ flex: 1, padding: '60px 20px', maxWidth: '580px', margin: '0 auto', width: '100%' }}>
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

        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#8ED92F', background: '#1c1b17', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
          PRIVATE CUSTOMER ACCESS
        </span>

        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontFamily: 'var(--font-display)', margin: '16px 0 12px 0' }}>
          Your Hito.
        </h1>
        <p style={{ color: '#5e5a4c', fontSize: '18px', margin: '0 0 36px 0', lineHeight: 1.6 }}>
          Use the email from your purchase. No signup. No password to remember.
        </p>

        {submitted ? (
          <div style={{ background: '#fff', padding: '36px', borderRadius: '20px', border: '1px solid rgba(64,52,20,0.1)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Check your inbox</h3>
            <p style={{ color: '#666', fontSize: '15px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              We sent a secure sign-in link to <strong>{email}</strong>. Click it to view your license key and download installers.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              style={{ background: 'none', border: 'none', color: '#5CB8FF', cursor: 'pointer', fontSize: '14px' }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '36px',
              border: '1px solid rgba(64,52,20,0.12)',
              boxShadow: '0 16px 50px rgba(58,46,14,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                Purchase Email
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
            </div>

            <button
              type="submit"
              style={{
                background: '#1c1b17',
                color: '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Send Access Link
            </button>

            <p style={{ margin: 0, fontSize: '12px', color: '#888', textAlign: 'center', lineHeight: 1.5 }}>
              Hito stores account and purchase access only. Payment credentials never enter this website.
            </p>
          </form>
        )}
      </main>

      <Footer onBuyClick={() => onNavigate('/buy/')} currency={currency} />
    </div>
  );
};
