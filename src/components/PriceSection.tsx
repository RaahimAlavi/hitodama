import React, { useState } from 'react';

interface PriceSectionProps {
  onBuyClick?: () => void;
  currency?: 'IN' | 'INTL';
}

const DURATIONS = [
  { label: '1 month', months: 1, subPriceUSD: 20, subPriceINR: 1500 },
  { label: '1 year', months: 12, subPriceUSD: 240, subPriceINR: 18000 },
  { label: '2 years', months: 24, subPriceUSD: 480, subPriceINR: 36000 },
  { label: '3 years', months: 36, subPriceUSD: 720, subPriceINR: 54000 },
  { label: '5 years', months: 60, subPriceUSD: 1200, subPriceINR: 90000 },
];

export const PriceSection: React.FC<PriceSectionProps> = ({ onBuyClick, currency = 'INTL' }) => {
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(1); // default: 1 year

  const currentDuration = DURATIONS[selectedDurationIndex];
  const hitodamaPrice = currency === 'IN' ? '₹499' : '$14.00';
  const subCost = currency === 'IN' ? `₹${currentDuration.subPriceINR.toLocaleString()}` : `$${currentDuration.subPriceUSD}.00`;

  return (
    <section className="section Close_section__ZUA2y" id="price" style={{ padding: '90px 20px', maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', fontFamily: 'var(--font-display)', margin: '0 0 16px 0', lineHeight: 1.1 }}>
          Pay once. <em style={{ fontStyle: 'italic', color: '#8ED92F' }}>Keep it.</em>
        </h2>
        <p style={{ fontSize: '18px', color: '#5e5a4c', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          One payment. No monthly meter. Stop paying software rent for tools running directly on your personal computer.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'stretch' }}>
        {/* Receipt 1: Hitodama Flat One-Line Receipt */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '36px',
            border: '1px solid rgba(64,52,20,0.14)',
            boxShadow: '0 16px 50px rgba(58,46,14,0.08)',
            fontFamily: 'var(--font-mono)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ddd', paddingBottom: '16px', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#888' }}>HITODAMA RECEIPT · ONE LINE</span>
            <span style={{ fontSize: '12px', color: '#8ED92F', fontWeight: 700 }}>PAID IN FULL</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#333', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Founders Edition</span>
              <strong>{hitodamaPrice}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
              <span>Every future update</span>
              <span>$0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
              <span>Founder lifetime status</span>
              <span>$0.00</span>
            </div>
          </div>

          <div style={{ borderTop: '2px solid #111', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
            <span style={{ fontWeight: 800, fontSize: '16px' }}>TOTAL DUE</span>
            <strong style={{ fontSize: '28px', color: '#111' }}>{hitodamaPrice}</strong>
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
            One receipt. Ever. No cards stored, no renewal reminders, and no cancellation dark patterns.
          </p>

          <button
            type="button"
            onClick={onBuyClick}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '14px',
              borderRadius: '12px',
              background: '#1c1b17',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Claim Founders Edition
          </button>
        </div>

        {/* Receipt 2: Compounding Subscription Statement */}
        <div
          style={{
            background: '#faf9f0',
            borderRadius: '20px',
            padding: '36px',
            border: '1px dashed #c9452c',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d86a3c', paddingBottom: '16px', marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#c9452c' }}>TYPICAL AI SUBSCRIPTION</span>
            <span style={{ fontSize: '12px', color: '#c9452c', fontWeight: 700 }}>STILL PRINTING</span>
          </div>

          {/* Time Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            {DURATIONS.map((d, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDurationIndex(idx)}
                style={{
                  flex: 1,
                  padding: '6px 2px',
                  borderRadius: '6px',
                  border: selectedDurationIndex === idx ? '1px solid #1c1b17' : '1px solid #ddd',
                  background: selectedDurationIndex === idx ? '#1c1b17' : '#fff',
                  color: selectedDurationIndex === idx ? '#fff' : '#555',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', margin: '20px 0' }}>
            <span style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Total paid over {currentDuration.label}
            </span>
            <strong style={{ fontSize: '42px', color: '#c9452c', margin: '8px 0', fontFamily: 'var(--font-mono)' }}>
              {subCost}
            </strong>
            <span style={{ fontSize: '13px', color: '#777' }}>
              at $20/month ... and counting
            </span>
          </div>

          <div style={{ borderTop: '1px dashed #ddd', paddingTop: '16px', fontSize: '13px', color: '#666', lineHeight: 1.5 }}>
            With Hitodama, you save <strong style={{ color: '#2f7d4f' }}>
              {currency === 'IN' ? `₹${(currentDuration.subPriceINR - 499).toLocaleString()}` : `$${currentDuration.subPriceUSD - 14}.00`}
            </strong> over {currentDuration.label}.
          </div>
        </div>
      </div>
    </section>
  );
};
