import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import { SOUL_SKINS, SoulConfig } from '../lib/soulMath';
import { SoulCanvas } from '../components/SoulCanvas';
import { queryGemini, cleanDictation } from '../lib/gemini';
import { CompanionShaderBackdrop } from './components/CompanionShaderBackdrop';
import './desktop-companion.css';

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

interface ClipboardItem {
  id: number;
  category: 'Text' | 'Images' | 'Links';
  preview: string;
  label: string;
  time: string;
  type: string;
  size: string;
  copied: string;
  icon: string;
  isToday?: boolean;
  isPinned?: boolean;
}

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

const NAV_TABS: ReadonlyArray<{ id: NavTab; width: number }> = [
  { id: 'Controls', width: 68 },
  { id: 'Today', width: 54 },
  { id: 'Stats', width: 52 },
  { id: 'Clipboard', width: 74 },
  { id: 'Apps', width: 50 },
  { id: 'Wallpaper', width: 76 },
  { id: 'Power', width: 54 },
];

const OFFICIAL_TAB_DIMENSIONS: Record<NavTab, { w: number; h: number }> = {
  Controls:  { w: 640,  h: 382 },
  Today:     { w: 880,  h: 436 },
  Stats:     { w: 880,  h: 336 },
  Clipboard: { w: 880,  h: 440 },
  Apps:      { w: 720,  h: 560 },
  Wallpaper: { w: 1000, h: 310 },
  Power:     { w: 640,  h: 164 },
};

const PERSONALITIES = ['True Chad', 'Cyber Monk', 'Stoic Architect', 'Chaotic Gremlin'];
const VOICES = ['Charon', 'Aoede', 'Fenrir', 'Puck'];
const ABILITIES = ['—', 'Circle to Ask', 'Clean Dictation', 'Scheduled Tasks'];

// Concave top-bezel fillet ear width (18px on left + 18px on right)
const EAR_SIZE = 18;

export const HitodamaApp: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && Boolean(window.hitodamaAPI);

  // Settings & Soul Loadout Configuration
  const [selectedSkinKey, setSelectedSkinKey] = useState<string>(
    () => localStorage.getItem('hitodama_skin') || (SOUL_SKINS[0]?.key ?? 'flame_hitodama')
  );
  const [personalityIdx, setPersonalityIdx] = useState(0);
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [abilityIdx, setAbilityIdx] = useState(0);

  // Dynamic Island UI States
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialExpanded = urlParams?.get('expanded') === 'true';
  const initialTab = (urlParams?.get('tab') as NavTab) || 'Controls';
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);
  const [soulMode] = useState<'LISTENING' | 'THINKING' | 'TALKING' | 'MUTED'>('LISTENING');

  // Media Player State (Exact match to hitodama.in: 0:57 / 62:15)
  const [isPlayingMedia, setIsPlayingMedia] = useState(true);
  const [mediaProgress, setMediaProgress] = useState(57);
  const [showMediaNotch, setShowMediaNotch] = useState(false);
  const totalMediaDuration = 3735;

  // Controls Quick Toggles (Exact match to hitodama.in)
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [audioOutput, setAudioOutput] = useState<'Speakers' | 'Headphones'>('Speakers');
  const [nightLight, setNightLight] = useState(false);
  const [systemDarkMode, setSystemDarkMode] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(64);
  const [isMuted, setIsMuted] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Today View State (Matched to hitodama.in To-Do items & 09:41 clock)
  const [now, setNow] = useState(() => new Date());
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(300);
  const [timerPreset, setTimerPreset] = useState<'1m' | '5m' | '10m' | '15m' | '20m'>('5m');
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [todos, setTodos] = useState([
    { id: 1, text: 'Buy Hitodama!', completed: true },
    { id: 2, text: 'Subscribe to Otism', completed: false },
    { id: 3, text: 'Call Mom', completed: false },
    { id: 4, text: 'Gym · 6:00 PM', completed: false },
  ]);
  const [newTodoInput, setNewTodoInput] = useState('');
  const [selectedDay, setSelectedDay] = useState(29);

  // Clipboard History State
  const [clipboardCategory, setClipboardCategory] = useState<'All' | 'Text' | 'Images' | 'Links'>('All');
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([
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
      isPinned: false,
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
      isPinned: false,
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
      isPinned: false,
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
      isPinned: false,
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
      isToday: false,
    },
  ]);
  const [selectedClipboardId, setSelectedClipboardId] = useState(1);
  const [clipboardSearch, setClipboardSearch] = useState('');
  const [clipboardToast, setClipboardToast] = useState<string | null>(null);

  // Wallpaper State
  const [selectedWallpaperIndex, setSelectedWallpaperIndex] = useState(2);

  // Apps State
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appsList, setAppsList] = useState([
    { id: 'spotify', name: 'Spotify', key: 'S', tag: 'Open', category: 'Starred', starred: true, highlighted: true },
    { id: 'vscode', name: 'Visual Studio Code', key: 'V', tag: 'Application', category: 'Starred', starred: true, highlighted: false },
    { id: 'chrome', name: 'Google Chrome', key: 'G', tag: 'Application', category: 'Recent', starred: false, highlighted: false },
    { id: 'discord', name: 'Discord', key: 'D', tag: 'Application', category: 'Recent', starred: false, highlighted: false },
    { id: 'explorer', name: 'File Explorer', key: 'F', tag: 'Application', category: 'Recent', starred: false, highlighted: false },
    { id: 'minecraft', name: 'Minecraft', key: 'M', tag: 'Game', category: 'Applications', starred: false, highlighted: false },
    { id: 'valorant', name: 'Valorant', key: 'V', tag: 'Game', category: 'Applications', starred: false, highlighted: false },
    { id: 'calculator', name: 'Calculator', key: 'C', tag: 'Application', category: 'Applications', starred: false, highlighted: false },
    { id: 'canva', name: 'Canva', key: 'C', tag: 'Application', category: 'Applications', starred: false, highlighted: false },
  ]);

  // Loadout Modal State
  const [showLoadoutModal, setShowLoadoutModal] = useState(() => urlParams?.get('loadout') === 'true');

  // Speed Test & Telemetry State
  const [isSpeedTesting, setIsSpeedTesting] = useState(false);
  const [speedDownload, setSpeedDownload] = useState(85);
  const [speedUpload, setSpeedUpload] = useState(42);
  const [appsSortBy, setAppsSortBy] = useState<'RAM' | 'CPU'>('RAM');
  const [powerFeedback, setPowerFeedback] = useState<string | null>(null);

  // Voice & Status States
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // System Telemetry Stats
  const [systemStats, setSystemStats] = useState({
    cpu: { percent: 37, model: 'AMD Ryzen 7 7840HS', speed: '4.2 GHz', processes: 229 },
    gpu: { percent: 12, model: 'NVIDIA GeForce RTX 4060', vramUsed: '2.1', vramTotal: '8.0' },
    ram: { percent: 61, usedGb: '19.4', totalGb: '31.9', freeGb: '12.5' },
    disk: { usedGb: 412, totalGb: 931 },
    network: { down: '1.2 MB/s', up: '300 KB/s' },
    uptime: '5 h 12 m',
  });

  const tabContentRef = useRef<HTMLDivElement>(null);
  const volumeTrackRef = useRef<HTMLDivElement>(null);
  const boundsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevWindowBoundsRef = useRef<{ w: number; h: number }>({ w: 280, h: 38 });

  const currentSoul: SoulConfig = useMemo(
    () => SOUL_SKINS.find((s) => s.key === selectedSkinKey) || SOUL_SKINS[0],
    [selectedSkinKey]
  );

  // Total Electron Window Width & Height (includes 18px left/right ear space)
  const windowWidth = showLoadoutModal
    ? 780
    : isExpanded
    ? OFFICIAL_TAB_DIMENSIONS[activeTab].w
    : showMediaNotch
    ? 380
    : statusMessage
    ? 400
    : isListening
    ? 380
    : 260;

  const windowHeight = showLoadoutModal
    ? 540
    : isExpanded
    ? OFFICIAL_TAB_DIMENSIONS[activeTab].h
    : showMediaNotch
    ? 76
    : statusMessage
    ? 56
    : isListening
    ? 46
    : 36;

  // The actual black notch body width (leaves EAR_SIZE on both sides for the concave top bezel ears)
  const notchBodyWidth = windowWidth - EAR_SIZE * 2;
  const bottomRadius = windowWidth <= 300 ? 16 : windowWidth <= 420 ? 20 : 24;

  // Smart Bidirectional Electron Window Bounds Synchronization:
  // - Grow window IMMEDIATELY before CSS expansion starts so the notch never clips.
  // - Shrink window AFTER CSS collapse finishes (260ms) so the notch never jumps left.
  useEffect(() => {
    if (!window.hitodamaAPI?.setWindowBounds) return;

    if (boundsTimeoutRef.current) {
      clearTimeout(boundsTimeoutRef.current);
      boundsTimeoutRef.current = null;
    }

    const prev = prevWindowBoundsRef.current;
    const isGrowing = windowWidth > prev.w || windowHeight > prev.h;

    if (isGrowing) {
      window.hitodamaAPI.setWindowBounds(windowWidth, windowHeight);
      prevWindowBoundsRef.current = { w: windowWidth, h: windowHeight };
    } else if (windowWidth !== prev.w || windowHeight !== prev.h) {
      boundsTimeoutRef.current = setTimeout(() => {
        window.hitodamaAPI?.setWindowBounds(windowWidth, windowHeight);
        prevWindowBoundsRef.current = { w: windowWidth, h: windowHeight };
      }, 260);
    }

    return () => {
      if (boundsTimeoutRef.current) clearTimeout(boundsTimeoutRef.current);
    };
  }, [windowWidth, windowHeight]);

  // Smooth Tab Content Entrance
  useEffect(() => {
    if (tabContentRef.current && isExpanded && !showLoadoutModal) {
      gsap.killTweensOf(tabContentRef.current);
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, duration: 0.18, ease: 'cubic-bezier(0.33, 1, 0.68, 1)', clearProps: 'transform' }
      );
    }
  }, [activeTab, isExpanded, showLoadoutModal]);

  // Sliding active tab glider offset
  const activeNavMetrics = useMemo(() => {
    let offsetLeft = 0;
    const gap = 4;
    for (const item of NAV_TABS) {
      if (item.id === activeTab) {
        return { left: offsetLeft, width: item.width };
      }
      offsetLeft += item.width + gap;
    }
    return { left: 0, width: 68 };
  }, [activeTab]);

  // Enforce transparency in Electron
  useEffect(() => {
    if (isElectron) {
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.classList.add('desktop-mode');
    }
  }, [isElectron]);

  // Live Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Focus Timer Countdown
  useEffect(() => {
    if (!isTimerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Media Playback Ticker
  useEffect(() => {
    if (!isPlayingMedia) return;
    const interval = setInterval(() => {
      setMediaProgress((prev) => (prev >= totalMediaDuration ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayingMedia]);

  // Fetch Real System Telemetry
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

  // Pointer-Draggable Volume Slider
  const updateVolumeFromClientX = useCallback((clientX: number) => {
    if (!volumeTrackRef.current) return;
    const rect = volumeTrackRef.current.getBoundingClientRect();
    const pct = Math.round(((clientX - rect.left) / rect.width) * 100);
    const clamped = Math.min(100, Math.max(0, pct));
    setVolumeLevel(clamped);
    if (clamped > 0) setIsMuted(false);
  }, []);

  useEffect(() => {
    if (!isDraggingVolume) return;
    const onMove = (e: PointerEvent) => updateVolumeFromClientX(e.clientX);
    const onUp = () => setIsDraggingVolume(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingVolume, updateVolumeFromClientX]);

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
      setSpeedDownload(Math.floor(72 + Math.random() * 34));
      setSpeedUpload(Math.floor(36 + Math.random() * 22));
      if (counter > 15) {
        clearInterval(interval);
        setSpeedDownload(85);
        setSpeedUpload(42);
        setIsSpeedTesting(false);
      }
    }, 140);
  };

  const handleLaunchApp = async (name: string) => {
    if (window.hitodamaAPI?.openApp) {
      await window.hitodamaAPI.openApp(name);
    }
  };

  const toggleStarApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAppsList((prev) =>
      prev.map((app) =>
        app.id === id
          ? { ...app, starred: !app.starred, category: !app.starred ? 'Starred' : 'Applications' }
          : app
      )
    );
  };

  const handleAddTodo = () => {
    if (!newTodoInput.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: newTodoInput.trim(), completed: false },
    ]);
    setNewTodoInput('');
  };

  const triggerClipboardToast = (msg: string) => {
    setClipboardToast(msg);
    setTimeout(() => setClipboardToast(null), 1600);
  };

  const handleTogglePinClip = (id: number) => {
    setClipboardItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isPinned: !item.isPinned, isToday: item.isPinned ? true : item.isToday }
          : item
      )
    );
    triggerClipboardToast('Updated pin');
  };

  const handleDeleteClip = (id: number) => {
    setClipboardItems((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      if (selectedClipboardId === id && remaining.length > 0) {
        setSelectedClipboardId(remaining[0].id);
      }
      return remaining;
    });
    triggerClipboardToast('Removed');
  };

  const handleSelectWallpaper = async (index: number) => {
    setSelectedWallpaperIndex(index);
    if (window.hitodamaAPI?.setWallpaper) {
      await window.hitodamaAPI.setWallpaper(WALLPAPERS[index].url);
    }
  };

  const cycleSoulSkin = () => {
    const currentIndex = SOUL_SKINS.findIndex((s) => s.key === selectedSkinKey);
    const nextIndex = (currentIndex + 1) % SOUL_SKINS.length;
    const nextKey = SOUL_SKINS[nextIndex].key;
    setSelectedSkinKey(nextKey);
    localStorage.setItem('hitodama_skin', nextKey);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredClipboardItems = useMemo(() => {
    return clipboardItems.filter((item) => {
      const matchesCat = clipboardCategory === 'All' || item.category === clipboardCategory;
      const matchesQuery =
        !clipboardSearch.trim() ||
        item.preview.toLowerCase().includes(clipboardSearch.toLowerCase()) ||
        item.type.toLowerCase().includes(clipboardSearch.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [clipboardItems, clipboardCategory, clipboardSearch]);

  const selectedClip = useMemo(
    () =>
      filteredClipboardItems.find((c) => c.id === selectedClipboardId) ||
      filteredClipboardItems[0] ||
      clipboardItems[0],
    [filteredClipboardItems, selectedClipboardId, clipboardItems]
  );

  const filteredApps = useMemo(() => {
    if (!appSearchQuery.trim()) return appsList;
    const q = appSearchQuery.toLowerCase();
    return appsList.filter(
      (a) => a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q)
    );
  }, [appsList, appSearchQuery]);

  // Escape & Alt+1..7 Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLoadoutModal) setShowLoadoutModal(false);
        else if (isExpanded) setIsExpanded(false);
        else if (showMediaNotch) setShowMediaNotch(false);
        else if (statusMessage) setStatusMessage(null);
      } else if (isExpanded && !showLoadoutModal && e.altKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= NAV_TABS.length) {
          e.preventDefault();
          setActiveTab(NAV_TABS[num - 1].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, showLoadoutModal, showMediaNotch, statusMessage]);

  // Global Hotkeys Hook from Electron (Ctrl+Shift Lasso & Ctrl+Win Dictation)
  useEffect(() => {
    if (!window.hitodamaAPI) return;

    const unregLasso = window.hitodamaAPI.onTriggerLasso(async () => {
      const res = await window.hitodamaAPI?.captureScreen();
      if (!res?.success) {
        setStatusMessage('Could not capture screen.');
      } else {
        setStatusMessage('Circle anything. Ask about it.');
      }
    });

    const unregDictate = window.hitodamaAPI.onTriggerDictation(() => {
      setStatusMessage('Talk badly. Send it clean.');
      setIsListening((prev) => !prev);
    });

    return () => {
      unregLasso();
      unregDictate();
    };
  }, []);

  // Circular gauge helper for Stats tab
  const renderCircleGauge = (
    pct: number,
    color: string,
    title: string,
    subtitle: string,
    badges: string[]
  ) => {
    const size = 88;
    const strokeWidth = 6.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <div className="companion-control-tile companion-gauge-card">
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              className="companion-gauge-circle"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="companion-gauge-value">{pct}%</div>
        </div>

        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
          {title}
        </div>
        <div className="companion-truncate" style={{ fontSize: '10.5px', color: '#8E929C', marginTop: '1px', maxWidth: '100%' }}>
          {subtitle}
        </div>
        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
          {badges.map((b, i) => (
            <span key={i} className="companion-stat-badge">
              {b}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Focus timer SVG progress calculations
  const timerRingSize = 70;
  const timerStroke = 3.5;
  const timerRadius = (timerRingSize - timerStroke * 2) / 2;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerFraction = timerTotalSeconds > 0 ? timerSeconds / timerTotalSeconds : 0;
  const timerDashoffset = timerCircumference * (1 - timerFraction);

  const hoursStr = String(now.getHours() % 12 || 12).padStart(2, '0');
  const minsStr = String(now.getMinutes()).padStart(2, '0');
  const ampmStr = now.getHours() >= 12 ? 'PM' : 'AM';
  const dayShortStr = now.toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div
      className="hitodama-companion-root"
      style={{
        background: isElectron
          ? 'transparent'
          : `linear-gradient(180deg, rgba(4, 6, 10, 0.35) 0%, rgba(4, 6, 10, 0.2) 100%), url("${WALLPAPERS[selectedWallpaperIndex].url}") center/cover no-repeat`,
      }}
    >
      {/* =====================================================================
          PURE CSS HARDWARE NOTCH SHELL
          Centered horizontally at top: 0.
          Left & right concave bezel ears attach via CSS pseudo-elements.
          Inner body has overflow: hidden + border-radius so ZERO boxes bleed out.
          ===================================================================== */}
      <div
        className={`hitodama-bezel-shell ${isHovered ? 'is-hovered' : ''}`}
        style={{
          width: `${notchBodyWidth}px`,
          height: `${windowHeight}px`,
          borderBottomLeftRadius: `${bottomRadius}px`,
          borderBottomRightRadius: `${bottomRadius}px`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onWheel={(e) => {
          // "Scroll down on the island and your music, settings, plans... are one flick away"
          if (!isExpanded && !showLoadoutModal && e.deltaY > 8) {
            setIsExpanded(true);
          }
        }}
      >
        {/* Top-Left & Top-Right Concave Monitor Bezel Fillet Ears */}
        <div className="hitodama-bezel-ear-left" />
        <div className="hitodama-bezel-ear-right" />

        {/* Strictly Clipped Interior Container (Zero Outer Box Artifacts) */}
        <div
          className="hitodama-bezel-inner"
          style={{
            borderBottomLeftRadius: `${bottomRadius}px`,
            borderBottomRightRadius: `${bottomRadius}px`,
          }}
        >
          {/* -----------------------------------------------------------------
              STATE 1: IDLE COLLAPSED NOTCH
              ----------------------------------------------------------------- */}
          {!isExpanded && !showLoadoutModal && !showMediaNotch && !statusMessage && !isListening && (
            <div
              className="hitodama-notch-idle"
              onClick={() => setIsExpanded(true)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setShowMediaNotch(true);
              }}
              title="Click or scroll down to open Hitodama Island • Double-click for Media"
            >
              <div
                className="hitodama-idle-soul-wrap"
                style={{
                  transform: isHovered ? 'scale(1.14)' : 'scale(1)',
                }}
              >
                <SoulCanvas
                  soul={currentSoul}
                  width={40}
                  height={26}
                  scale={0.56}
                  mode={soulMode}
                  interactive={true}
                />
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              STATE 1.5: STATUS / ACTION ISLAND NOTCH
              ----------------------------------------------------------------- */}
          {!isExpanded && !showLoadoutModal && !showMediaNotch && statusMessage && (
            <div className="hitodama-notch-status">
              <div style={{ width: '42px', height: '34px', flexShrink: 0 }}>
                <SoulCanvas soul={currentSoul} width={42} height={34} scale={0.68} mode={soulMode} />
              </div>

              <div style={{ flex: 1, margin: '0 12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
                    HITODAMA
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#8ed92f' }}>人魂</span>
                </div>
                <div className="companion-truncate" style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '1px' }}>
                  {statusMessage}
                </div>
              </div>

              <div className="companion-action-capsule">
                <button onClick={() => setStatusMessage(null)} className="companion-icon-btn" title="Pin">
                  📌
                </button>
                <button
                  onClick={() => {
                    setIsExpanded(true);
                    setStatusMessage(null);
                  }}
                  className="companion-icon-btn accent"
                  title="Expand"
                >
                  ▼
                </button>
                <button onClick={() => setStatusMessage(null)} className="companion-icon-btn" title="Dismiss">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              STATE 2: COMPACT MEDIA PLAYER NOTCH
              ----------------------------------------------------------------- */}
          {!isExpanded && !showLoadoutModal && showMediaNotch && (
            <div className="hitodama-notch-media" onClick={() => setIsExpanded(true)}>
              <div className="companion-album-art compact" />

              <div style={{ flex: 1, margin: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <div className="companion-truncate" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                  lofi beats to study and relax
                </div>
                <div style={{ fontSize: '10px', color: '#888892' }}>lofi radio</div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="companion-mono-tiny">{formatTime(mediaProgress)}</span>
                  <div
                    className="companion-scrub-track"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      setMediaProgress(Math.round(pct * totalMediaDuration));
                    }}
                  >
                    <div
                      className="companion-scrub-fill cyan"
                      style={{ width: `${(mediaProgress / totalMediaDuration) * 100}%` }}
                    >
                      <div className="companion-scrub-thumb" />
                    </div>
                  </div>
                  <span className="companion-mono-tiny">62:15</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setMediaProgress(0)} className="companion-media-btn">
                  ⏮
                </button>
                <button onClick={() => setIsPlayingMedia((prev) => !prev)} className="companion-media-btn">
                  {isPlayingMedia ? '❚❚' : '▶'}
                </button>
                <button
                  onClick={() => setMediaProgress((prev) => Math.min(totalMediaDuration, prev + 30))}
                  className="companion-media-btn"
                >
                  ⏭
                </button>
                <button
                  onClick={() => setShowMediaNotch(false)}
                  title="Collapse"
                  className="companion-icon-btn"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              STATE 3: LISTENING NOTCH
              ----------------------------------------------------------------- */}
          {!isExpanded && !showLoadoutModal && !showMediaNotch && isListening && (
            <div className="hitodama-notch-listening" onClick={() => setIsExpanded(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '26px' }}>
                  <SoulCanvas soul={currentSoul} width={36} height={26} scale={0.6} mode="LISTENING" interactive={true} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>Hitodama is listening...</span>
                  <span style={{ fontSize: '9px', color: '#5cb8ff', letterSpacing: '0.04em' }}>
                    TALK BADLY. SEND IT CLEAN.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px' }}>
                {[0.5, 0.9, 1.4, 0.8, 1.2, 0.6, 1.1, 0.4].map((scale, i) => (
                  <span
                    key={i}
                    className="companion-wave-bar"
                    style={{
                      height: `${Math.round(scale * 14)}px`,
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #5CB8FF 100%)',
                      animationDuration: `${0.45 + (i % 4) * 0.12}s`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              STATE 4: FULL EXPANDED DYNAMIC ISLAND (7 TABS)
              ----------------------------------------------------------------- */}
          {isExpanded && !showLoadoutModal && (
            <div className="hitodama-expanded-inner">
              <CompanionShaderBackdrop opacity={0.22} speed={0.5} hue={205} />

              {/* TOP NAVIGATION BAR */}
              <div
                className="companion-nav-header"
                onWheel={(e) => {
                  if (e.deltaY < -8) setIsExpanded(false);
                }}
              >
                <div className="companion-nav-track">
                  <div
                    className="companion-nav-glider"
                    style={{
                      width: `${activeNavMetrics.width}px`,
                      transform: `translate3d(${activeNavMetrics.left}px, 0, 0)`,
                    }}
                  />
                  {NAV_TABS.map(({ id: tab, width }) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`companion-nav-btn ${isActive ? 'active' : ''}`}
                        style={{ width: `${width}px` }}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* Right Header Actions: Loadout + Close (Never overlaps Power) */}
                <div className="companion-header-actions">
                  <button
                    onClick={() => setShowLoadoutModal(true)}
                    title="Shape your Hitodama Loadout"
                    className="companion-header-circle gold"
                  >
                    ✨
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    title="Collapse (Esc)"
                    className="companion-header-circle"
                  >
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Active Tab View Body */}
              <div ref={tabContentRef} className="companion-tab-body">
                {/* ===========================================================
                    TAB 1: CONTROLS VIEW (Exact match to hitodama.in)
                    Wi-Fi Home 5G | Bluetooth Off | Audio Speakers
                    Night Light Off | Dark mode On | 64% | lofi beats
                    =========================================================== */}
                {activeTab === 'Controls' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between' }}>
                    {/* Row 1: Wi-Fi, Bluetooth, Audio */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <button
                        onClick={() => setWifiEnabled(!wifiEnabled)}
                        className={`companion-control-tile row-tile ${wifiEnabled ? 'active-tile' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="companion-icon-box" style={{ color: wifiEnabled ? '#5CB8FF' : '#71717A' }}>
                            📶
                          </span>
                          <div style={{ textAlign: 'left' }}>
                            <div className="companion-tile-title">Wi-Fi</div>
                            <div className="companion-tile-sub" style={{ color: wifiEnabled ? '#8ED92F' : '#71717A' }}>
                              {wifiEnabled ? 'Home 5G' : 'Off'}
                            </div>
                          </div>
                        </div>
                        <span className={`companion-status-led ${wifiEnabled ? 'green' : ''}`} />
                      </button>

                      <button
                        onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                        className={`companion-control-tile row-tile ${bluetoothEnabled ? 'active-tile' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="companion-icon-box" style={{ color: bluetoothEnabled ? '#5CB8FF' : '#71717A' }}>
                            ᛒ
                          </span>
                          <div style={{ textAlign: 'left' }}>
                            <div className="companion-tile-title">Bluetooth</div>
                            <div className="companion-tile-sub" style={{ color: bluetoothEnabled ? '#5CB8FF' : '#71717A' }}>
                              {bluetoothEnabled ? 'On' : 'Off'}
                            </div>
                          </div>
                        </div>
                        <span className={`companion-status-led ${bluetoothEnabled ? 'cyan' : ''}`} />
                      </button>

                      <button
                        onClick={() => setAudioOutput((prev) => (prev === 'Speakers' ? 'Headphones' : 'Speakers'))}
                        className="companion-control-tile row-tile active-tile"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="companion-icon-box" style={{ color: '#5CB8FF' }}>
                            🔊
                          </span>
                          <div style={{ textAlign: 'left' }}>
                            <div className="companion-tile-title">Audio</div>
                            <div className="companion-tile-sub" style={{ color: '#A1A1AA' }}>
                              {audioOutput}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#71717A' }}>˅</span>
                      </button>
                    </div>

                    {/* Row 2: Night Light & Dark mode */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        onClick={() => setNightLight(!nightLight)}
                        className={`companion-control-tile row-tile ${nightLight ? 'active-tile' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="companion-icon-box" style={{ color: nightLight ? '#FFC24A' : '#71717A' }}>
                            🌙
                          </span>
                          <div style={{ textAlign: 'left' }}>
                            <div className="companion-tile-title">Night Light</div>
                            <div className="companion-tile-sub" style={{ color: nightLight ? '#FFC24A' : '#71717A' }}>
                              {nightLight ? 'On' : 'Off'}
                            </div>
                          </div>
                        </div>
                        <span className={`companion-status-led ${nightLight ? 'gold' : ''}`} />
                      </button>

                      <button
                        onClick={async () => {
                          setSystemDarkMode(!systemDarkMode);
                          if (window.hitodamaAPI) await window.hitodamaAPI.toggleSystemDarkMode();
                        }}
                        className={`companion-control-tile row-tile ${systemDarkMode ? 'active-tile' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="companion-icon-box" style={{ color: systemDarkMode ? '#5CB8FF' : '#71717A' }}>
                            🌑
                          </span>
                          <div style={{ textAlign: 'left' }}>
                            <div className="companion-tile-title">Dark mode</div>
                            <div className="companion-tile-sub" style={{ color: systemDarkMode ? '#5CB8FF' : '#71717A' }}>
                              {systemDarkMode ? 'On' : 'Off'}
                            </div>
                          </div>
                        </div>
                        <span className={`companion-status-led ${systemDarkMode ? 'cyan' : ''}`} />
                      </button>
                    </div>

                    {/* Row 3: Volume Slider Card */}
                    <div
                      className="companion-control-tile row-tile"
                      style={{ padding: '10px 14px', gap: '12px' }}
                      onWheel={(e) => {
                        const delta = e.deltaY < 0 ? 4 : -4;
                        setVolumeLevel((v) => Math.min(100, Math.max(0, v + delta)));
                      }}
                    >
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '14px',
                          color: isMuted || volumeLevel === 0 ? '#71717A' : '#E4E4E7',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {isMuted || volumeLevel === 0 ? '🔇' : '🔊'}
                      </button>
                      <div
                        ref={volumeTrackRef}
                        className="companion-volume-slider"
                        onPointerDown={(e) => {
                          setIsDraggingVolume(true);
                          updateVolumeFromClientX(e.clientX);
                        }}
                      >
                        <div
                          className="companion-volume-fill"
                          style={{
                            width: `${isMuted ? 0 : volumeLevel}%`,
                            transition: isDraggingVolume ? 'none' : 'width 0.1s ease-out',
                          }}
                        />
                      </div>
                      <span className="companion-mono-value" style={{ minWidth: '36px', textAlign: 'right', fontSize: '12px' }}>
                        {isMuted ? '0%' : `${volumeLevel}%`}
                      </span>
                    </div>

                    {/* Row 4: Media Player Card */}
                    <div
                      className="companion-control-tile"
                      style={{ padding: '12px 16px', gap: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '10px', color: '#888892', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>🔊</span> {audioOutput}
                        </div>
                        <button
                          onClick={() => {
                            setIsExpanded(false);
                            setShowMediaNotch(true);
                          }}
                          className="companion-mini-link"
                        >
                          Compact Player ↗
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div className="companion-album-art" />

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                          <div className="companion-truncate" style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                            lofi beats to study and relax
                          </div>
                          <div style={{ fontSize: '11px', color: '#888892' }}>lofi radio</div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span className="companion-mono-tiny">{formatTime(mediaProgress)}</span>
                            <div
                              className="companion-scrub-track"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                setMediaProgress(Math.round(pct * totalMediaDuration));
                              }}
                            >
                              <div
                                className="companion-scrub-fill gold"
                                style={{ width: `${(mediaProgress / totalMediaDuration) * 100}%` }}
                              />
                            </div>
                            <span className="companion-mono-tiny">62:15</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => setMediaProgress(0)} className="companion-media-btn">
                            ⏮
                          </button>
                          <button
                            onClick={() => setIsPlayingMedia(!isPlayingMedia)}
                            className="companion-play-circle-gold"
                          >
                            {isPlayingMedia ? '❚❚' : '▶'}
                          </button>
                          <button
                            onClick={() => setMediaProgress((prev) => Math.min(totalMediaDuration, prev + 30))}
                            className="companion-media-btn"
                          >
                            ⏭
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===========================================================
                    TAB 2: TODAY VIEW
                    =========================================================== */}
                {activeTab === 'Today' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '154px 1.22fr 1fr',
                      gap: '12px',
                      width: '100%',
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    {/* Col 1: Clock & Weather */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="companion-glass-card" style={{ padding: '16px 12px', alignItems: 'center', justifyContent: 'center', flex: 1.15 }}>
                        <div className="companion-editorial-clock">{hoursStr}</div>
                        <div className="companion-clock-dots">•••</div>
                        <div className="companion-editorial-clock">{minsStr}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: 500 }}>
                          {ampmStr} · {dayShortStr} {selectedDay}
                        </div>
                      </div>

                      <div className="companion-glass-card" style={{ padding: '14px 12px', alignItems: 'center', justifyContent: 'center', flex: 0.85 }}>
                        <span style={{ fontSize: '22px', color: '#F59E0B' }}>☼</span>
                        <div className="companion-mono-value" style={{ fontSize: '21px', margin: '4px 0 2px 0' }}>
                          32°C
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Mostly clear</div>
                      </div>
                    </div>

                    {/* Col 2: This Week & Focus Timer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="companion-glass-card" style={{ padding: '14px 16px', gap: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#E2E8F0' }}>This week</span>
                          <span className="companion-mono-tiny">Sep 28 – Oct 4</span>
                        </div>

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
                                className="companion-day-col"
                              >
                                <span style={{ fontSize: '9px', color: isSelected ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                                  {item.day}
                                </span>
                                <span className={`companion-day-pill ${isSelected ? 'selected' : ''}`}>
                                  {item.num}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="companion-event-banner">
                          <div className="companion-event-bar" />
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#F1F5F9' }}>Next • 11:00 AM</div>
                            <div style={{ fontSize: '10px', color: '#94A3B8' }}>Daily AI news research</div>
                          </div>
                        </div>
                      </div>

                      {/* Focus Timer Card */}
                      <div className="companion-glass-card" style={{ padding: '14px 16px', flexDirection: 'row', alignItems: 'center', gap: '14px', flex: 1 }}>
                        <div style={{ position: 'relative', width: `${timerRingSize}px`, height: `${timerRingSize}px`, flexShrink: 0 }}>
                          <svg width={timerRingSize} height={timerRingSize} style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                              cx={timerRingSize / 2}
                              cy={timerRingSize / 2}
                              r={timerRadius}
                              stroke="rgba(92, 184, 255, 0.14)"
                              strokeWidth={timerStroke}
                              fill="rgba(92, 184, 255, 0.04)"
                            />
                            <circle
                              cx={timerRingSize / 2}
                              cy={timerRingSize / 2}
                              r={timerRadius}
                              stroke="#5CB8FF"
                              strokeWidth={timerStroke}
                              strokeDasharray={timerCircumference}
                              strokeDashoffset={timerDashoffset}
                              strokeLinecap="round"
                              fill="transparent"
                              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                            />
                          </svg>
                          <div className="companion-timer-readout">{formatTime(timerSeconds)}</div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#94A3B8' }}>
                            <span>
                              <strong className="companion-mono-value" style={{ fontSize: '14px' }}>0</strong> h
                            </span>
                            <span>
                              <strong className="companion-mono-value" style={{ fontSize: '14px' }}>
                                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}
                              </strong>{' '}
                              min
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            {(['1m', '5m', '10m', '15m', '20m'] as const).map((p) => {
                              const isActive = timerPreset === p;
                              return (
                                <button
                                  key={p}
                                  onClick={() => {
                                    setTimerPreset(p);
                                    const secs = parseInt(p, 10) * 60;
                                    setTimerSeconds(secs);
                                    setTimerTotalSeconds(secs);
                                    setIsTimerRunning(false);
                                  }}
                                  className={`companion-preset-chip ${isActive ? 'active' : ''}`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                            <button
                              onClick={() => setIsTimerRunning(!isTimerRunning)}
                              className={`companion-primary-btn ${isTimerRunning ? 'danger' : ''}`}
                            >
                              {isTimerRunning ? 'Pause' : 'Start'}
                            </button>
                            <button
                              onClick={() => {
                                setIsTimerRunning(false);
                                setTimerSeconds(timerTotalSeconds);
                              }}
                              className="companion-secondary-btn"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Col 3: To-Do Checklist */}
                    <div className="companion-glass-card" style={{ padding: '14px 16px', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>Today</span>
                            <span className="companion-mono-tiny" style={{ color: '#5CB8FF', fontWeight: 700 }}>
                              +{todos.filter((t) => !t.completed).length}
                            </span>
                          </div>
                          <span className="companion-pill-counter">
                            {todos.filter((t) => t.completed).length}/{todos.length}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
                          {todos.map((todo) => (
                            <div
                              key={todo.id}
                              onClick={() =>
                                setTodos((prev) =>
                                  prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
                                )
                              }
                              className={`companion-todo-row ${todo.completed ? 'completed' : ''}`}
                            >
                              <span className={`companion-todo-check ${todo.completed ? 'checked' : ''}`}>
                                {todo.completed ? '✔' : ''}
                              </span>
                              <span className="companion-todo-text">{todo.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                        <input
                          type="text"
                          placeholder="+ Add a to-do..."
                          value={newTodoInput}
                          onChange={(e) => setNewTodoInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                          className="companion-todo-input"
                        />
                        <button onClick={handleAddTodo} className="companion-todo-submit">
                          ➔
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===========================================================
                    TAB 3: STATS VIEW
                    =========================================================== */}
                {activeTab === 'Stats' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.85fr 1fr',
                      gap: '10px',
                      width: '100%',
                      flex: 1,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
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
                        <div className="companion-mini-stat-box">
                          <div className="companion-mini-stat-label">DISK C:</div>
                          <div className="companion-mini-stat-val">
                            {systemStats.disk.usedGb} / {systemStats.disk.totalGb} GB
                          </div>
                        </div>
                        <div className="companion-mini-stat-box">
                          <div className="companion-mini-stat-label">NETWORK</div>
                          <div className="companion-mini-stat-val" style={{ color: '#5CB8FF' }}>
                            ↓ {systemStats.network.down} ↑ {systemStats.network.up}
                          </div>
                        </div>
                        <div className="companion-mini-stat-box">
                          <div className="companion-mini-stat-label">UP FOR</div>
                          <div className="companion-mini-stat-val">{systemStats.uptime}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="companion-glass-card" style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>
                            Top apps · {appsSortBy}
                          </span>
                          <button
                            onClick={() => setAppsSortBy((prev) => (prev === 'RAM' ? 'CPU' : 'RAM'))}
                            className="companion-sort-pill"
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
                              <span className="companion-app-badge">{app.icon}</span>
                              <span className="companion-truncate" style={{ width: '96px', color: '#E2E8F0', fontWeight: 500 }}>
                                {app.name}
                              </span>
                              <div style={{ flex: 1, height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: app.width,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #5CB8FF, #38BDF8)',
                                    borderRadius: '2px',
                                  }}
                                />
                              </div>
                              <span className="companion-mono-tiny" style={{ width: '44px', textAlign: 'right' }}>
                                {app.usage}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="companion-glass-card" style={{ padding: '12px 14px', justifyContent: 'space-between', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>Internet speed</span>
                          <span className="companion-mono-tiny">last: 5m ago</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', margin: '4px 0' }}>
                          <div>
                            <span className="companion-mono-value" style={{ fontSize: '20px' }}>{speedDownload}</span>{' '}
                            <span style={{ fontSize: '10.5px', color: '#5CB8FF', fontWeight: 600 }}>Mbps ↓</span>
                          </div>
                          <div>
                            <span className="companion-mono-value" style={{ fontSize: '20px' }}>{speedUpload}</span>{' '}
                            <span style={{ fontSize: '10.5px', color: '#38BDF8', fontWeight: 600 }}>Mbps ↑</span>
                          </div>
                        </div>
                        <button
                          onClick={handleRunSpeedTest}
                          disabled={isSpeedTesting}
                          className="companion-primary-btn full"
                        >
                          <span>▶</span>
                          <span>{isSpeedTesting ? 'Testing connection...' : 'Run speed test'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===========================================================
                    TAB 4: CLIPBOARD VIEW
                    =========================================================== */}
                {activeTab === 'Clipboard' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div className="companion-search-box" style={{ flex: 1, padding: '6px 12px' }}>
                        <span style={{ fontSize: '12px', color: '#71717a', marginRight: '6px' }}>🔍</span>
                        <input
                          type="text"
                          placeholder="Search 23 items..."
                          value={clipboardSearch}
                          onChange={(e) => setClipboardSearch(e.target.value)}
                          className="companion-clean-input"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {(['All', 'Text', 'Images', 'Links'] as const).map((cat) => {
                          const isActive = clipboardCategory === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => setClipboardCategory(cat)}
                              className={`companion-filter-pill ${isActive ? 'active' : ''}`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '14px', flex: 1, minHeight: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '240px' }}>
                        {filteredClipboardItems.some((i) => i.isPinned) && (
                          <div>
                            <div className="companion-section-header">PINNED</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {filteredClipboardItems
                                .filter((i) => i.isPinned)
                                .map((item) => {
                                  const isSelected = selectedClip?.id === item.id;
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => setSelectedClipboardId(item.id)}
                                      className={`companion-list-row ${isSelected ? 'selected' : ''}`}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                        <span style={{ fontSize: '11px' }}>📌</span>
                                        <span className="companion-truncate" style={{ fontSize: '11px' }}>
                                          {item.label}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="companion-section-header">TODAY</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {filteredClipboardItems
                              .filter((i) => !i.isPinned)
                              .map((item) => {
                                const isSelected = selectedClip?.id === item.id;
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => setSelectedClipboardId(item.id)}
                                    className={`companion-list-row ${isSelected ? 'selected' : ''}`}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                      <span style={{ fontSize: '11px' }}>{item.icon}</span>
                                      <span className="companion-truncate" style={{ fontSize: '11px' }}>
                                        {item.label}
                                      </span>
                                    </div>
                                    <span className="companion-mono-tiny">{item.time}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      {selectedClip && (
                        <div className="companion-glass-card" style={{ padding: '16px', justifyContent: 'space-between', position: 'relative' }}>
                          {clipboardToast && <div className="companion-floating-toast">{clipboardToast}</div>}
                          <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#F8FAFC', fontWeight: 600, wordBreak: 'break-word' }}>
                            {selectedClip.preview}
                          </div>

                          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                              <span>Type</span>
                              <strong className="companion-mono-tiny" style={{ color: '#E2E8F0' }}>{selectedClip.type}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                              <span>Size</span>
                              <strong className="companion-mono-tiny" style={{ color: '#E2E8F0' }}>{selectedClip.size}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                              <span>Copied</span>
                              <strong className="companion-mono-tiny" style={{ color: '#E2E8F0' }}>{selectedClip.copied}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            if (!selectedClip) return;
                            navigator.clipboard?.writeText(selectedClip.preview);
                            window.hitodamaAPI?.typeText(selectedClip.preview);
                            triggerClipboardToast('Pasted!');
                          }}
                          className="companion-kbd-btn"
                        >
                          ↵ Paste
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedClip) return;
                            navigator.clipboard?.writeText(selectedClip.preview);
                            triggerClipboardToast('Copied!');
                          }}
                          className="companion-kbd-btn"
                        >
                          Ctrl C Copy
                        </button>
                        <button
                          onClick={() => selectedClip && handleTogglePinClip(selectedClip.id)}
                          className="companion-kbd-btn"
                        >
                          Ctrl P Pin
                        </button>
                        <button
                          onClick={() => selectedClip && handleDeleteClip(selectedClip.id)}
                          className="companion-kbd-btn danger"
                        >
                          Del Remove
                        </button>
                      </div>
                      <div className="companion-mono-tiny">
                        ↑↓ Move • Ctrl/Shift pick several • Tab Filter
                      </div>
                    </div>
                  </div>
                )}

                {/* ===========================================================
                    TAB 5: APPS VIEW
                    =========================================================== */}
                {activeTab === 'Apps' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      flex: 1,
                      overflowY: 'auto',
                    }}
                  >
                    <div className="companion-search-box">
                      <span style={{ fontSize: '13px', marginRight: '8px', color: '#64748B' }}>🔍</span>
                      <input
                        type="text"
                        value={appSearchQuery}
                        onChange={(e) => setAppSearchQuery(e.target.value)}
                        placeholder="Search apps, files and snippets..."
                        className="companion-clean-input"
                      />
                      <span className="companion-kbd-tag">Win+A</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleLaunchApp('gmail')} className="companion-quick-chip">
                        <span style={{ color: '#5CB8FF' }}>⚡</span> gmail
                      </button>
                      <button onClick={() => handleLaunchApp('gta 5')} className="companion-quick-chip">
                        <span style={{ color: '#5CB8FF' }}>⚡</span> Gta 5
                      </button>
                    </div>

                    {(['Starred', 'Recent', 'Applications'] as const).map((group) => {
                      const groupItems = filteredApps.filter((a) =>
                        group === 'Starred' ? a.starred : !a.starred && a.category === group
                      );
                      if (groupItems.length === 0) return null;

                      return (
                        <div key={group}>
                          <div className="companion-section-header">{group.toUpperCase()}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {groupItems.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleLaunchApp(item.name)}
                                className={`companion-list-row ${item.highlighted ? 'selected' : ''}`}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span className="companion-app-badge">{item.key}</span>
                                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#E2E8F0' }}>{item.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="companion-mono-tiny">{item.tag}</span>
                                  <button
                                    onClick={(e) => toggleStarApp(item.id, e)}
                                    className={`companion-star-btn ${item.starred ? 'starred' : ''}`}
                                  >
                                    ★
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ===========================================================
                    TAB 6: WALLPAPER VIEW
                    =========================================================== */}
                {activeTab === 'Wallpaper' && (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}
                    onWheel={(e) => {
                      if (e.deltaY > 0 || e.deltaX > 0) {
                        setSelectedWallpaperIndex((i) => (i + 1) % WALLPAPERS.length);
                      } else {
                        setSelectedWallpaperIndex((i) => (i - 1 + WALLPAPERS.length) % WALLPAPERS.length);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button className="companion-filter-pill active">Recent</button>
                        <button className="companion-filter-pill">My folder</button>
                        <span className="companion-mono-tiny" style={{ marginLeft: '6px' }}>
                          5 pictures
                        </span>
                      </div>
                      <div className="companion-app-badge" style={{ width: '28px', height: '28px', cursor: 'pointer' }}>
                        📁
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        perspective: '1000px',
                        margin: '10px 0',
                        height: '160px',
                      }}
                    >
                      {WALLPAPERS.map((wp, index) => {
                        const isSelected = selectedWallpaperIndex === index;
                        let transform = 'scale(0.85)';
                        if (index < 2) {
                          transform = `perspective(800px) rotateY(${16 - index * 6}deg) scale(${0.8 + index * 0.08})`;
                        } else if (index === 2) {
                          transform = 'perspective(800px) scale(1.06)';
                        } else {
                          transform = `perspective(800px) rotateY(-${10 + (index - 3) * 6}deg) scale(${0.96 - (index - 2) * 0.08})`;
                        }

                        return (
                          <div
                            key={wp.id}
                            onClick={() => handleSelectWallpaper(index)}
                            className={`companion-wallpaper-card ${isSelected ? 'selected' : ''}`}
                            style={{
                              width: isSelected ? '210px' : '90px',
                              height: isSelected ? '140px' : '124px',
                              backgroundImage: `url(${wp.thumb})`,
                              transform,
                            }}
                          />
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div className="companion-scroll-hint">Scroll ↑</div>
                    </div>
                  </div>
                )}

                {/* ===========================================================
                    TAB 7: POWER VIEW
                    =========================================================== */}
                {activeTab === 'Power' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <button onClick={() => handlePowerAction('lock')} className="companion-power-card">
                        <span style={{ fontSize: '18px' }}>🔒</span>
                        <span className="companion-power-label">Lock</span>
                      </button>
                      <button onClick={() => handlePowerAction('sleep')} className="companion-power-card">
                        <span style={{ fontSize: '18px' }}>🌙</span>
                        <span className="companion-power-label">Sleep</span>
                      </button>
                      <button onClick={() => handlePowerAction('restart')} className="companion-power-card">
                        <span style={{ fontSize: '18px' }}>↻</span>
                        <span className="companion-power-label">Restart</span>
                      </button>
                      <button onClick={() => handlePowerAction('shutdown')} className="companion-power-card danger">
                        <span style={{ fontSize: '18px' }}>⏻</span>
                        <span className="companion-power-label">Shut down</span>
                      </button>
                    </div>
                    {powerFeedback && (
                      <div className="companion-mono-tiny" style={{ textAlign: 'center', color: '#5CB8FF' }}>
                        {powerFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              STATE 5: SOUL LOADOUT MIND-MAP (Exact 4 Slots from hitodama.in)
              Hitodama (Soul) | True Chad (Personality) | Charon (Voice) | — (Abilities)
              ----------------------------------------------------------------- */}
          {showLoadoutModal && (
            <div className="hitodama-loadout-view">
              <CompanionShaderBackdrop opacity={0.3} speed={0.6} hue={215} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2, paddingBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px' }}>💧</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Hitodama</span>
                  <span className="companion-badge-cyan">Loadout</span>
                </div>
                <button
                  onClick={() => setShowLoadoutModal(false)}
                  title="Close Loadout (Esc)"
                  className="companion-header-circle"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg
                  width="688"
                  height="360"
                  viewBox="0 0 688 360"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                  <path d="M 200 90 C 265 95, 275 175, 300 180" stroke="rgba(92, 184, 255, 0.45)" strokeWidth="1.8" fill="none" strokeDasharray="4 2" />
                  <path d="M 200 270 C 265 265, 275 185, 300 180" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" fill="none" />
                  <path d="M 488 90 C 423 95, 413 175, 388 180" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" fill="none" />
                  <path d="M 488 270 C 423 265, 413 185, 388 180" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" fill="none" />
                </svg>

                <div
                  onClick={cycleSoulSkin}
                  title="Click to cycle Soul Skin"
                  className="companion-soul-portal"
                >
                  <SoulCanvas soul={currentSoul} width={68} height={56} scale={0.95} mode="LISTENING" />
                </div>

                {/* Slot 1: Hitodama Soul */}
                <button
                  onClick={cycleSoulSkin}
                  className="companion-mind-node active"
                  style={{ top: '64px', left: '64px' }}
                >
                  <span style={{ fontSize: '15px', color: '#5CB8FF' }}>✨</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>Hitodama</div>
                    <div className="companion-mono-tiny">Soul</div>
                  </div>
                </button>

                {/* Slot 2: — Abilities */}
                <button
                  onClick={() => setAbilityIdx((i) => (i + 1) % ABILITIES.length)}
                  className="companion-mind-node"
                  style={{ bottom: '58px', left: '64px' }}
                >
                  <span style={{ fontSize: '15px' }}>🚀</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>
                      {ABILITIES[abilityIdx]}
                    </div>
                    <div className="companion-mono-tiny">Abilities</div>
                  </div>
                </button>

                {/* Slot 3: True Chad Personality */}
                <button
                  onClick={() => setPersonalityIdx((i) => (i + 1) % PERSONALITIES.length)}
                  className="companion-mind-node"
                  style={{ top: '64px', right: '64px' }}
                >
                  <span style={{ fontSize: '15px' }}>☻</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>
                      {PERSONALITIES[personalityIdx]}
                    </div>
                    <div className="companion-mono-tiny">Personality</div>
                  </div>
                </button>

                {/* Slot 4: Charon Voice */}
                <button
                  onClick={() => setVoiceIdx((i) => (i + 1) % VOICES.length)}
                  className="companion-mind-node"
                  style={{ bottom: '58px', right: '64px' }}
                >
                  <span style={{ fontSize: '15px' }}>🕪</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>
                      {VOICES[voiceIdx]}
                    </div>
                    <div className="companion-mono-tiny">Voice</div>
                  </div>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px', position: 'relative', zIndex: 2 }}>
                <div className="companion-bottom-dock">
                  <button
                    onClick={() => {
                      setShowLoadoutModal(false);
                      setIsExpanded(true);
                      setActiveTab('Controls');
                    }}
                    className="companion-dock-icon"
                  >
                    🏠
                  </button>
                  <button
                    onClick={() => {
                      setShowLoadoutModal(false);
                      setIsExpanded(true);
                      setActiveTab('Clipboard');
                    }}
                    className="companion-dock-icon"
                  >
                    🔗
                  </button>
                  <button className="companion-dock-active-pill">💧 Soul</button>
                  <button
                    onClick={() => {
                      setShowLoadoutModal(false);
                      setIsExpanded(true);
                      setActiveTab('Apps');
                    }}
                    className="companion-dock-icon"
                  >
                    A
                  </button>
                  <button
                    onClick={() => {
                      setShowLoadoutModal(false);
                      setIsExpanded(true);
                      setActiveTab('Stats');
                    }}
                    className="companion-dock-icon"
                  >
                    ⚙
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};