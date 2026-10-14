import React, { useState, useEffect, useRef } from 'react';
import { SOUL_SKINS, SoulConfig } from '../lib/soulMath';
import { SoulCanvas } from '../components/SoulCanvas';
import { queryGemini, cleanDictation } from '../lib/gemini';

declare global {
  interface Window {
    hitodamaAPI?: {
      setWindowMode: (mode: 'tucked' | 'collapsed' | 'listening' | 'media' | 'expanded', height?: number) => void;
      setWindowBounds: (width: number, height: number) => void;
      setExpanded: (expanded: boolean, height?: number) => void;
      minimize: () => void;
      close: () => void;
      openApp: (appName: string) => Promise<{ success: boolean; app?: string; error?: string }>;
      openUrl: (url: string) => Promise<{ success: boolean }>;
      typeText: (text: string) => Promise<{ success: boolean }>;
      captureScreen: () => Promise<{ success: boolean; image?: string; error?: string }>;
      toggleSystemDarkMode: () => Promise<{ success: boolean; isLight?: boolean }>;
      powerAction: (action: 'lock' | 'sleep' | 'restart' | 'shutdown') => Promise<{ success: boolean; error?: string }>;
      getSystemStats: () => Promise<any>;
      setWallpaper: (imagePath: string) => Promise<{ success: boolean }>;
      onTriggerLasso: (cb: () => void) => () => void;
      onTriggerDictation: (cb: () => void) => () => void;
    };
  }
}

type NavTab = 'Controls' | 'Today' | 'Stats' | 'Clipboard' | 'Apps' | 'Wallpaper' | 'Power';

// Wallpapers matching Screenshot 3
const WALLPAPERS = [
  {
    id: 1,
    title: 'Neon Aurora',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    title: 'Crimson Sky',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 3,
    title: 'Terrace Sunrise',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 4,
    title: 'Misty Mountains',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 5,
    title: 'Blue Horizon',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
  },
];

export const HitodamaApp: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && Boolean(window.hitodamaAPI);

  // Settings & Configuration
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('hitodama_gemini_key') || '');
  const [selectedSkinKey, setSelectedSkinKey] = useState<string>(() => localStorage.getItem('hitodama_skin') || 'flame_hitodama');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Dynamic Island UI States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('Controls');
  const [soulMode, setSoulMode] = useState<'LISTENING' | 'THINKING' | 'TALKING' | 'MUTED'>('LISTENING');

  // Media Player state (Screenshot 1 & Screenshot 4)
  const [isPlayingMedia, setIsPlayingMedia] = useState(true);
  const [mediaProgress, setMediaProgress] = useState(57); // seconds
  const [showMediaNotch, setShowMediaNotch] = useState(false); // compact media player notch mode

  // Controls Quick Toggles (Screenshot 4)
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [audioOutput, setAudioOutput] = useState('Speakers');
  const [nightLight, setNightLight] = useState(false);
  const [systemDarkMode, setSystemDarkMode] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(64);

  // Focus Timer state (Screenshot 2)
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [timerPreset, setTimerPreset] = useState<'1m' | '5m' | '10m' | '15m' | '20m'>('5m');
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // To-Do list state (Screenshot 2)
  const [todos, setTodos] = useState([
    { id: 1, text: 'Buy Hitodama!', completed: true },
  ]);
  const [newTodoInput, setNewTodoInput] = useState('');

  // Selected Day in "This week" (Screenshot 2)
  const [selectedDay, setSelectedDay] = useState(29);

  // Clipboard History state (Screenshot 3)
  const [clipboardCategory, setClipboardCategory] = useState<'All' | 'Text' | 'Images' | 'Links'>('All');
  const [clipboardItems, setClipboardItems] = useState([
    {
      id: 1,
      category: 'Text',
      preview: 'Hey Arsh, what’s up? How about we go get some coffee at 10 in the morning, and then hang out at the park for a bit?',
      label: 'Hey Arsh, what’s up? How about we go ge...',
      time: 'now',
      type: 'Text',
      size: '108 characters • 22 words • 1 line',
      copied: 'Today, 9:41 AM',
      icon: '≡',
      isToday: true,
    },
    {
      id: 2,
      category: 'Links',
      preview: 'https://www.amazon.in/s?k=red+boxing+gloves&ref=nb_sb_noss_2',
      label: 'https://www.amazon.in/s?k=red+boxing+...',
      time: '4m',
      type: 'Link',
      size: '59 characters • 1 word',
      copied: 'Today, 9:37 AM',
      icon: '🔗',
      isToday: true,
    },
    {
      id: 3,
      category: 'Text',
      preview: 'npm run dev -- --port 3000',
      label: 'npm run dev -- --port 3000',
      time: '1h',
      type: 'Code Snippet',
      size: '26 characters • 5 words',
      copied: 'Today, 8:41 AM',
      icon: '</>',
      isToday: true,
    },
    {
      id: 4,
      category: 'Images',
      preview: 'Image • 1920×1080 Screenshot PNG',
      label: 'Image • 1920×1080',
      time: '2h',
      type: 'Image PNG',
      size: '1920 × 1080 px • 1.2 MB',
      copied: 'Today, 7:41 AM',
      icon: '🖼️',
      isToday: true,
    },
    {
      id: 5,
      category: 'Text',
      preview: 'mainak@example.com',
      label: 'mainak@example.com',
      time: 'Pinned',
      type: 'Email Address',
      size: '18 characters',
      copied: 'Yesterday',
      icon: '📌',
      isPinned: true,
    },
  ]);
  const [selectedClipboardId, setSelectedClipboardId] = useState(1);
  const [clipboardSearch, setClipboardSearch] = useState('');

  // Wallpaper state (Screenshot 3)
  const [selectedWallpaperIndex, setSelectedWallpaperIndex] = useState(2);

  // Apps search state (Screenshot 4)
  const [appSearchQuery, setAppSearchQuery] = useState('');

  // Loadout Modal state (Screenshot 5)
  const [showLoadoutModal, setShowLoadoutModal] = useState(false);

  // Speed test state
  const [isSpeedTesting, setIsSpeedTesting] = useState(false);
  const [speedDownload, setSpeedDownload] = useState(85);
  const [speedUpload, setSpeedUpload] = useState(42);
  const [appsSortBy, setAppsSortBy] = useState<'RAM' | 'CPU'>('RAM');

  // Power action feedback
  const [powerFeedback, setPowerFeedback] = useState<string | null>(null);

  // Voice & Status States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastSpeech, setLastSpeech] = useState("I'm Hitodama. Give your computer a soul.");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // System telemetry stats
  const [systemStats, setSystemStats] = useState({
    cpu: { percent: 37, model: 'AMD Ryzen 7 7840HS', speed: '4.2 GHz', processes: 229 },
    gpu: { percent: 12, model: 'NVIDIA GeForce RTX 4060', vramUsed: '2.1', vramTotal: '8.0' },
    ram: { percent: 61, usedGb: '19.4', totalGb: '31.9', freeGb: '12.5' },
    disk: { usedGb: 412, totalGb: 931 },
    network: { down: '1.2 MB/s', up: '300 KB/s' },
    uptime: '5 h 12 m',
  });

  const recognitionRef = useRef<any>(null);
  const currentSoul: SoulConfig = SOUL_SKINS.find((s) => s.key === selectedSkinKey) || SOUL_SKINS[0];

  // Tab Heights based on screenshots
  const TAB_HEIGHTS: Record<NavTab, number> = {
    Controls: 396,
    Today: 420,
    Stats: 440,
    Clipboard: 446,
    Apps: 490,
    Wallpaper: 350,
    Power: 172,
  };

  const currentHeight = isExpanded
    ? TAB_HEIGHTS[activeTab]
    : showMediaNotch
    ? 78
    : statusMessage
    ? 58
    : isListening
    ? 48
    : 38;

  const currentWidth = isExpanded
    ? activeTab === 'Power'
      ? 680
      : 740
    : showMediaNotch
    ? 380
    : statusMessage
    ? 400
    : isListening
    ? 380
    : 280;

  // Enforce transparency in Electron
  useEffect(() => {
    if (isElectron) {
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    }
  }, [isElectron]);

  // Synchronize window bounds with Electron
  useEffect(() => {
    if (window.hitodamaAPI) {
      window.hitodamaAPI.setWindowBounds(currentWidth, currentHeight);
    }
  }, [isExpanded, activeTab, showMediaNotch, isListening, currentWidth, currentHeight]);

  // Timer interval countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Media playback ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlayingMedia) {
      interval = setInterval(() => {
        setMediaProgress((prev) => (prev >= 3735 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingMedia]);

  // Fetch real system telemetry if in Electron
  useEffect(() => {
    if (window.hitodamaAPI?.getSystemStats) {
      window.hitodamaAPI.getSystemStats().then((data) => {
        if (data) setSystemStats(data);
      });
      const interval = setInterval(async () => {
        try {
          const data = await window.hitodamaAPI?.getSystemStats();
          if (data) setSystemStats(data);
        } catch (_) {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isElectron]);

  const handlePowerAction = async (action: 'lock' | 'sleep' | 'restart' | 'shutdown') => {
    setPowerFeedback(`Executing ${action}...`);
    if (window.hitodamaAPI?.powerAction) {
      await window.hitodamaAPI.powerAction(action);
    }
    setTimeout(() => setPowerFeedback(null), 2500);
  };

  const handleRunSpeedTest = () => {
    if (isSpeedTesting) return;
    setIsSpeedTesting(true);
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      setSpeedDownload(Math.floor(70 + Math.random() * 30));
      setSpeedUpload(Math.floor(35 + Math.random() * 20));
      if (counter > 15) {
        clearInterval(interval);
        setSpeedDownload(85);
        setSpeedUpload(42);
        setIsSpeedTesting(false);
      }
    }, 150);
  };

  const handleLaunchApp = async (name: string) => {
    if (window.hitodamaAPI?.openApp) {
      await window.hitodamaAPI.openApp(name);
    }
  };

  const handleAddTodo = () => {
    if (!newTodoInput.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: newTodoInput.trim(), completed: false },
    ]);
    setNewTodoInput('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Keyboard shortcut listener for Win+A and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLoadoutModal) setShowLoadoutModal(false);
        else if (isExpanded) setIsExpanded(false);
        else if (statusMessage) setStatusMessage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, showLoadoutModal, statusMessage]);

  const toggleListening = () => {
    setIsListening((prev) => !prev);
  };

  // Global hotkeys hook from Electron (Screenshot 3 trigger)
  useEffect(() => {
    if (!window.hitodamaAPI) return;

    const unregLasso = window.hitodamaAPI.onTriggerLasso(async () => {
      const res = await window.hitodamaAPI?.captureScreen();
      if (!res?.success) {
        setStatusMessage('Could not capture screen.');
      } else {
        setStatusMessage('Screen captured. Analyzing...');
      }
    });

    const unregDictate = window.hitodamaAPI.onTriggerDictation(() => {
      setStatusMessage('Listening...');
      toggleListening();
    });

    return () => {
      unregLasso();
      unregDictate();
    };
  }, []);

  // Symmetrical SVG Bezier path generator for the seamless top notch
  const generateNotchPath = (w: number, h: number) => {
    if (w <= 300) {
      // Collapsed hardware notch: 280 x 38
      return `M 0 0 C 16 0 22 8 22 18 L 22 22 C 22 30 28 34 36 34 L 244 34 C 252 34 258 30 258 22 L 258 18 C 258 8 264 0 280 0 Z`;
    }
    if (w <= 420) {
      // Media or listening notch: 380 x 78
      const cornerR = 24;
      return `M 0 0 C 18 0 24 10 24 22 L 24 ${h - cornerR} C 24 ${h - 8} 34 ${h} 46 ${h} L ${w - 46} ${h} C ${w - 34} ${h} ${w - 24} ${h - 8} ${w - 24} ${h - cornerR} L ${w - 24} 22 C ${w - 24} 10 ${w - 18} 0 ${w} 0 Z`;
    }
    // Expanded Island Menu: 740 x H
    const shoulderR = 24;
    const cornerR = 28;
    return `M 0 0 C 18 0 26 10 26 ${shoulderR} L 26 ${h - cornerR} C 26 ${h - 8} 36 ${h} 50 ${h} L ${w - 50} ${h} C ${w - 36} ${h} ${w - 26} ${h - 8} ${w - 26} ${h - cornerR} L ${w - 26} ${shoulderR} C ${w - 26} 10 ${w - 18} 0 ${w} 0 Z`;
  };

  // Circular gauge helper for Stats tab
  const renderCircleGauge = (
    pct: number,
    color: string,
    title: string,
    subtitle: string,
    badges: string[]
  ) => {
    const size = 96;
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '20px 16px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            {pct}%
          </div>
        </div>

        <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
          {title}
        </div>
        <div style={{ fontSize: '11px', color: '#888892', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
          {subtitle}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
          {badges.map((b, i) => (
            <span
              key={i}
              style={{
                fontSize: '11px',
                color: '#d4d4d8',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 500,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const selectedClip = clipboardItems.find((c) => c.id === selectedClipboardId) || clipboardItems[0];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: isElectron
          ? 'transparent'
          : `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("${WALLPAPERS[selectedWallpaperIndex].url}") center/cover no-repeat`,
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 0,
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* 
        =======================================================================
        DYNAMIC ISLAND HARDWARE NOTCH CONTAINER
        Strictly centered horizontally at top: 0
        =======================================================================
      */}
      <div
        style={{
          width: `${currentWidth}px`,
          height: `${currentHeight}px`,
          position: 'relative',
          transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1), height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          filter: isExpanded
            ? 'drop-shadow(0 28px 60px rgba(0, 0, 0, 0.8))'
            : 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.5))',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* SVG Liquid Notch / Island Shell */}
        <svg
          width={currentWidth}
          height={currentHeight}
          viewBox={`0 0 ${currentWidth} ${currentHeight}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <defs>
            <linearGradient id="islandDarkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111114" />
              <stop offset="100%" stopColor="#08080a" />
            </linearGradient>
          </defs>
          <path
            d={generateNotchPath(currentWidth, currentHeight)}
            fill="url(#islandDarkGrad)"
            stroke={isHovered ? 'rgba(245, 183, 70, 0.35)' : 'rgba(255, 255, 255, 0.12)'}
            strokeWidth="1"
            style={{ transition: 'stroke 0.3s ease' }}
          />
        </svg>

        {/* 
          ---------------------------------------------------------------------
          STATE 1: IDLE COLLAPSED NOTCH (When not interacting)
          Exact hardware notch flush with top monitor bezel
          ---------------------------------------------------------------------
        */}
        {!isExpanded && !showMediaNotch && !statusMessage && !isListening && (
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '0 24px',
              boxSizing: 'border-box',
            }}
            onClick={() => setIsExpanded(true)}
            onDoubleClick={() => setShowMediaNotch(true)}
            title="Click to open Hitodama Island (Double-click for Media Notch)"
          >
            <div
              style={{
                width: '40px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <SoulCanvas
                soul={currentSoul}
                width={40}
                height={28}
                scale={0.58}
                mode={soulMode}
                interactive={true}
              />
            </div>
          </div>
        )}

        {/* 
          ---------------------------------------------------------------------
          STATE 1.5: STATUS / ACTION ISLAND NOTCH (Screenshot 3: media_1791933758760)
          Soul on left + "HITODAMA 人魂 / Subtitle" + Action pill on right
          ---------------------------------------------------------------------
        */}
        {!isExpanded && !showMediaNotch && statusMessage && (
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              height: '58px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 20px 10px 20px',
              boxSizing: 'border-box',
            }}
          >
            {/* Left: Soul */}
            <div style={{ width: '48px', height: '38px', flexShrink: 0 }}>
              <SoulCanvas soul={currentSoul} width={48} height={38} scale={0.72} mode={soulMode} />
            </div>

            {/* Center: HITODAMA 人魂 + Message */}
            <div style={{ flex: 1, margin: '0 14px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                  HITODAMA
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#8ed92f' }}>
                  人魂
                </span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#a1a1aa',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {statusMessage}
              </div>
            </div>

            {/* Right: Dark Action Capsule with Pin, Dropdown, Close */}
            <div
              style={{
                background: '#1d1e23',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setStatusMessage(null)}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '12px' }}
                title="Hold / Pin"
              >
                📌
              </button>
              <button
                onClick={() => {
                  setIsExpanded(true);
                  setStatusMessage(null);
                }}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '10px' }}
                title="Expand to Full Island"
              >
                ▼
              </button>
              <button
                onClick={() => setStatusMessage(null)}
                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '12px' }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 
          ---------------------------------------------------------------------
          STATE 2: COMPACT MEDIA PLAYER NOTCH (Screenshot 1: media_1791933261138)
          Album art, track info, progress bar, playback controls
          ---------------------------------------------------------------------
        */}
        {!isExpanded && showMediaNotch && (
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              height: '78px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 24px 14px 24px',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
            onClick={() => setIsExpanded(true)}
          >
            {/* Left: Album cover */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
                flexShrink: 0,
              }}
            />

            {/* Center: Track title, subtitle, progress bar */}
            <div style={{ flex: 1, margin: '0 16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                lofi beats to study and relax
              </div>
              <div style={{ fontSize: '10px', color: '#888892' }}>lofi radio</div>

              {/* Progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '9px', color: '#71717a' }}>{formatTime(mediaProgress)}</span>
                <div style={{ flex: 1, height: '2px', background: '#27272a', borderRadius: '1px', position: 'relative' }}>
                  <div
                    style={{
                      width: `${(mediaProgress / 3735) * 100}%`,
                      height: '100%',
                      background: '#dca33e',
                      position: 'relative',
                    }}
                  >
                    <div style={{ position: 'absolute', right: '-3px', top: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
                  </div>
                </div>
                <span style={{ fontSize: '9px', color: '#71717a' }}>62:15</span>
              </div>
            </div>

            {/* Right: Controls */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMediaProgress(0)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '13px' }}
              >
                ⏮
              </button>
              <button
                onClick={() => setIsPlayingMedia((prev) => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {isPlayingMedia ? '❚❚' : '▶'}
              </button>
              <button
                onClick={() => setMediaProgress((prev) => prev + 30)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '13px' }}
              >
                ⏭
              </button>
              <button
                onClick={() => setShowMediaNotch(false)}
                title="Collapse"
                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 
          ---------------------------------------------------------------------
          STATE 3: LISTENING NOTCH
          Soul on left + cyan voice waveform on right
          ---------------------------------------------------------------------
        */}
        {!isExpanded && !showMediaNotch && isListening && (
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 32px',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
            onClick={() => setIsExpanded(true)}
          >
            <div style={{ width: '40px', height: '30px' }}>
              <SoulCanvas soul={currentSoul} width={40} height={30} scale={0.65} mode="LISTENING" interactive={true} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {[8, 16, 24, 14, 20, 10, 18, 6].map((h, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    width: '3px',
                    height: `${h}px`,
                    background: '#5cb8ff',
                    borderRadius: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 
          ---------------------------------------------------------------------
          STATE 4: FULL EXPANDED DYNAMIC ISLAND (7 TABS)
          ---------------------------------------------------------------------
        */}
        {isExpanded && (
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 28px 20px 28px',
              boxSizing: 'border-box',
              color: '#ffffff',
            }}
          >
            {/* TOP NAVIGATION BAR: 7 Tabs matching Screenshots */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '32px',
                marginBottom: '16px',
              }}
            >
              {(['Controls', 'Today', 'Stats', 'Clipboard', 'Apps', 'Wallpaper', 'Power'] as NavTab[]).map(
                (tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: isActive ? '#2d2212' : 'transparent',
                        color: isActive ? '#f5b746' : '#7b7b84',
                        border: isActive ? '1px solid rgba(245, 183, 70, 0.25)' : '1px solid transparent',
                        padding: '4px 14px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: isActive ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        outline: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.color = '#7b7b84';
                      }}
                    >
                      {tab}
                    </button>
                  );
                }
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse"
                style={{
                  position: 'absolute',
                  right: '24px',
                  background: 'transparent',
                  border: 'none',
                  color: '#666670',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* 
              =================================================================
              TAB 1: CONTROLS VIEW (Exact match to Screenshot 4: media_1791933261170)
              Wi-Fi, Bluetooth, Audio | Night Light, Dark Mode | Volume | Media Player
              =================================================================
            */}
            {activeTab === 'Controls' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {/* Row 1: Wi-Fi, Bluetooth, Audio (3 items) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {/* Wi-Fi */}
                  <button
                    onClick={() => setWifiEnabled(!wifiEnabled)}
                    style={{
                      background: wifiEnabled ? '#dca33e' : '#1e1e22',
                      color: wifiEnabled ? '#18150c' : '#ffffff',
                      border: wifiEnabled ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '15px' }}>📶</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>Wi-Fi</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>{wifiEnabled ? 'Home 5G' : 'Off'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>˅</span>
                  </button>

                  {/* Bluetooth */}
                  <button
                    onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                    style={{
                      background: bluetoothEnabled ? '#dca33e' : '#1e1e22',
                      color: bluetoothEnabled ? '#18150c' : '#ffffff',
                      border: bluetoothEnabled ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '15px' }}>ᛒ</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>Bluetooth</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>{bluetoothEnabled ? 'On' : 'Off'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>˅</span>
                  </button>

                  {/* Audio */}
                  <button
                    onClick={() => setAudioOutput(audioOutput === 'Speakers' ? 'Headphones' : 'Speakers')}
                    style={{
                      background: '#dca33e',
                      color: '#18150c',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '15px' }}>🔊</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>Audio</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>{audioOutput}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>˅</span>
                  </button>
                </div>

                {/* Row 2: Night Light & Dark Mode (2 items) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Night Light */}
                  <button
                    onClick={() => setNightLight(!nightLight)}
                    style={{
                      background: nightLight ? '#dca33e' : '#1e1e22',
                      color: nightLight ? '#18150c' : '#ffffff',
                      border: nightLight ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '15px' }}>🌙</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>Night Light</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>{nightLight ? 'On' : 'Off'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>˅</span>
                  </button>

                  {/* Dark Mode */}
                  <button
                    onClick={async () => {
                      setSystemDarkMode(!systemDarkMode);
                      if (window.hitodamaAPI) await window.hitodamaAPI.toggleSystemDarkMode();
                    }}
                    style={{
                      background: systemDarkMode ? '#dca33e' : '#1e1e22',
                      color: systemDarkMode ? '#18150c' : '#ffffff',
                      border: systemDarkMode ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '15px' }}>◐</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>Dark mode</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>{systemDarkMode ? 'On' : 'Off'}</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Row 3: Volume Slider Card */}
                <div
                  style={{
                    background: '#1e1e22',
                    borderRadius: '14px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#a1a1aa' }}>🔊</span>
                  <div
                    style={{
                      flex: 1,
                      height: '24px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const pct = Math.round((clickX / rect.width) * 100);
                      setVolumeLevel(Math.min(100, Math.max(0, pct)));
                    }}
                  >
                    <div
                      style={{
                        width: `${volumeLevel}%`,
                        height: '100%',
                        background: '#dca33e',
                        borderRadius: '12px',
                        transition: 'width 0.1s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', minWidth: '34px', textAlign: 'right' }}>
                    {volumeLevel}%
                  </span>
                </div>

                {/* Row 4: Media Player Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '12px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#888892', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔊</span> Speakers
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Album Art */}
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
                        flexShrink: 0,
                      }}
                    />

                    {/* Track info & scrub */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        lofi beats to study and relax
                      </div>
                      <div style={{ fontSize: '11px', color: '#888892' }}>lofi radio</div>

                      {/* Scrub line */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#71717a' }}>{formatTime(mediaProgress)}</span>
                        <div style={{ flex: 1, height: '3px', background: '#27272a', borderRadius: '2px', position: 'relative' }}>
                          <div style={{ width: `${(mediaProgress / 3735) * 100}%`, height: '100%', background: '#dca33e' }} />
                        </div>
                        <span style={{ fontSize: '10px', color: '#71717a' }}>62:15</span>
                      </div>
                    </div>

                    {/* Media Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => setMediaProgress(0)}
                        style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '14px' }}
                      >
                        ⏮
                      </button>
                      <button
                        onClick={() => setIsPlayingMedia(!isPlayingMedia)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#fef3c7',
                          border: 'none',
                          color: '#1c1917',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 800,
                        }}
                      >
                        {isPlayingMedia ? '❚❚' : '▶'}
                      </button>
                      <button
                        onClick={() => setMediaProgress((prev) => prev + 30)}
                        style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '14px' }}
                      >
                        ⏭
                      </button>
                    </div>
                  </div>
                </div>

                {/* Soul Loadout Trigger Pill */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <button
                    onClick={() => setShowLoadoutModal(true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#dca33e',
                      borderRadius: '999px',
                      padding: '4px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>✨</span> Shape Soul Loadout
                  </button>
                </div>
              </div>
            )}

            {/* 
              =================================================================
              TAB 2: TODAY VIEW (Exact match to Screenshot 2: media_1791933261144)
              Clock & Weather | This Week & Focus Timer | To-Do Checklist
              =================================================================
            */}
            {activeTab === 'Today' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '130px 1.4fr 1.15fr',
                  gap: '14px',
                  flex: 1,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {/* Col 1: Clock & Weather */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Clock Card */}
                  <div
                    style={{
                      background: '#18181b',
                      borderRadius: '18px',
                      padding: '18px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ fontSize: '38px', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-1px' }}>09</div>
                    <div style={{ color: '#dca33e', fontSize: '18px', letterSpacing: '4px', margin: '4px 0' }}>•••</div>
                    <div style={{ fontSize: '38px', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-1px' }}>41</div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '10px', fontWeight: 500 }}>
                      AM · Tue 29
                    </div>
                  </div>

                  {/* Weather Card */}
                  <div
                    style={{
                      background: '#18181b',
                      borderRadius: '18px',
                      padding: '16px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      flex: 1,
                    }}
                  >
                    <span style={{ fontSize: '20px', color: '#eab308' }}>☼</span>
                    <div style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 2px 0' }}>32°C</div>
                    <div style={{ fontSize: '11px', color: '#888892' }}>Mostly clear</div>
                  </div>
                </div>

                {/* Col 2: This Week & Focus Timer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* This Week Card */}
                  <div
                    style={{
                      background: '#18181b',
                      borderRadius: '18px',
                      padding: '14px 16px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>This week</span>
                      <span style={{ fontSize: '10px', color: '#71717a' }}>Sep 28 – Oct 4</span>
                    </div>

                    {/* 7 Days Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
                      {[
                        { day: 'Mon', num: 28 },
                        { day: 'Tue', num: 29 },
                        { day: 'Wed', num: 30 },
                        { day: 'Thu', num: 1 },
                        { day: 'Fri', num: 2 },
                        { day: 'Sat', num: 3 },
                        { day: 'Sun', num: 4 },
                      ].map((item) => {
                        const isSelected = selectedDay === item.num;
                        return (
                          <div
                            key={item.num}
                            onClick={() => setSelectedDay(item.num)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                          >
                            <span style={{ fontSize: '9px', color: '#71717a' }}>{item.day}</span>
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: isSelected ? '#dca33e' : 'transparent',
                                color: isSelected ? '#18150c' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              {item.num}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Next Event Card */}
                    <div
                      style={{
                        background: '#232328',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div style={{ width: '3px', height: '24px', borderRadius: '2px', background: '#ec4899' }} />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700 }}>Next • 11:00 AM</div>
                        <div style={{ fontSize: '10px', color: '#888892' }}>Daily AI news research</div>
                      </div>
                    </div>
                  </div>

                  {/* Focus Timer Card */}
                  <div
                    style={{
                      background: '#18181b',
                      borderRadius: '18px',
                      padding: '14px 16px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      flex: 1,
                    }}
                  >
                    {/* Ring Countdown */}
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        border: '4px solid #dca33e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(timerSeconds)}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#a1a1aa' }}>
                        <span>
                          <strong style={{ color: '#fff', fontSize: '14px' }}>0</strong> h
                        </span>
                        <span>
                          <strong style={{ color: '#fff', fontSize: '14px' }}>
                            {Math.floor(timerSeconds / 60) < 10 ? '0' : ''}
                            {Math.floor(timerSeconds / 60)}
                          </strong>{' '}
                          min
                        </span>
                      </div>

                      {/* Presets */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(['1m', '5m', '10m', '15m', '20m'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => {
                              setTimerPreset(p);
                              const mins = parseInt(p);
                              setTimerSeconds(mins * 60);
                              setIsTimerRunning(false);
                            }}
                            style={{
                              background: timerPreset === p ? '#dca33e' : '#27272a',
                              color: timerPreset === p ? '#18150c' : '#d4d4d8',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '2px 7px',
                              fontSize: '10px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                        <button
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          style={{
                            background: '#dca33e',
                            color: '#18150c',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '4px 16px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isTimerRunning ? 'Pause' : 'Start'}
                        </button>
                        <button
                          onClick={() => {
                            setIsTimerRunning(false);
                            setTimerSeconds(300);
                          }}
                          style={{
                            background: '#27272a',
                            color: '#d4d4d8',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 3: To-Do Checklist */}
                <div
                  style={{
                    background: '#18181b',
                    borderRadius: '18px',
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>Today</span>
                        <span style={{ fontSize: '11px', color: '#fb923c', fontWeight: 700 }}>+4</span>
                      </div>
                      <span
                        style={{
                          background: '#27272a',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '10px',
                          color: '#a1a1aa',
                        }}
                      >
                        {todos.filter((t) => t.completed).length}/{todos.length}
                      </span>
                    </div>

                    {/* Todos list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {todos.map((todo) => (
                        <div
                          key={todo.id}
                          onClick={() => {
                            setTodos((prev) =>
                              prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
                            );
                          }}
                          style={{
                            background: '#232328',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: todo.completed ? '#22c55e' : 'transparent',
                              border: todo.completed ? 'none' : '1px solid #71717a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: '#fff',
                            }}
                          >
                            {todo.completed ? '✔' : ''}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              color: todo.completed ? '#71717a' : '#ffffff',
                              textDecoration: todo.completed ? 'line-through' : 'none',
                            }}
                          >
                            {todo.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add To-Do Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                    <input
                      type="text"
                      placeholder="+ Add a to-do..."
                      value={newTodoInput}
                      onChange={(e) => setNewTodoInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                      style={{
                        flex: 1,
                        background: '#232328',
                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '11px',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleAddTodo}
                      style={{
                        background: '#dca33e',
                        color: '#18150c',
                        border: 'none',
                        borderRadius: '10px',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      ➔
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 
              =================================================================
              TAB 3: STATS VIEW (Exact match to Screenshot 2 from previous batch)
              =================================================================
            */}
            {activeTab === 'Stats' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.45fr 1fr',
                  gap: '16px',
                  flex: 1,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {renderCircleGauge(
                      systemStats.cpu.percent,
                      '#eab308',
                      'CPU',
                      systemStats.cpu.model,
                      [systemStats.cpu.speed, `${systemStats.cpu.processes} proc`]
                    )}
                    {renderCircleGauge(
                      systemStats.gpu.percent,
                      '#c084fc',
                      'GPU',
                      systemStats.gpu.model,
                      [`${systemStats.gpu.vramUsed} / ${systemStats.gpu.vramTotal} GB`]
                    )}
                    {renderCircleGauge(
                      systemStats.ram.percent,
                      '#4ade80',
                      'RAM',
                      `${systemStats.ram.usedGb} / ${systemStats.ram.totalGb} GB`,
                      [`${systemStats.ram.freeGb} GB free`]
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '10px', color: '#888892', fontWeight: 700 }}>DISK C:</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
                        {systemStats.disk.usedGb} / {systemStats.disk.totalGb} GB
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '10px', color: '#888892', fontWeight: 700 }}>NETWORK</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
                        ↓ {systemStats.network.down} ↑ {systemStats.network.up}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '10px', color: '#888892', fontWeight: 700 }}>UP FOR</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
                        {systemStats.uptime}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa' }}>Top apps · {appsSortBy}</span>
                      <button
                        onClick={() => setAppsSortBy((prev) => (prev === 'RAM' ? 'CPU' : 'RAM'))}
                        style={{ background: 'transparent', border: 'none', color: '#eab308', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {appsSortBy === 'RAM' ? 'CPU ⇄' : 'RAM ⇄'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {[
                        { name: 'Google Chrome', icon: 'G', usage: '1.4 GB', width: '85%' },
                        { name: 'Visual Studio Code', icon: 'V', usage: '820 MB', width: '55%' },
                        { name: 'Spotify', icon: 'S', usage: '410 MB', width: '35%' },
                        { name: 'Discord', icon: 'D', usage: '300 MB', width: '25%' },
                      ].map((app, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                          <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#232328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                            {app.icon}
                          </span>
                          <span style={{ width: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</span>
                          <div style={{ flex: 1, height: '3px', background: '#232328', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: app.width, height: '100%', background: '#84cc16' }} />
                          </div>
                          <span style={{ color: '#888892', fontSize: '10px', width: '45px', textAlign: 'right' }}>{app.usage}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa' }}>Internet speed</span>
                      <span style={{ fontSize: '10px', color: '#71717a' }}>last: 5 min ago • Mumbai</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', margin: '8px 0' }}>
                      <div>
                        <span style={{ fontSize: '22px', fontWeight: 800 }}>{speedDownload}</span> <span style={{ fontSize: '11px', color: '#888892' }}>Mbps ↓</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '22px', fontWeight: 800 }}>{speedUpload}</span> <span style={{ fontSize: '11px', color: '#888892' }}>Mbps ↑</span>
                      </div>
                    </div>
                    <button
                      onClick={handleRunSpeedTest}
                      disabled={isSpeedTesting}
                      style={{ background: '#dca33e', color: '#16140b', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <span>▶</span>
                      <span>{isSpeedTesting ? 'Testing connection...' : 'Run speed test'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 
              =================================================================
              TAB 4: CLIPBOARD VIEW (Exact match to Screenshot 3: media_1791933261155)
              Search & Filters | Split Items List & Rich Preview | Action Toolbar
              =================================================================
            */}
            {activeTab === 'Clipboard' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '13px', color: '#71717a' }}>🔍</span>
                    <input
                      type="text"
                      placeholder="Search 23 items..."
                      value={clipboardSearch}
                      onChange={(e) => setClipboardSearch(e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '12px', outline: 'none', flex: 1 }}
                    />
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {(['All', 'Text', 'Images', 'Links'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setClipboardCategory(cat)}
                        style={{
                          background: clipboardCategory === cat ? '#dca33e' : '#1e1e22',
                          color: clipboardCategory === cat ? '#18150c' : '#a1a1aa',
                          border: 'none',
                          borderRadius: '999px',
                          padding: '3px 12px',
                          fontSize: '11px',
                          fontWeight: clipboardCategory === cat ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                    <button style={{ background: '#1e1e22', border: 'none', color: '#a1a1aa', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}>
                      ⚙
                    </button>
                  </div>
                </div>

                {/* Main Split: Left Items List & Right Preview Panel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '14px', flex: 1 }}>
                  {/* Left List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '250px' }}>
                    {/* PINNED */}
                    <div>
                      <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>
                        PINNED
                      </div>
                      <div
                        onClick={() => setSelectedClipboardId(5)}
                        style={{
                          background: selectedClipboardId === 5 ? 'rgba(220, 163, 62, 0.15)' : 'transparent',
                          border: selectedClipboardId === 5 ? '1px solid rgba(220, 163, 62, 0.3)' : '1px solid transparent',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '11px' }}>📌</span>
                        <span style={{ fontSize: '11px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          mainak@example.com
                        </span>
                      </div>
                    </div>

                    {/* TODAY */}
                    <div>
                      <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>
                        TODAY
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {clipboardItems
                          .filter((i) => i.isToday)
                          .map((item) => {
                            const isSelected = selectedClipboardId === item.id;
                            return (
                              <div
                                key={item.id}
                                onClick={() => setSelectedClipboardId(item.id)}
                                style={{
                                  background: isSelected ? 'rgba(220, 163, 62, 0.15)' : 'transparent',
                                  border: isSelected ? '1px solid rgba(220, 163, 62, 0.3)' : '1px solid transparent',
                                  borderRadius: '8px',
                                  padding: '7px 10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                  <span style={{ fontSize: '11px' }}>{item.icon}</span>
                                  <span style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.label}
                                  </span>
                                </div>
                                <span style={{ fontSize: '10px', color: '#71717a', marginLeft: '6px' }}>{item.time}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Right Preview Card */}
                  <div
                    style={{
                      background: '#151518',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#f4f4f5', fontWeight: 600 }}>
                      {selectedClip.preview}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a' }}>
                        <span>Type</span> <strong style={{ color: '#d4d4d8' }}>{selectedClip.type}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a' }}>
                        <span>Size</span> <strong style={{ color: '#d4d4d8' }}>{selectedClip.size}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a' }}>
                        <span>Copied</span> <strong style={{ color: '#d4d4d8' }}>{selectedClip.copied}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedClip.preview);
                        setLastSpeech('Pasted snippet!');
                      }}
                      style={{ background: '#27272a', border: 'none', color: '#fff', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer' }}
                    >
                      ↵ Paste
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedClip.preview);
                        setLastSpeech('Copied to clipboard');
                      }}
                      style={{ background: '#27272a', border: 'none', color: '#fff', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer' }}
                    >
                      Ctrl C Copy
                    </button>
                    <button style={{ background: '#27272a', border: 'none', color: '#fff', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer' }}>
                      Ctrl P Pin
                    </button>
                    <button style={{ background: '#27272a', border: 'none', color: '#ef4444', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer' }}>
                      Del Remove
                    </button>
                  </div>
                  <div style={{ fontSize: '10px', color: '#71717a' }}>
                    ↑↓ Move • Ctrl/Shift pick several • Tab Filter
                  </div>
                </div>
              </div>
            )}

            {/* 
              =================================================================
              TAB 5: APPS VIEW (Exact match to Screenshot 4 from previous batch)
              =================================================================
            */}
            {activeTab === 'Apps' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, animation: 'fadeIn 0.2s ease', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#18181b', borderRadius: '12px', padding: '8px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '13px', marginRight: '8px', color: '#71717a' }}>🔍</span>
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="Search apps, files and snippets..."
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '13px', outline: 'none', flex: 1 }}
                  />
                  <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>Win+A</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleLaunchApp('gmail')} style={{ background: '#1d1d21', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '999px', padding: '3px 12px', fontSize: '11px', color: '#e4e4e7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#eab308' }}>⚡</span> gmail
                  </button>
                  <button onClick={() => handleLaunchApp('gta 5')} style={{ background: '#1d1d21', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '999px', padding: '3px 12px', fontSize: '11px', color: '#e4e4e7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#eab308' }}>⚡</span> Gta 5
                  </button>
                </div>

                {/* STARRED */}
                <div>
                  <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>STARRED</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {[
                      { name: 'Spotify', key: 'S', tag: 'Open', hasStar: true, isHighlighted: true },
                      { name: 'Visual Studio Code', key: 'V', tag: 'Application', hasStar: true, isHighlighted: false },
                    ].map((item, i) => (
                      <div
                        key={i}
                        onClick={() => handleLaunchApp(item.name)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: '8px', background: item.isHighlighted ? 'rgba(234, 179, 8, 0.08)' : 'transparent', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#232328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{item.key}</span>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: '#9ca3af' }}>{item.tag}</span>
                          <span style={{ color: '#eab308', fontSize: '12px' }}>★</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RECENT */}
                <div>
                  <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>RECENT</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {[
                      { name: 'Google Chrome', key: 'G', tag: 'Application' },
                      { name: 'Discord', key: 'D', tag: 'Application' },
                      { name: 'File Explorer', key: 'F', tag: 'Application' },
                    ].map((item, i) => (
                      <div key={i} onClick={() => handleLaunchApp(item.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#232328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{item.key}</span>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{item.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* APPLICATIONS */}
                <div>
                  <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>APPLICATIONS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {[
                      { name: 'Minecraft', key: 'M', tag: 'Game' },
                      { name: 'Valorant', key: 'V', tag: 'Game' },
                      { name: 'Calculator', key: 'C', tag: 'Application' },
                      { name: 'Canva', key: 'C', tag: 'Application' },
                    ].map((item, i) => (
                      <div key={i} onClick={() => handleLaunchApp(item.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#232328', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{item.key}</span>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{item.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 
              =================================================================
              TAB 6: WALLPAPER VIEW (Exact match to Screenshot 3 from previous batch)
              =================================================================
            */}
            {activeTab === 'Wallpaper' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, animation: 'fadeIn 0.2s ease', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button style={{ background: '#dca33e', color: '#18150c', border: 'none', borderRadius: '999px', padding: '4px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Recent</button>
                    <button style={{ background: '#1d1d21', color: '#a1a1aa', border: 'none', borderRadius: '999px', padding: '4px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>My folder</button>
                    <span style={{ fontSize: '11px', color: '#71717a', marginLeft: '6px' }}>5 pictures</span>
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#1d1d21', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', cursor: 'pointer' }}>📁</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', perspective: '1000px', margin: '18px 0', height: '180px' }}>
                  {WALLPAPERS.map((wp, index) => {
                    const isSelected = selectedWallpaperIndex === index;
                    let transform = 'scale(0.85)';
                    if (index < 2) {
                      transform = `perspective(800px) rotateY(${16 - index * 6}deg) scale(${0.8 + index * 0.08})`;
                    } else if (index === 2) {
                      transform = 'perspective(800px) scale(1.08)';
                    } else {
                      transform = `perspective(800px) rotateY(-${10 + (index - 3) * 6}deg) scale(${0.96 - (index - 2) * 0.08})`;
                    }

                    return (
                      <div
                        key={wp.id}
                        onClick={() => setSelectedWallpaperIndex(index)}
                        style={{
                          width: isSelected ? '220px' : '90px',
                          height: isSelected ? '150px' : '135px',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          backgroundImage: `url(${wp.thumb})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          boxShadow: isSelected ? '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 2px #dca33e' : '0 8px 20px rgba(0, 0, 0, 0.4)',
                          cursor: 'pointer',
                          transform,
                          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                          flexShrink: 0,
                        }}
                      />
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: '#1d1d21', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    Scroll ↑
                  </div>
                </div>
              </div>
            )}

            {/* 
              =================================================================
              TAB 7: POWER VIEW (Exact match to Screenshot 5 from previous batch)
              =================================================================
            */}
            {activeTab === 'Power' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, animation: 'fadeIn 0.2s ease', justifyContent: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <button onClick={() => handlePowerAction('lock')} style={{ background: '#18181b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', height: '84px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#ffffff' }}>
                    <span style={{ fontSize: '18px' }}>🔒</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Lock</span>
                  </button>
                  <button onClick={() => handlePowerAction('sleep')} style={{ background: '#18181b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', height: '84px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#ffffff' }}>
                    <span style={{ fontSize: '18px' }}>🌙</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Sleep</span>
                  </button>
                  <button onClick={() => handlePowerAction('restart')} style={{ background: '#18181b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', height: '84px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#ffffff' }}>
                    <span style={{ fontSize: '18px' }}>↻</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Restart</span>
                  </button>
                  <button onClick={() => handlePowerAction('shutdown')} style={{ background: '#18181b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', height: '84px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#ffffff' }}>
                    <span style={{ fontSize: '18px' }}>⏻</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Shut down</span>
                  </button>
                </div>
                {powerFeedback && (
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#eab308', marginTop: '4px' }}>
                    {powerFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 
        =======================================================================
        SOUL LOADOUT MIND-MAP MODAL (Screenshot 5: media_1791933261231)
        Central portal + 4 radial nodes connected with curved cables
        =======================================================================
      */}
      {showLoadoutModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.25s ease',
          }}
          onClick={() => setShowLoadoutModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '640px',
              height: '460px',
              background: '#1c1b1e',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              boxShadow: '0 32px 80px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 28px',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Title Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>💧</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Hitodama</span>
              </div>
              <button
                onClick={() => setShowLoadoutModal(false)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '12px' }}>
              Loadout
            </div>

            {/* Mind Map Area with Curved Cable Connectors */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Connecting Curved Lines SVG */}
              <svg
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
              >
                {/* Node 1: Top-Left to Center */}
                <path d="M 230 115 C 270 120, 270 160, 292 165" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
                {/* Node 2: Bottom-Left to Center */}
                <path d="M 230 215 C 270 210, 270 170, 292 165" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
                {/* Node 3: Top-Right to Center */}
                <path d="M 355 115 C 320 120, 320 160, 292 165" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
                {/* Node 4: Bottom-Right to Center */}
                <path d="M 355 215 C 320 210, 320 170, 292 165" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
              </svg>

              {/* Central Glowing Soul Portal */}
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(92, 184, 255, 0.25) 0%, rgba(20, 25, 35, 0.8) 70%)',
                  boxShadow: '0 0 32px rgba(92, 184, 255, 0.35)',
                  border: '2px solid rgba(92, 184, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <SoulCanvas soul={currentSoul} width={64} height={52} scale={0.9} mode="LISTENING" />
              </div>

              {/* Node 1: Top-Left (Soul) */}
              <div
                style={{
                  position: 'absolute',
                  top: '85px',
                  left: '120px',
                  background: '#23252b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                <span style={{ fontSize: '14px' }}>✨</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>Hitodama</div>
                  <div style={{ fontSize: '9px', color: '#888892' }}>Soul</div>
                </div>
              </div>

              {/* Node 2: Bottom-Left (Abilities) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '65px',
                  left: '120px',
                  background: '#23252b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                <span style={{ fontSize: '14px' }}>🚀</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>—</div>
                  <div style={{ fontSize: '9px', color: '#888892' }}>Abilities</div>
                </div>
              </div>

              {/* Node 3: Top-Right (Personality) */}
              <div
                style={{
                  position: 'absolute',
                  top: '85px',
                  right: '120px',
                  background: '#23252b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                <span style={{ fontSize: '14px' }}>☻</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>True Chad</div>
                  <div style={{ fontSize: '9px', color: '#888892' }}>Personality</div>
                </div>
              </div>

              {/* Node 4: Bottom-Right (Voice) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '65px',
                  right: '120px',
                  background: '#23252b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                <span style={{ fontSize: '14px' }}>🕪</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>Charon</div>
                  <div style={{ fontSize: '9px', color: '#888892' }}>Voice</div>
                </div>
              </div>
            </div>

            {/* Floating Bottom Navigation Pill Dock */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <div
                style={{
                  background: '#23252b',
                  borderRadius: '999px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 10px', fontSize: '13px', cursor: 'pointer' }}>🏠</button>
                <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 10px', fontSize: '13px', cursor: 'pointer' }}>🔗</button>
                <button
                  style={{
                    background: '#323238',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  💧 Soul
                </button>
                <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 10px', fontSize: '13px', cursor: 'pointer' }}>A</button>
                <button style={{ background: 'transparent', border: 'none', color: '#888', padding: '6px 10px', fontSize: '13px', cursor: 'pointer' }}>⚙</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
