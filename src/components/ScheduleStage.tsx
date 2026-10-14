import React, { useState } from 'react';

export const ScheduleStage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const schedules = [
    {
      time: "6:00 AM",
      command: "Every weekday at 6:00 AM, open Visual Studio Code and pull the latest changes.",
      apps: ["Visual Studio Code", "Git"],
      target: "vscode",
    },
    {
      time: "8:30 PM",
      command: "Open Visual Studio Code, then open Netflix an hour later.",
      apps: ["VS Code", "Netflix"],
      target: "netflix",
    },
    {
      time: "In 30 mins",
      command: "Open Amazon and search for cat food in exactly thirty minutes.",
      apps: ["Amazon Store"],
      target: "amazon",
    },
  ];

  return (
    <section className="section Schedule_section__UbXC6" id="schedule" style={{ padding: '80px 20px', maxWidth: '1140px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 4rem)', fontFamily: 'var(--font-display)', margin: '0 0 16px 0', lineHeight: 1.1 }}>
          Say it once. <em style={{ fontStyle: 'italic', color: '#8ED92F' }}>Then forget it.</em>
        </h2>
        <p style={{ fontSize: '18px', color: '#5e5a4c', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
          Tell it when, and stop carrying it. It wakes itself, runs the task across your real desktop applications, and keeps your schedule moving.
        </p>
      </div>

      {/* Routine Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {schedules.map((s, idx) => (
          <div
            key={idx}
            onClick={() => setActiveTab(idx)}
            style={{
              background: activeTab === idx ? '#1c1b17' : '#fff',
              color: activeTab === idx ? '#fff' : '#1c1b17',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(64,52,20,0.1)',
              boxShadow: activeTab === idx ? '0 16px 40px rgba(0,0,0,0.18)' : '0 4px 12px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: activeTab === idx ? '#8ED92F' : '#888', fontWeight: 700 }}>
                {s.time}
              </span>
              <span style={{ fontSize: '12px', background: activeTab === idx ? 'rgba(255,255,255,0.15)' : '#f0f0f0', padding: '2px 8px', borderRadius: '10px' }}>
                Automated
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, fontWeight: 500 }}>
              "{s.command}"
            </p>
          </div>
        ))}
      </div>

      {/* Multi-Window Preview Stage */}
      <div style={{ background: '#14151a', borderRadius: '20px', padding: '30px', boxShadow: '0 30px 80px rgba(0,0,0,0.3)', color: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Window 1: VS Code */}
          <div style={{ background: '#1e1e1e', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ background: '#252526', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa' }}>
              <span>app.tsx — Visual Studio Code</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span>─</span>
                <span>□</span>
                <span>✕</span>
              </div>
            </div>
            <div style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#9cdcfe', lineHeight: 1.7 }}>
              <p style={{ color: '#6a9955', margin: 0 }}>// Routine execution: 6:00 AM</p>
              <p style={{ margin: 0 }}><span style={{ color: '#c586c0' }}>async function</span> <span style={{ color: '#dcdcaa' }}>runMorningRoutine</span>() {'{'}</p>
              <p style={{ margin: '0 0 0 16px' }}><span style={{ color: '#569cd6' }}>await</span> git.pull();</p>
              <p style={{ margin: '0 0 0 16px' }}><span style={{ color: '#569cd6' }}>await</span> launchDevServer();</p>
              <p style={{ margin: 0 }}>{'}'}</p>
            </div>
          </div>

          {/* Window 2: Entertainment / Target */}
          <div style={{ background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '32px', color: '#e50914', fontWeight: 900, letterSpacing: '2px', marginBottom: '12px' }}>
              NETFLIX
            </span>
            <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 16px 0' }}>Who's watching?</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#3498db', margin: '0 auto 6px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  👤
                </div>
                <span style={{ fontSize: '11px', color: '#888' }}>Mainak</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#e74c3c', margin: '0 auto 6px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🦝
                </div>
                <span style={{ fontSize: '11px', color: '#888' }}>Racoooon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
