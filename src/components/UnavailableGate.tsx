import React from 'react';

interface UnavailableGateProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnavailableGate: React.FC<UnavailableGateProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          maxWidth: '520px',
          padding: '36px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#c9452c', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 12px 0' }}>
          Not available in your country
        </p>
        <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', margin: '0 0 16px 0', color: '#1c1b17' }}>
          Hitodama can’t work where you are.
        </h2>
        <p style={{ color: '#5e5a4c', fontSize: '15px', lineHeight: 1.6, margin: '0 0 12px 0' }}>
          Hitodama Founders Edition runs on your own Gemini API key, and Google doesn’t offer the Gemini API in your country. Hitodama would never be able to answer you there, so it can’t be bought here.
        </p>
        <p style={{ color: '#5e5a4c', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          See{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/available-regions"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: '#5CB8FF', textDecoration: 'underline' }}
          >
            Google’s list of countries where the Gemini API is available
          </a>.
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: '#1c1b17',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};
