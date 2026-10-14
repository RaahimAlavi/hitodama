import React, { useState, useEffect } from 'react';
import { SoulCanvas } from './SoulCanvas';

interface HeroStageProps {
  onBuyClick?: () => void;
}

const WALLPAPERS = [
  '/images/wallpapers/wallpaper0.jpg',
  '/images/wallpapers/wallpaper1.jpg',
  '/images/wallpapers/wallpaper2.jpg',
  '/images/wallpapers/wallpaper3.jpg',
  '/images/wallpapers/wallpaper4.jpg',
];

interface Scenario {
  id: string;
  keys: string[];
  userSaid: string;
  reply: string;
  app: 'gmail' | 'gmail-compose' | 'gmail-dark' | 'youtube' | 'amazon' | 'vscode';
  isDarkMode?: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'dictate',
    keys: ['Ctrl', 'Win'],
    userSaid: "Hey arsh whats up? how about we go and get",
    reply: "Hey Arsh, what's up? How about we go and get coffee tomorrow?",
    app: 'gmail-compose',
    isDarkMode: false,
  },
  {
    id: 'darkmode-ask',
    keys: ['Win', 'Alt'],
    userSaid: "My eyes are hurting with all this",
    reply: "Done. Dark mode's on, easier on the eyes.",
    app: 'gmail',
    isDarkMode: false,
  },
  {
    id: 'darkmode-done',
    keys: ['Win', 'Alt'],
    userSaid: "My eyes are hurting with all this",
    reply: "Done. Dark mode's on, easier on the eyes.",
    app: 'gmail-dark',
    isDarkMode: true,
  },
  {
    id: 'youtube',
    keys: ['Ctrl', 'Shift'],
    userSaid: "Search for lo-fi beats on YouTube",
    reply: "Playing 'lofi hip hop radio - beats to relax/study to'",
    app: 'youtube',
    isDarkMode: false,
  },
];

export const HeroStage: React.FC<HeroStageProps> = ({ onBuyClick }) => {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWallpaper, setActiveWallpaper] = useState(0);

  const currentScenario = SCENARIOS[scenarioIdx];

  // Auto-cycle through the scenarios matching screenshots
  useEffect(() => {
    const interval = setInterval(() => {
      setScenarioIdx((prev) => (prev + 1) % SCENARIOS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="HeroStage_stage__twQbf" id="demo" aria-hidden="true" data-hero-step="5" data-hero-stage="true">
      <div className="HeroStage_screen__VJN6m">
        <div
          className="HeroStage_scene__Lq_C5"
          data-dark={currentScenario.isDarkMode ? 'true' : 'false'}
          style={{ width: '1440px', height: '810px', transform: 'scale(0.8)', transformOrigin: 'top center', position: 'relative' }}
        >
          {/* Desktop Wallpaper */}
          {WALLPAPERS.map((wall, idx) => (
            <i
              key={wall}
              className="HeroStage_wall__wqdEy"
              style={{
                backgroundImage: `url(${wall})`,
                opacity: activeWallpaper === idx ? 1 : 0,
                transition: 'opacity 0.8s ease',
              }}
            />
          ))}

          {/* TOP DYNAMIC ISLAND (Matches Screenshot 2 & 3) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              cursor: 'pointer',
            }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div
              style={{
                width: currentScenario.id.startsWith('darkmode') ? '220px' : '260px',
                height: '54px',
                background: 'linear-gradient(180deg, #141416 0%, #000000 100%)',
                borderRadius: '0 0 24px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderTop: 'none',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Soul */}
              <div style={{ width: '60px', height: '44px' }}>
                <SoulCanvas width={60} height={44} scale={0.9} mode="TALKING" interactive={false} />
              </div>

              {/* Audio Waveform Bars (Matches Screenshot 2) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '18px' }}>
                {[0.4, 0.9, 1.3, 0.7, 1.1, 0.6].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      width: '2.5px',
                      height: `${Math.round(h * 14)}px`,
                      background: '#fff',
                      borderRadius: '2px',
                      opacity: 0.85,
                      animation: `pulseWave ${0.5 + i * 0.1}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* MAIN DESKTOP WINDOW (Matches Screenshots 1, 2, 3) */}
          <div
            style={{
              position: 'absolute',
              top: '90px',
              left: '120px',
              width: '1200px',
              height: '640px',
              borderRadius: '14px',
              background: currentScenario.isDarkMode ? '#1e1e1e' : '#f8fafd',
              color: currentScenario.isDarkMode ? '#fff' : '#1f1f1f',
              boxShadow: '0 30px 90px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'background-color 0.6s ease, color 0.6s ease',
              zIndex: 3,
            }}
          >
            {/* Browser Tabstrip */}
            <div
              style={{
                height: '42px',
                background: currentScenario.isDarkMode ? '#141414' : '#e7ecf2',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: '8px',
                borderBottom: currentScenario.isDarkMode ? '1px solid #2a2a2a' : '1px solid #dbe2ec',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
              </div>

              {/* Tab 1: YouTube */}
              <div style={{ background: currentScenario.isDarkMode ? '#222' : '#f0f3f8', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
                <span style={{ color: '#ff0033' }}>▶</span> lofi beats to study and relax
              </div>

              {/* Tab 2: Gmail (Active) */}
              <div style={{ background: currentScenario.isDarkMode ? '#2d2d2d' : '#ffffff', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <span style={{ color: '#ea4335' }}>✉</span> Inbox (3) - Gmail
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
                <span>─</span>
                <span>□</span>
                <span>✕</span>
              </div>
            </div>

            {/* URL Omnibox */}
            <div style={{ padding: '8px 16px', background: currentScenario.isDarkMode ? '#1b1b1b' : '#f1f4f9', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: currentScenario.isDarkMode ? '1px solid #262626' : '1px solid #e1e7f0' }}>
              <div style={{ background: currentScenario.isDarkMode ? '#282828' : '#ffffff', padding: '4px 16px', borderRadius: '16px', fontSize: '12px', flex: 1, color: '#888' }}>
                mail.google.com/mail/u/0/#inbox
              </div>
            </div>

            {/* Gmail App Content */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr', overflow: 'hidden' }}>
              {/* Sidebar */}
              <div style={{ padding: '20px 16px', borderRight: currentScenario.isDarkMode ? '1px solid #282828' : '1px solid #e5e9f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '18px' }}>
                  <span style={{ color: '#ea4335', fontSize: '20px' }}>M</span> Gmail
                </div>

                <button
                  type="button"
                  style={{
                    background: '#c2e7ff',
                    color: '#001d35',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  ✎ Compose
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                  <div style={{ background: currentScenario.isDarkMode ? '#333' : '#d3e3fd', padding: '8px 14px', borderRadius: '12px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Inbox</span>
                    <span>3</span>
                  </div>
                  <div style={{ padding: '8px 14px', opacity: 0.7 }}>Starred</div>
                  <div style={{ padding: '8px 14px', opacity: 0.7 }}>Snoozed</div>
                  <div style={{ padding: '8px 14px', opacity: 0.7 }}>Sent</div>
                  <div style={{ padding: '8px 14px', opacity: 0.7 }}>Drafts</div>
                </div>
              </div>

              {/* Email List */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: currentScenario.isDarkMode ? '1px solid #333' : '1px solid #eee', fontSize: '13px', color: '#888' }}>
                  <span>Search mail</span>
                </div>

                {[
                  { from: 'Ankit Das', subject: 'Weekend plans — Are we still on for Saturday?', time: '9:25 AM' },
                  { from: 'Team standup', subject: 'Notes from today — Three things came up in the sync...', time: '9:28 AM' },
                  { from: 'Biswaroop', subject: 'Photos from the trip — Finally got them off my phone', time: '9:32 AM' },
                  { from: 'Aswin', subject: 'Re: the game tonight — I’ll bring the controllers', time: '9:32 AM' },
                  { from: 'Mom', subject: 'Call me when you’re free — Nothing urgent, just checking in', time: '9:36 AM' },
                  { from: 'Library', subject: 'Your book is due Friday — Renew it online any time', time: '9:35 AM' },
                ].map((mail, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: currentScenario.isDarkMode ? '#242424' : '#fff',
                      borderRadius: '8px',
                      fontSize: '13px',
                      gap: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <span style={{ opacity: 0.4 }}>☐</span>
                    <strong style={{ width: '140px' }}>{mail.from}</strong>
                    <span style={{ flex: 1, opacity: 0.85 }}>{mail.subject}</span>
                    <span style={{ opacity: 0.5, fontSize: '12px' }}>{mail.time}</span>
                  </div>
                ))}

                {/* COMPOSE WINDOW POPUP (Matches Screenshot 1) */}
                {currentScenario.app === 'gmail-compose' && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '30px',
                      bottom: '20px',
                      width: '460px',
                      background: '#fff',
                      borderRadius: '12px 12px 0 0',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                      border: '1px solid #ddd',
                      overflow: 'hidden',
                      zIndex: 8,
                    }}
                  >
                    <div style={{ background: '#f2f6fc', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#333' }}>
                      <span>New Message</span>
                      <div style={{ display: 'flex', gap: '8px', color: '#888' }}>
                        <span>─</span>
                        <span>✕</span>
                      </div>
                    </div>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: '13px', display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#888' }}>To</span>
                      <span style={{ background: '#e1e7f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Arsh</span>
                    </div>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee', fontSize: '13px', color: '#444' }}>
                      Coffee tomorrow?
                    </div>
                    <div style={{ minHeight: '120px', padding: '16px', fontSize: '14px', color: '#222' }}>
                      Hey arsh whats up? how about we go and get
                    </div>
                    <div style={{ padding: '12px 16px', background: '#fafafa', borderTop: '1px solid #eee' }}>
                      <button type="button" style={{ background: '#0b57d0', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '16px', fontWeight: 600 }}>
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CENTER FLOATING SPEECH PROMPT & KEYBOARD BADGES (Matches Screenshots 1, 2, 3) */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: currentScenario.app === 'gmail-compose' ? '54%' : '65%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                zIndex: 15,
                pointerEvents: 'none',
              }}
            >
              {/* Keyboard Shortcut Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentScenario.keys.map((k, i) => (
                  <kbd
                    key={i}
                    style={{
                      background: '#1c1b17',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxShadow: '0 3px 0 #000',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>

              {/* User Voice Pill (White capsule) */}
              {currentScenario.id !== 'darkmode-done' ? (
                <div
                  style={{
                    background: '#ffffff',
                    color: '#1c1b17',
                    padding: '14px 28px',
                    borderRadius: '30px',
                    boxShadow: '0 14px 36px rgba(0,0,0,0.22)',
                    fontSize: '16px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#888', fontWeight: 700 }}>YOU</span>
                  <span>{currentScenario.userSaid}</span>
                </div>
              ) : (
                /* Assistant Dark Mode Reply (Black capsule, matches Screenshot 3) */
                <div
                  style={{
                    background: '#111216',
                    color: '#ffffff',
                    padding: '14px 28px',
                    borderRadius: '30px',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                    fontSize: '16px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#8ED92F', fontWeight: 700 }}>HITODAMA</span>
                  <span>
                    Done. Dark mode's on, easier on the <strong style={{ color: '#fff' }}>eyes.</strong>
                  </span>
                </div>
              )}

              {/* Audio capsule below speech pill (Matches Screenshot 1) */}
              {currentScenario.app === 'gmail-compose' && (
                <div
                  style={{
                    background: '#1c1b17',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  {[0.4, 0.9, 1.4, 0.8, 1.2, 0.5].map((h, i) => (
                    <span
                      key={i}
                      style={{
                        width: '3px',
                        height: `${Math.round(h * 16)}px`,
                        background: '#5CB8FF',
                        borderRadius: '2px',
                        animation: `pulseWave ${0.5 + i * 0.1}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
