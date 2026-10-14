import React, { useState } from 'react';

const FAQS = [
  {
    q: "Is the API key really free?",
    a: "Yes. Completely free to generate in Google AI Studio without entering any credit card. Hitodama is engineered to keep everyday voice and research usage well inside Google's free tier limits, meaning there are zero recurring charges unless you explicitly choose to activate paid billing.",
  },
  {
    q: "How is Hitodama a one-time purchase?",
    a: "Because you connect your own free Gemini API key, we do not pay monthly cloud hosting meters for your prompts. You buy the native Windows companion once, and you own the software forever without monthly subscription lock-in.",
  },
  {
    q: "Is Hitodama just a Gemini wrapper?",
    a: "Not even close. Hitodama is a high-performance native Windows application featuring an interactive procedural physics soul companion, real-time screen vision loop, keyboard automation hooks, audio waveform cleaner, and a custom Windows Dynamic Island HUD.",
  },
  {
    q: "What does Hitodama actually do?",
    a: "It turns voice into instant computer action: circling on-screen elements to research them, dictating rambling voice notes into polished copy, opening applications at scheduled times, controlling media, and keeping track of your desktop context.",
  },
  {
    q: "What do I pay for?",
    a: "You pay for the Windows 10 & 11 application, all future Founders Edition software updates, the custom procedural soul loadout skins, and lifetime founder status.",
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="section FaqSection_section__xcDgN" id="faq" style={{ padding: '90px 20px', maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', fontFamily: 'var(--font-display)', margin: '0 0 16px 0', lineHeight: 1.1 }}>
          Questions?
        </h2>
        <p style={{ fontSize: '18px', color: '#5e5a4c', margin: 0 }}>
          The things worth knowing before you give your computer a soul.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              onClick={() => toggle(idx)}
              style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid rgba(64,52,20,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isOpen ? '0 10px 30px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '17px', color: '#1c1b17' }}>{faq.q}</strong>
                <span style={{ fontSize: '20px', color: '#888', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }}>
                  +
                </span>
              </div>

              {isOpen && (
                <div style={{ padding: '0 24px 20px 24px', color: '#5e5a4c', fontSize: '15px', lineHeight: 1.6, borderTop: '1px solid #f2f2f2', paddingTop: '16px' }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
