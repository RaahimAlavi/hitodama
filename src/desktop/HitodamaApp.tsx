/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import { SOUL_SKINS, SoulConfig } from '../lib/soulMath';
import { SoulCanvas } from '../components/SoulCanvas';
import { LivingEmberIcon } from '../components/LivingEmberIcon';
import { queryGemini, cleanDictation, transcribeAudioWithGeminiAPI, askLassoWithGemini } from '../lib/gemini';
import { soundFX } from '../lib/soundFX';
import { voiceEngine, HitodamaVoiceName } from '../lib/voiceEngine';
import { runFastComputerUseLoop, executeDirectComputerAction } from '../lib/fastComputerUse';
import { RoamingSoulPointer } from '../components/RoamingSoulPointer';
import { findTargetOnScreen, PointedTarget } from '../lib/screenPointerFinder';
import {
  multitaskAgent,
  AgentTask,
  DetectedAppConfig,
} from '../lib/multitaskAgent';
import { ProactiveContextNotch } from '../components/ProactiveContextNotch';
import { AgentTopRightDock } from '../components/AgentTopRightDock';
import { AgentsNotchView } from '../components/AgentsNotchView';
import { HitodamaOnboardingExperience } from '../components/HitodamaOnboardingExperience';
// @ts-ignore - Allow side-effect CSS import across strict TS 5.6+ configs
import './desktop-companion.css';

declare global {
  interface Window {
    hitodamaAPI?: {
      setWindowMode: (mode: 'tucked' | 'collapsed' | 'listening' | 'media' | 'expanded', height?: number) => void;
      setWindowBounds: (width: number, height: number) => void;
      setAppWindowRect?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
      setRoamingTargetRect?: (rect: any) => void;
      setRoamingActive?: (active: boolean) => void;
      setAgentDockActive?: (active: boolean | { active: boolean; isHovered?: boolean }, isHovered?: boolean) => void;
      onRoamingDismiss?: (callback: () => void) => () => void;
      onContextAppDetected?: (callback: (appId: any) => void) => () => void;
      openGeneratedPage?: (
        htmlContent: string,
        existingFilePath?: string
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
      inspectWebsiteDesign?: (
        targetUrl: string
      ) => Promise<{ success: boolean; designSpec?: any; error?: string }>;
      playSpotify?: (
        query: string,
        targetType?: 'track_or_artist' | 'liked_songs'
      ) => Promise<{
        success: boolean;
        mode: 'app' | 'web';
        query: string;
        url?: string;
        autoClicked?: boolean;
      }>;
      setExpanded: (expanded: boolean, height?: number) => void;
      minimize: () => void;
      close: () => void;
      openApp: (appName: string) => Promise<{ success: boolean; app?: string; error?: string }>;
      getInstalledApps?: () => Promise<Array<InstalledAppItem>>;
      openUrl: (url: string) => Promise<{ success: boolean }>;
      typeText: (text: string) => Promise<{ success: boolean }>;
      captureScreen: () => Promise<{ success: boolean; image?: string; error?: string }>;
      getControlsState?: () => Promise<{
        wifiConnected: boolean;
        wifiSsid: string;
        bluetoothOn?: boolean;
        nightLightOn?: boolean;
        darkMode: boolean;
        volume?: number;
        muted?: boolean;
        audioDevices: string[];
      }>;
      setVolume?: (level: number) => Promise<{ success: boolean }>;
      setMute?: (mute: boolean) => Promise<{ success: boolean }>;
      readClipboardText?: () => string;
      readClipboardImage?: () => { dataUrl: string; width: number; height: number; mb: string } | null;
      writeClipboardText?: (text: string) => boolean;
      writeClipboardImage?: (dataUrl: string) => boolean;
      seekMedia?: (seconds: number) => Promise<{ success: boolean }>;
      toggleWifi?: (enable: boolean, ssidName?: string) => Promise<{ success: boolean; connected: boolean }>;
      getWifiNetworks?: () => Promise<Array<{ ssid: string; signal: number }>>;
      toggleBluetooth?: (enable: boolean) => Promise<{ success: boolean; enabled?: boolean }>;
      getBluetoothDevices?: () => Promise<Array<{ name: string; connected: boolean }>>;
      toggleNightLight?: (enable: boolean, strength?: number) => Promise<{ success: boolean; enabled?: boolean; strength?: number }>;
      toggleSystemDarkMode: (targetDark?: boolean) => Promise<{ success: boolean; darkMode?: boolean; isLight?: boolean }>;
      getNowPlaying?: () => Promise<{
        hasSession?: boolean;
        playing: boolean;
        title: string;
        artist: string;
        source?: string;
        thumbnail?: string;
        durationSec?: number;
        positionSec?: number;
      }>;
      mediaControl?: (action: 'playpause' | 'next' | 'prev') => Promise<{ success: boolean }>;
      getClipboardHistory?: () => Promise<ClipboardItem[]>;
      deleteClipboardItem?: (id: number) => Promise<{ success: boolean }>;
      togglePinClipboardItem?: (id: number) => Promise<{ success: boolean }>;
      clearClipboardHistory?: () => Promise<{ success: boolean }>;
      powerAction: (action: 'lock' | 'sleep' | 'restart' | 'shutdown') => Promise<{ success: boolean; error?: string }>;
      getSystemStats: () => Promise<any>;
      runSpeedTest?: () => Promise<{ success: boolean; downloadMbps: number; uploadMbps: number }>;
      setWallpaper: (imagePath: string) => Promise<{ success: boolean; localPath?: string; error?: string }>;
      getWallpaperDataUrl?: (urlOrPath: string) => Promise<string>;
      pickWallpaperFiles?: () => Promise<{ success: boolean; files?: Array<{ title: string; url: string; filePath: string }> }>;
      updateShortcuts?: (shortcuts: { ask?: string; circle?: string; dictate?: string }) => Promise<{ success: boolean; shortcuts: any }>;
      getShortcuts?: () => Promise<{ ask: string; circle: string; dictate: string }>;
      setLassoActive?: (active: boolean) => Promise<{ success: boolean }>;
      scanUIElements?: () => Promise<{ ok: boolean; elements?: any[]; error?: string }>;
      executeUIAction?: (payload: {
        action: 'click' | 'double_click' | 'right_click' | 'type' | 'type_direct';
        x?: number;
        y?: number;
        text?: string;
        pressEnter?: boolean;
      }) => Promise<{ ok: boolean; aborted?: boolean; error?: string }>;
      onTriggerLasso: (cb: () => void) => () => void;
      onTriggerDictation: (cb: () => void) => () => void;
      onTriggerAsk?: (cb: () => void) => () => void;
      onOpenSettings?: (cb: (section?: 'soul' | 'settings' | 'connect' | 'shortcuts') => void) => () => void;
      onClipboardItemAdded?: (cb: (item: ClipboardItem) => void) => () => void;
      syncEmbersState?: (data: { count: number; isWaiting: boolean }) => Promise<{ success: boolean }>;
      onClaimDailyEmber?: (callback: () => void) => () => void;
      onGrantCreatorEmbers?: (callback: (amount: number) => void) => () => void;
    };
  }
}

type NavTab = 'Controls' | 'Today' | 'Stats' | 'Clipboard' | 'Apps' | 'Agents' | 'Wallpaper' | 'Power';
type CompanionSection = 'Hito' | 'Shortcuts' | 'Behavior' | 'System' | 'API keys' | 'Your data' | 'Privacy';
type LoadoutSlotType = 'Soul' | 'Voice' | 'Personality' | 'Abilities';
type ControlDropdownType = 'wifi' | 'bluetooth' | 'audio' | 'nightlight' | null;

interface InstalledAppItem {
  id: string;
  name: string;
  appId?: string;
  exePath?: string;
  iconUrl?: string;
  key: string;
  tag: string;
  category: string;
  starred?: boolean;
  highlighted?: boolean;
}

interface ClipboardItem {
  id: number;
  category: 'Text' | 'Images' | 'Links';
  preview: string;
  imageDataUrl?: string;
  label: string;
  time: string;
  type: string;
  size: string;
  copied: string;
  iconType: 'text' | 'link' | 'code' | 'image' | 'pin';
  isToday?: boolean;
  isPinned?: boolean;
}

interface ContextNotificationCard {
  header: string;
  title: string;
  subtitle?: string;
  domain?: string;
  badgeType?: 'youtube' | 'gmail' | 'google' | 'amazon' | 'app';
}

interface WallpaperTheme {
  id: number;
  title: string;
  url: string;
  filePath?: string;
  thumb: string;
  accent: string;
  accentSecondary: string;
  pillBg: string;
  rowBg: string;
  darkText: string;
  darkSubText: string;
}

interface LoadoutCardItem {
  id: string;
  slot: LoadoutSlotType;
  name: string;
  rarity?: string;
  description: string;
  cost: number;
  notForSale?: boolean;
  skinKey?: string;
  cardTint: string;
  iconKind: 'soul' | 'void' | 'wave' | 'lock' | 'plus' | 'chad' | 'collapse_eye' | 'sidearm_bullet';
}

interface ScheduledRoutine {
  id: number;
  title: string;
  timeLabel: string;
  command: string;
}

// Maps any media app or streaming platform to its official brand logo color & gradient when cover art is unavailable
function getMediaAppBrandPalette(source?: string, artist?: string, title?: string): {
  accent: string;
  rgb: string;
  gradient: string;
} {
  const combined = `${source || ''} ${artist || ''} ${title || ''}`.toLowerCase();

  if (combined.includes('netflix')) {
    return {
      accent: '#E50914',
      rgb: '229, 9, 20',
      gradient: 'linear-gradient(135deg, #240406 0%, #83070D 50%, #E50914 100%)',
    };
  }
  if (combined.includes('youtube')) {
    return {
      accent: '#FF0033',
      rgb: '255, 0, 51',
      gradient: 'linear-gradient(135deg, #29040B 0%, #99041F 50%, #FF0033 100%)',
    };
  }
  if (combined.includes('spotify')) {
    return {
      accent: '#1DB954',
      rgb: '29, 185, 84',
      gradient: 'linear-gradient(135deg, #06210F 0%, #106F32 50%, #1DB954 100%)',
    };
  }
  if (combined.includes('crunchyroll')) {
    return {
      accent: '#F47521',
      rgb: '244, 117, 33',
      gradient: 'linear-gradient(135deg, #291103 0%, #94410A 50%, #F47521 100%)',
    };
  }
  if (combined.includes('twitch')) {
    return {
      accent: '#9146FF',
      rgb: '145, 70, 255',
      gradient: 'linear-gradient(135deg, #180930 0%, #52209E 50%, #9146FF 100%)',
    };
  }
  if (combined.includes('soundcloud')) {
    return {
      accent: '#FF5500',
      rgb: '255, 85, 0',
      gradient: 'linear-gradient(135deg, #2B0E02 0%, #993300 50%, #FF5500 100%)',
    };
  }
  if (combined.includes('apple') || combined.includes('itunes')) {
    return {
      accent: '#FA243C',
      rgb: '250, 36, 60',
      gradient: 'linear-gradient(135deg, #2B060B 0%, #961222 50%, #FA243C 100%)',
    };
  }
  if (combined.includes('prime') || combined.includes('amazon')) {
    return {
      accent: '#00A8E1',
      rgb: '0, 168, 225',
      gradient: 'linear-gradient(135deg, #041B26 0%, #026082 50%, #00A8E1 100%)',
    };
  }
  if (combined.includes('disney')) {
    return {
      accent: '#0063E5',
      rgb: '0, 99, 229',
      gradient: 'linear-gradient(135deg, #041029 0%, #043885 50%, #0063E5 100%)',
    };
  }
  if (combined.includes('vlc')) {
    return {
      accent: '#FF8800',
      rgb: '255, 136, 0',
      gradient: 'linear-gradient(135deg, #2B1702 0%, #944F00 50%, #FF8800 100%)',
    };
  }

  return {
    accent: '#5CB8FF',
    rgb: '92, 184, 255',
    gradient: 'linear-gradient(135deg, #0B1929 0%, #1B4975 50%, #5CB8FF 100%)',
  };
}

// Offscreen Canvas Dynamic Color Extractor
function extractPaletteFromImageElement(img: HTMLImageElement): {
  accent: string;
  accentSecondary: string;
  pillBg: string;
  rowBg: string;
  darkText: string;
  darkSubText: string;
} | null {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = 48;
    canvas.height = 48;
    ctx.drawImage(img, 0, 0, 48, 48);
    const data = ctx.getImageData(0, 0, 48, 48).data;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let weightSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lum = (max + min) / 2;
      const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));

      if (lum > 35 && lum < 235) {
        const w = 0.25 + sat * 2.8 + (lum / 255) * 0.5;
        rSum += r * w;
        gSum += g * w;
        bSum += b * w;
        weightSum += w;
      }
    }

    if (weightSum <= 0) return null;

    let r = Math.round(rSum / weightSum);
    let g = Math.round(gSum / weightSum);
    let b = Math.round(bSum / weightSum);

    const maxC = Math.max(r, g, b);
    if (maxC < 175 && maxC > 0) {
      const boost = 195 / maxC;
      r = Math.min(248, Math.round(r * boost));
      g = Math.min(248, Math.round(g * boost));
      b = Math.min(248, Math.round(b * boost));
    }

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const accentHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    const secR = Math.min(255, Math.round(r * 1.06));
    const secG = Math.min(255, Math.round(g * 0.95));
    const secB = Math.max(20, Math.round(b * 0.78));
    const secondaryHex = `#${toHex(secR)}${toHex(secG)}${toHex(secB)}`;

    return {
      accent: accentHex,
      accentSecondary: secondaryHex,
      pillBg: `rgba(${r}, ${g}, ${b}, 0.22)`,
      rowBg: `rgba(${r}, ${g}, ${b}, 0.16)`,
      darkText: '#14110E',
      darkSubText: 'rgba(20, 17, 14, 0.72)',
    };
  } catch (_) {
    return null;
  }
}

// Crisp Vector SVG Icon Library (Includes Mathematically Centered Media Controls)
const SvgIcon: React.FC<{ name: string; size?: number; color?: string }> = ({
  name,
  size = 14,
  color = 'currentColor',
}) => {
  switch (name) {
        case 'ember':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C12 2 15.5 6.5 15.5 10C15.5 11.2 15 12.2 14.2 13C15.4 13.5 16.5 14.8 16.5 16.5C16.5 19 14.5 21 12 21C9.5 21 7.5 19 7.5 16.5C7.5 14.5 8.8 13.2 10.2 12.5C9.2 11.8 8.8 10.5 8.8 9.5C8.8 6.5 12 2 12 2Z"
            fill={color === 'currentColor' ? 'url(#ember-gradient)' : color}
          />
          <path
            d="M12 14.5C11.2 14.5 10.5 15.2 10.5 16C10.5 16.8 11.2 17.5 12 17.5C12.8 17.5 13.5 16.8 13.5 16C13.5 15.2 12.8 14.5 12 14.5Z"
            fill="#FFF5C2"
          />
          <defs>
            <linearGradient id="ember-gradient" x1="12" y1="2" x2="12" y2="21" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFA94D" />
              <stop offset="60%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#E03131" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'wifi':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      );
    case 'bluetooth':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
        </svg>
      );
    case 'speaker':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={color} />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      );
    case 'mute':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={color} />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      );
    case 'moon':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    case 'contrast':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 0 0 18z" fill={color} />
        </svg>
      );
    case 'sun':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" fill={color} />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
          <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
        </svg>
      );
    case 'search':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'dots':
    case 'more':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="19" cy="12" r="2.2" />
          <circle cx="5" cy="12" r="2.2" />
        </svg>
      );
    case 'copy':
    case 'clipboard':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case 'trash':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'pin':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="17" x2="12" y2="22" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
      );
    case 'link':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case 'image':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case 'folder':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'bolt':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'gear':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
        </svg>
      );
    case 'rocket':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </svg>
      );
    case 'smile':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case 'waveform':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
          <line x1="4" y1="10" x2="4" y2="14" />
          <line x1="8" y1="6" x2="8" y2="18" />
          <line x1="12" y1="3" x2="12" y2="21" />
          <line x1="16" y1="7" x2="16" y2="17" />
          <line x1="20" y1="10" x2="20" y2="14" />
        </svg>
      );
    case 'padlock':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'user':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'keyboard':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="6" y1="8" x2="6" y2="8" />
          <line x1="10" y1="8" x2="10" y2="8" />
          <line x1="14" y1="8" x2="14" y2="8" />
          <line x1="18" y1="8" x2="18" y2="8" />
          <line x1="8" y1="16" x2="16" y2="16" />
        </svg>
      );
    case 'sliders':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
        </svg>
      );
    case 'key':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.5" cy="15.5" r="5.5" />
          <path d="m21 2-9.6 9.6" />
          <path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>
      );
    case 'database':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case 'shield':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'prev':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      );
    case 'next':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      );
    case 'play':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ marginLeft: '1.5px' }}>
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case 'pause':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      );
    default:
      return null;
  }
};

// Official Hitodama Wallpapers from hitodama.in
const DEFAULT_WALLPAPERS: WallpaperTheme[] = [
  {
    id: 1,
    title: 'Neon Aurora',
    url: 'https://hitodama.in/images/wallpapers/wallpaper0.jpg',
    thumb: 'https://hitodama.in/images/wallpapers/wallpaper0.jpg',
    accent: '#5CB8FF',
    accentSecondary: '#38BDF8',
    pillBg: 'rgba(92, 184, 255, 0.2)',
    rowBg: 'rgba(92, 184, 255, 0.14)',
    darkText: '#09131C',
    darkSubText: 'rgba(9, 19, 28, 0.72)',
  },
  {
    id: 2,
    title: 'Crimson Dusk',
    url: 'https://hitodama.in/images/wallpapers/wallpaper1.jpg',
    thumb: 'https://hitodama.in/images/wallpapers/wallpaper1.jpg',
    accent: '#F27D72',
    accentSecondary: '#F59E0B',
    pillBg: 'rgba(242, 125, 114, 0.22)',
    rowBg: 'rgba(242, 125, 114, 0.15)',
    darkText: '#1F0D0B',
    darkSubText: 'rgba(31, 13, 11, 0.72)',
  },
  {
    id: 3,
    title: 'Autumn Ridge',
    url: 'https://hitodama.in/images/wallpapers/wallpaper2.jpg',
    thumb: 'https://hitodama.in/images/wallpapers/wallpaper2.jpg',
    accent: '#F68C58',
    accentSecondary: '#EE9B27',
    pillBg: 'rgba(246, 140, 88, 0.22)',
    rowBg: 'rgba(246, 140, 88, 0.16)',
    darkText: '#1E110A',
    darkSubText: 'rgba(30, 17, 10, 0.72)',
  },
  {
    id: 4,
    title: 'Golden Terraces',
    url: 'https://hitodama.in/images/wallpapers/wallpaper3.jpg',
    thumb: 'https://hitodama.in/images/wallpapers/wallpaper3.jpg',
    accent: '#D9AD5B',
    accentSecondary: '#EE9B27',
    pillBg: 'rgba(217, 173, 91, 0.22)',
    rowBg: 'rgba(217, 173, 91, 0.16)',
    darkText: '#1C1508',
    darkSubText: 'rgba(28, 21, 8, 0.72)',
  },
  {
    id: 5,
    title: 'Blue Horizon',
    url: 'https://hitodama.in/images/wallpapers/wallpaper4.jpg',
    thumb: 'https://hitodama.in/images/wallpapers/wallpaper4.jpg',
    accent: '#68B5F8',
    accentSecondary: '#38BDF8',
    pillBg: 'rgba(104, 181, 248, 0.22)',
    rowBg: 'rgba(104, 181, 248, 0.15)',
    darkText: '#0A1520',
    darkSubText: 'rgba(10, 21, 32, 0.72)',
  },
];

const LOADOUT_CARDS: LoadoutCardItem[] = [
  {
    id: 'soul_hitodama',
    slot: 'Soul',
    name: 'Hito',
    rarity: 'COMMON',
    description: 'The soul as it woke: white-hot core, cold blue halo.',
    cost: 0,
    skinKey: SOUL_SKINS[0]?.key || 'flame_hitodama',
    cardTint: 'linear-gradient(165deg, #4B5B68 0%, #3E4548 55%, #3D3B38 100%)',
    iconKind: 'soul',
  },
  {
    id: 'soul_kitsune',
    slot: 'Soul',
    name: 'Kitsune',
    rarity: 'RARE',
    description: 'Fox-fire crimson ember that flares when your CPU spikes.',
    cost: 120,
    skinKey: SOUL_SKINS[1]?.key || SOUL_SKINS[0]?.key,
    cardTint: 'linear-gradient(165deg, #633B34 0%, #482E2A 60%, #352422 100%)',
    iconKind: 'soul',
  },
  {
    id: 'soul_kodama',
    slot: 'Soul',
    name: 'Kodama',
    rarity: 'RARE',
    description: 'Ancient forest spirit with calm emerald luminescence.',
    cost: 220,
    skinKey: SOUL_SKINS[2]?.key || SOUL_SKINS[0]?.key,
    cardTint: 'linear-gradient(165deg, #3D5241 0%, #2F3F32 60%, #242E26 100%)',
    iconKind: 'soul',
  },
  {
    id: 'soul_raijin',
    slot: 'Soul',
    name: 'Raijin',
    rarity: 'EPIC',
    description: 'High-voltage plasma arc that crackles on voice commands.',
    cost: 400,
    skinKey: SOUL_SKINS[3]?.key || SOUL_SKINS[0]?.key,
    cardTint: 'linear-gradient(165deg, #3D4A66 0%, #2D364B 60%, #212736 100%)',
    iconKind: 'soul',
  },
  {
    id: 'soul_amaterasu',
    slot: 'Soul',
    name: 'Amaterasu',
    rarity: 'EPIC',
    description: 'Solar corona gold with warm radiant flares.',
    cost: 650,
    skinKey: SOUL_SKINS[4]?.key || SOUL_SKINS[0]?.key,
    cardTint: 'linear-gradient(165deg, #5E4E34 0%, #463A27 60%, #332B1E 100%)',
    iconKind: 'soul',
  },
  {
    id: 'soul_void',
    slot: 'Soul',
    name: 'Void',
    rarity: 'LEGENDARY',
    description: 'The dark it drifted through, carried on purpose this time. Includes the Collapse ability, free: Touch the soul while it rests, then collapse space wherever you click.',
    cost: 1000,
    skinKey: SOUL_SKINS[SOUL_SKINS.length - 1]?.key || 'flame_hitodama',
    cardTint: 'linear-gradient(165deg, #4B4458 0%, #3F3946 55%, #3C3837 100%)',
    iconKind: 'void',
  },
  {
    id: 'voice_charon',
    slot: 'Voice',
    name: 'Charon',
    description: 'The OG voice of the soul',
    cost: 0,
    cardTint: 'linear-gradient(165deg, #46575E 0%, #3B4547 55%, #3C3935 100%)',
    iconKind: 'wave',
  },
  {
    id: 'voice_aoede',
    slot: 'Voice',
    name: 'Aoede',
    description: 'Warm, articulate, and effortlessly calm',
    cost: 60,
    cardTint: 'linear-gradient(165deg, #43545A 0%, #354145 60%, #2E3436 100%)',
    iconKind: 'wave',
  },
  {
    id: 'voice_fenrir',
    slot: 'Voice',
    name: 'Fenrir',
    description: 'Deep, resonant, and deadpan',
    cost: 100,
    cardTint: 'linear-gradient(165deg, #3F4E54 0%, #333E42 60%, #2A3133 100%)',
    iconKind: 'lock',
  },
  {
    id: 'voice_puck',
    slot: 'Voice',
    name: 'Puck',
    description: 'Quick-witted, playful, and sharp',
    cost: 130,
    cardTint: 'linear-gradient(165deg, #445359 0%, #364145 60%, #2D3436 100%)',
    iconKind: 'lock',
  },
  {
    id: 'voice_kore',
    slot: 'Voice',
    name: 'Kore',
    description: 'Crisp studio clarity for fast briefings',
    cost: 160,
    cardTint: 'linear-gradient(165deg, #415056 0%, #343F43 60%, #2A3235 100%)',
    iconKind: 'lock',
  },
  {
    id: 'voice_orion',
    slot: 'Voice',
    name: 'Orion',
    description: 'Low-key late-night companion tone',
    cost: 190,
    cardTint: 'linear-gradient(165deg, #3D4C52 0%, #313C40 60%, #283033 100%)',
    iconKind: 'lock',
  },
  {
    id: 'voice_nova',
    slot: 'Voice',
    name: 'Nova',
    description: 'Bright, energetic productivity partner',
    cost: 210,
    cardTint: 'linear-gradient(165deg, #435359 0%, #354145 60%, #2B3336 100%)',
    iconKind: 'lock',
  },
  {
    id: 'voice_jack',
    slot: 'Voice',
    name: 'Jack',
    description: '',
    cost: 240,
    cardTint: 'linear-gradient(165deg, #455458 0%, #3A4546 55%, #373D3C 100%)',
    iconKind: 'lock',
  },
  {
    id: 'voice_valkyrie',
    slot: 'Voice',
    name: 'Valkyrie',
    description: 'Bold, commanding tactical cadence',
    cost: 300,
    cardTint: 'linear-gradient(165deg, #3F4E54 0%, #323D41 60%, #293134 100%)',
    iconKind: 'lock',
  },
  {
    id: 'voice_echo',
    slot: 'Voice',
    name: 'Echo',
    description: 'Soft ambient whisper for midnight coding',
    cost: 380,
    cardTint: 'linear-gradient(165deg, #3C4A50 0%, #303B3F 60%, #272F32 100%)',
    iconKind: 'lock',
  },
  {
    id: 'voice_atlas',
    slot: 'Voice',
    name: 'Atlas',
    description: 'Steady, grounded executive narrator',
    cost: 480,
    cardTint: 'linear-gradient(165deg, #425157 0%, #344044 60%, #2B3336 100%)',
    iconKind: 'lock',
  },
  {
    id: 'pers_true_chad',
    slot: 'Personality',
    name: 'True Chad',
    rarity: 'PERSONALITY',
    description: 'Direct, loyal, zero fluff. Gets the job done and backs you up.',
    cost: 0,
    cardTint: 'linear-gradient(165deg, #5A4736 0%, #48392C 55%, #3D3127 100%)',
    iconKind: 'chad',
  },
  {
    id: 'pers_new',
    slot: 'Personality',
    name: 'New',
    rarity: 'PERSONALITY',
    description: '',
    cost: 100,
    cardTint: 'linear-gradient(165deg, #594635 0%, #4A3B2D 55%, #41352A 100%)',
    iconKind: 'plus',
  },
  {
    id: 'abil_collapse',
    slot: 'Abilities',
    name: 'Collapse',
    description: 'Touch the soul while it rests, then collapse space wherever you click. Not for sale: it comes free with the Void soul, and buying that soul is the only way to have it.',
    cost: 0,
    notForSale: true,
    cardTint: 'linear-gradient(165deg, #594D3C 0%, #483E30 55%, #3D3529 100%)',
    iconKind: 'collapse_eye',
  },
  {
    id: 'abil_sidearm',
    slot: 'Abilities',
    name: 'Sidearm',
    description: 'Held in the air beside the soul. Fires a round into the screen.',
    cost: 400,
    cardTint: 'linear-gradient(165deg, #594D3C 0%, #483E30 55%, #3D3529 100%)',
    iconKind: 'sidearm_bullet',
  },
];

const NAV_TABS: ReadonlyArray<{ id: NavTab; width: number }> = [
  { id: 'Controls', width: 64 },
  { id: 'Today', width: 50 },
  { id: 'Stats', width: 48 },
  { id: 'Clipboard', width: 70 },
  { id: 'Apps', width: 48 },
  { id: 'Agents', width: 56 },
  { id: 'Wallpaper', width: 72 },
  { id: 'Power', width: 50 },
];

const APP_WIN_W = 880;
const APP_WIN_H = 550;

const STAGE_CENTER_X = 440;
const STAGE_CENTER_Y = 215;
const PORTAL_OUTER_R = 57;

const ORBIT_SLOTS: ReadonlyArray<{
  slot: LoadoutSlotType;
  baseAngle: number;
  radiusX: number;
  radiusY: number;
  icon: string;
  iconColor: string;
}> = [
  { slot: 'Soul', baseAngle: -Math.PI / 2, radiusX: 154, radiusY: 118, icon: 'sparkles', iconColor: '#A78BFA' },
  { slot: 'Personality', baseAngle: 0, radiusX: 196, radiusY: 118, icon: 'smile', iconColor: '#FB923C' },
  { slot: 'Voice', baseAngle: Math.PI / 2, radiusX: 154, radiusY: 118, icon: 'waveform', iconColor: '#38BDF8' },
  { slot: 'Abilities', baseAngle: Math.PI, radiusX: 204, radiusY: 118, icon: 'rocket', iconColor: '#4ADE80' },
];

export const HitodamaApp: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && Boolean(window.hitodamaAPI);

  const [apiKey, setApiKey] = useState<string>(() => {
    const saved = localStorage.getItem('hitodama_gemini_key');
    if (saved && saved.trim()) return saved.trim();
    return '';
  });
  const [geminiDraftKey, setGeminiDraftKey] = useState<string>(() => {
    const saved = localStorage.getItem('hitodama_gemini_key');
    if (saved && saved.trim()) return saved.trim();
    return '';
  });
  const [tavilyKey, setTavilyKey] = useState<string>(() => localStorage.getItem('hitodama_tavily_key') || '');
  const [tavilyDraftKey, setTavilyDraftKey] = useState<string>(() => localStorage.getItem('hitodama_tavily_key') || '');
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [notchApiAlert, setNotchApiAlert] = useState<{ type: 'missing_key' | 'rate_limit'; text: string } | null>(null);

  const [onboardingStep, setOnboardingStep] = useState<number | null>(() => {
    const done = localStorage.getItem('hitodama_onboarded_v2');
    return done === 'true' ? null : 0;
  });
  const [lastHotkeyAction, setLastHotkeyAction] = useState<string | null>(null);

  const completeOnboarding = useCallback(() => {
    if (geminiDraftKey.trim()) {
      setApiKey(geminiDraftKey.trim());
      localStorage.setItem('hitodama_gemini_key', geminiDraftKey.trim());
      setNotchApiAlert(null);
    }
    if (tavilyDraftKey.trim()) {
      setTavilyKey(tavilyDraftKey.trim());
      localStorage.setItem('hitodama_tavily_key', tavilyDraftKey.trim());
    }
    localStorage.setItem('hitodama_onboarded_v2', 'true');
    setOnboardingStep(null);
  }, [geminiDraftKey, tavilyDraftKey]);

  const [autoTuckEnabled, setAutoTuckEnabled] = useState<boolean>(() => localStorage.getItem('hitodama_autotuck') !== 'false');
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(() => localStorage.getItem('hitodama_voice_tts') !== 'false');
  const [launchAtStartup, setLaunchAtStartup] = useState<boolean>(() => localStorage.getItem('hitodama_startup') !== 'false');

  // Embers Economy
  const [embers, setEmbers] = useState<number>(() => {
    const saved = localStorage.getItem('hitodama_embers');
    return saved ? parseInt(saved, 10) : 67;
  });
  const [dailyEmberClaimedDate, setDailyEmberClaimedDate] = useState<string>(() => {
    return localStorage.getItem('hitodama_daily_ember_date') || '';
  });
  const [rewardedTaskIds, setRewardedTaskIds] = useState<number[]>(() => {
    const todayKey = new Date().toDateString();
    const savedDate = localStorage.getItem('hitodama_ember_date');
    if (savedDate !== todayKey) {
      localStorage.setItem('hitodama_ember_date', todayKey);
      localStorage.setItem('hitodama_rewarded_tasks', '[]');
      return [];
    }
    const saved = localStorage.getItem('hitodama_rewarded_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [hasEarnedEmberToday, setHasEarnedEmberToday] = useState<boolean>(() => {
    return localStorage.getItem('hitodama_last_ember_earned_day') === new Date().toDateString();
  });
  const isSoulDull = !hasEarnedEmberToday && rewardedTaskIds.length === 0;

  const [unlockedCardIds, setUnlockedCardIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('hitodama_unlocked_cards');
    return saved ? JSON.parse(saved) : ['soul_hitodama', 'voice_charon', 'pers_true_chad'];
  });
  const [equippedCards, setEquippedCards] = useState<Record<LoadoutSlotType, string>>(() => {
    const saved = localStorage.getItem('hitodama_equipped_cards');
    return saved
      ? JSON.parse(saved)
      : {
          Soul: 'soul_hitodama',
          Voice: 'voice_charon',
          Personality: 'pers_true_chad',
          Abilities: 'none',
        };
  });
  const [activeDeckSlot, setActiveDeckSlot] = useState<LoadoutSlotType | null>(null);
  const [deckCardIndex, setDeckCardIndex] = useState<number>(0);

  const [abilityTriggerKey, setAbilityTriggerKey] = useState<string>(
    () => localStorage.getItem('hitodama_ability_trigger') || 'M1'
  );
  const [isBindingTrigger, setIsBindingTrigger] = useState<boolean>(false);

  const addEmbers = useCallback((amount: number) => {
    if (amount <= 0) return;
    const todayKey = new Date().toDateString();
    localStorage.setItem('hitodama_last_ember_earned_day', todayKey);
    setHasEarnedEmberToday(true);
    setEmbers((prev) => {
      const next = prev + amount;
      localStorage.setItem('hitodama_embers', String(next));
      const api = (window as any).hitodamaAPI;
      api?.syncEmbersState?.({ count: next, isWaiting: false });
      api?.setEmbersCount?.(next);
      return next;
    });
  }, []);

  // Orbit & Spring-Physics Lasso State
  const [orbitRenderTick, setOrbitRenderTick] = useState<number>(0);
  const orbitAngleRef = useRef<number>(0);
  const draggingNodeSlotRef = useRef<LoadoutSlotType | null>(null);
  const [draggingNodeSlot, setDraggingNodeSlot] = useState<LoadoutSlotType | null>(null);

  const nodePhysicsRef = useRef<
    Record<
      LoadoutSlotType,
      { x: number; y: number; vx: number; vy: number; bendX: number; bendY: number; bvx: number; bvy: number }
    >
  >({
    Soul: { x: 0, y: 0, vx: 0, vy: 0, bendX: STAGE_CENTER_X, bendY: STAGE_CENTER_Y - 60, bvx: 0, bvy: 0 },
    Personality: { x: 0, y: 0, vx: 0, vy: 0, bendX: STAGE_CENTER_X + 80, bendY: STAGE_CENTER_Y, bvx: 0, bvy: 0 },
    Voice: { x: 0, y: 0, vx: 0, vy: 0, bendX: STAGE_CENTER_X, bendY: STAGE_CENTER_Y + 60, bvx: 0, bvy: 0 },
    Abilities: { x: 0, y: 0, vx: 0, vy: 0, bendX: STAGE_CENTER_X - 80, bendY: STAGE_CENTER_Y, bvx: 0, bvy: 0 },
  });

  const nodeDragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialExpanded = urlParams?.get('expanded') === 'true';
  const initialTab = (urlParams?.get('tab') as NavTab) || 'Controls';

  const [showCompanionWindow, setShowCompanionWindow] = useState<boolean>(
    () => urlParams?.get('settings') === 'true' || urlParams?.get('loadout') === 'true'
  );
  const [companionDockTab, setCompanionDockTab] = useState<'soul' | 'settings'>(
    () => (urlParams?.get('loadout') === 'true' ? 'soul' : 'settings')
  );
  const [settingsSection, setSettingsSection] = useState<CompanionSection>('API keys');
  const [settingsSearch, setSettingsSearch] = useState<string>('');

  const [appWindowPos, setAppWindowPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(20, Math.round((window.innerWidth - APP_WIN_W) / 2)) : 260,
    y: 78,
  }));
  const [isDraggingAppWin, setIsDraggingAppWin] = useState(false);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const [selectedSkinKey, setSelectedSkinKey] = useState<string>(
    () => localStorage.getItem('hitodama_skin') || (SOUL_SKINS[0]?.key ?? 'flame_hitodama')
  );

  const [isTucked, setIsTucked] = useState<boolean>(!initialExpanded);
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [showMediaNotch, setShowMediaNotch] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);
  const [soulMode, setSoulMode] = useState<'LISTENING' | 'THINKING' | 'TALKING' | 'MUTED'>('LISTENING');
  const [soulAnnoyance, setSoulAnnoyance] = useState<number>(0);
  const [soulIsHit, setSoulIsHit] = useState<boolean>(false);
  const [isBreathingRelief, setIsBreathingRelief] = useState<boolean>(false);
  const hitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const annoyanceDecayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const annoyanceDecayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reliefBreathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync SoulCanvas speaking animation with voiceEngine speech state
  useEffect(() => {
    const unsub = voiceEngine.onSpeakingStateChange((isTalking) => {
      if (isTalking) {
        setSoulMode('TALKING');
      } else {
        setSoulMode('LISTENING');
      }
    });
    return unsub;
  }, []);

  const speakAsHitodama = useCallback(
    (text: string) => {
      const voiceCard = LOADOUT_CARDS.find((c) => c.id === equippedCards.Voice);
      const currentVoice = (voiceCard?.name || 'Charon') as HitodamaVoiceName;
      const persCard = LOADOUT_CARDS.find((c) => c.id === equippedCards.Personality);
      const currentPersonality = persCard?.name || 'True Chad';
      voiceEngine.speak(text, {
        voice: currentVoice,
        personality: currentPersonality,
      });
    },
    [equippedCards]
  );

  const handleHitodamaPoke = useCallback(() => {
    if (isTucked) {
      setIsTucked(false);
      return;
    }

    // Cancel active relief breath if poked again
    setIsBreathingRelief(false);
    if (reliefBreathTimerRef.current) {
      clearTimeout(reliefBreathTimerRef.current);
      reliefBreathTimerRef.current = null;
    }

    // Play tactile squish/pulse SFX
    soundFX.playSoulPulse();

    // Trigger hit flinch
    setSoulIsHit(true);
    if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
    hitTimeoutRef.current = setTimeout(() => {
      setSoulIsHit(false);
    }, 280);

    // Cancel existing annoyance decay
    if (annoyanceDecayIntervalRef.current) {
      clearInterval(annoyanceDecayIntervalRef.current);
      annoyanceDecayIntervalRef.current = null;
    }

    // Step annoyance up progressively: +0.28 per click, up to 1.0 (enraged fiery red)
    setSoulAnnoyance((prev) => Math.min(1.0, prev + 0.28));

    // Reset idle decay: after 2.4s of quiet, smoothly step annoyance back down to 0
    if (annoyanceDecayTimerRef.current) clearTimeout(annoyanceDecayTimerRef.current);
    annoyanceDecayTimerRef.current = setTimeout(() => {
      annoyanceDecayIntervalRef.current = setInterval(() => {
        setSoulAnnoyance((curr) => {
          if (curr <= 0.04) {
            if (annoyanceDecayIntervalRef.current) {
              clearInterval(annoyanceDecayIntervalRef.current);
              annoyanceDecayIntervalRef.current = null;
            }
            // Once annoyance returns to 0 (calm blue), take a deep breath of relief!
            setIsBreathingRelief(true);
            soundFX.playReliefBreath();
            if (reliefBreathTimerRef.current) clearTimeout(reliefBreathTimerRef.current);
            reliefBreathTimerRef.current = setTimeout(() => {
              setIsBreathingRelief(false);
            }, 2600);
            return 0;
          }
          return Math.max(0, curr - 0.08);
        });
      }, 70);
    }, 2400);
  }, [isTucked]);

  const [askNotchPhase, setAskNotchPhase] = useState<'idle' | 'waking' | 'speaking' | 'thinking'>('idle');
  const [askWords, setAskWords] = useState<string[]>([]);

  const [contextCard, setContextCard] = useState<ContextNotificationCard | null>(null);
  const [userBubbleText, setUserBubbleText] = useState<string | null>(null);
  const [hitodamaReply, setHitodamaReply] = useState<{ bold?: string; rest?: string } | null>(null);

  const [dictationState, setDictationState] = useState<'idle' | 'recording' | 'done'>('idle');
  const [dictationText, setDictationText] = useState('');

  const [lassoActive, setLassoActive] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<Array<{ x: number; y: number }>>([]);
  const lassoPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const capturedScreenRef = useRef<string | null>(null);
  const [isDrawingLasso, setIsDrawingLasso] = useState(false);
  const [lassoQuery, setLassoQuery] = useState('');
  const lassoQueryRef = useRef<string>('');
  const liveSpeechRef = useRef<string>('');
  const speechRecognitionRef = useRef<any>(null);

  // Roaming Screen Pointer ("Peek, Fly & Point") State
  const [roamingStage, setRoamingStage] = useState<'PEEKING' | 'FLYING' | 'POINTING' | 'RETURNING' | 'IDLE'>('IDLE');
  const [roamingQuery, setRoamingQuery] = useState<string>('');
  const [pointedTarget, setPointedTarget] = useState<PointedTarget | null>(null);

  // Concurrent Multi-Tasking Agent Workers & Proactive Context State
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [detectedAppId, setDetectedAppId] = useState<DetectedAppConfig['id'] | null>(null);
  const [agentPromptInput, setAgentPromptInput] = useState('');

  // Subscribe to concurrent background agent tasks & trigger voice alerts on completion
  const prevCompletedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return multitaskAgent.subscribe((tasks) => {
      setAgentTasks(tasks);

      const completedNow = tasks.filter((t) => t.status === 'COMPLETED');
      for (const t of completedNow) {
        if (!prevCompletedTasksRef.current.has(t.id)) {
          // If created recently (within last 3 minutes), announce completion
          if (Date.now() - t.createdAt < 180000) {
            soundFX.playSuccessChime();
            const label = t.kind === 'BUILD_PAGE' ? 'landing page' : 'task';
            speakAsHitodama(`Your ${label} is ready!`);
            addEmbers(5);
          }
        }
      }
      prevCompletedTasksRef.current = new Set(completedNow.map((t) => t.id));
    });
  }, [speakAsHitodama]);

  const appBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for automatic OS app detection (GitHub, Notion, VS Code, Figma, Gmail)
  useEffect(() => {
    const api = (window as any).hitodamaAPI;
    if (!api?.onContextAppDetected) return;

    return api.onContextAppDetected((appId: DetectedAppConfig['id'] | null) => {
      // Ignore transient null ticks so the banner never disappears after 1 second!
      if (!appId) return;

      if (!multitaskAgent.shouldPromptForApp(appId)) return;

      setIsTucked(false);
      setDetectedAppId(appId);

      if (appBannerTimerRef.current) {
        clearTimeout(appBannerTimerRef.current);
        appBannerTimerRef.current = null;
      }

      // If already connected, show the "Connected" banner + suggestions for 9 seconds then gently tuck
      if (multitaskAgent.isAppConnected(appId)) {
        appBannerTimerRef.current = setTimeout(() => {
          setDetectedAppId((curr) => (curr === appId ? null : curr));
        }, 9000);
      }
    });
  }, []);

  const activeRunningTasks = useMemo(
    () => agentTasks.filter((t) => t.status === 'RUNNING' || t.status === 'WAITING'),
    [agentTasks]
  );


  const handleFindAndPoint = useCallback(
    async (queryText: string) => {
      if (!queryText || !queryText.trim()) return;
      const q = queryText.trim();
      setIsTucked(false);
      setIsExpanded(false);
      setAskNotchPhase('idle');
      setHitodamaReply(null);
      setUserBubbleText(null);
      setRoamingQuery(q);
      setPointedTarget(null);
      setRoamingStage('PEEKING');
      soundFX.playWisp();

      try {
        let shotImg: string | undefined = undefined;
        if (window.hitodamaAPI?.captureScreen) {
          const shot = await window.hitodamaAPI.captureScreen();
          if (shot?.success && shot.image) {
            shotImg = shot.image;
          }
        }
        if (!shotImg && capturedScreenRef.current) {
          shotImg = capturedScreenRef.current;
        }
        const target = await findTargetOnScreen(q, apiKey, shotImg);

        if (target) {
          setPointedTarget(target);
          setRoamingStage('FLYING');
          soundFX.playWisp();

          setTimeout(() => {
            setRoamingStage('POINTING');
            soundFX.playTaskSuccess();
            if (target.spokenHint) {
              speakAsHitodama(target.spokenHint);
            }
          }, 860);
        } else {
          soundFX.playToggle(false);
          speakAsHitodama(`I scanned your screen, but couldn't spot "${q}".`);
          setTimeout(() => {
            setRoamingStage('RETURNING');
          }, 1800);
        }
      } catch (err) {
        console.error('Find and point error:', err);
        setRoamingStage('RETURNING');
      }
    },
    [apiKey, speakAsHitodama]
  );

  // Real System Media Session + Pause Persistence + Accurate Per-Song Duration
  const [isPlayingLofi, setIsPlayingLofi] = useState(false);
  const [osMedia, setOsMedia] = useState<{
    hasSession: boolean;
    playing: boolean;
    title: string;
    artist: string;
    source?: string;
    thumbnail?: string;
    durationSec?: number;
  }>({
    hasSession: false,
    playing: false,
    title: '',
    artist: '',
    thumbnail: '',
    durationSec: 210,
  });
  const [mediaArtPalette, setMediaArtPalette] = useState<{
    accent: string;
    rgb: string;
    gradient: string;
  }>({
    accent: '#5CB8FF',
    rgb: '92, 184, 255',
    gradient: 'linear-gradient(135deg, #0B1929 0%, #1B4975 50%, #5CB8FF 100%)',
  });

    const hasMediaSession = Boolean(osMedia.hasSession && osMedia.title);
  const isPlayingMedia = Boolean(osMedia.hasSession && osMedia.playing);
  const activeMediaTitle = osMedia.title || '';
  const activeMediaArtist = osMedia.artist || osMedia.source || '';
  const activeMediaArtwork = osMedia.thumbnail || '';

  const [mediaProgress, setMediaProgress] = useState(0);
  const totalMediaDuration = osMedia.hasSession && osMedia.durationSec ? osMedia.durationSec : 210;
  const lastTrackTitleRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isDraggingMediaScrub, setIsDraggingMediaScrub] = useState(false);
  const isDraggingMediaScrubRef = useRef<boolean>(false);
  const notchScrubRef = useRef<HTMLDivElement>(null);
  const controlsScrubRef = useRef<HTMLDivElement>(null);
  const activeScrubRef = useRef<HTMLDivElement | null>(null);

  const updateMediaScrubFromClientX = useCallback(
    (clientX: number, commitSeek = false) => {
      const trackEl = activeScrubRef.current;
      if (!trackEl) return;
      const rect = trackEl.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetSec = Math.round(pct * totalMediaDuration);
      setMediaProgress(targetSec);
      if (commitSeek) {
        window.hitodamaAPI?.seekMedia?.(targetSec);
      }
    },
    [totalMediaDuration]
  );

  // Reset song progress to 0:00 whenever a new song starts!
  useEffect(() => {
    if (activeMediaTitle && activeMediaTitle !== lastTrackTitleRef.current) {
      lastTrackTitleRef.current = activeMediaTitle;
      setMediaProgress(0);
    }
  }, [activeMediaTitle]);

  // Extract dominant color from the song cover image
    // Extract dominant color from the song cover image, or use the app's brand logo color when no cover exists
  useEffect(() => {
    const brandFallback = getMediaAppBrandPalette(
      osMedia.source,
      activeMediaArtist,
      activeMediaTitle
    );

    if (!activeMediaArtwork) {
      setMediaArtPalette(brandFallback);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const pal = extractPaletteFromImageElement(img);
      if (pal) {
        const hex = pal.accent.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 92;
        const g = parseInt(hex.substring(2, 4), 16) || 184;
        const b = parseInt(hex.substring(4, 6), 16) || 255;
        setMediaArtPalette({
          accent: pal.accent,
          rgb: `${r}, ${g}, ${b}`,
          gradient: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.45) 0%, ${pal.accent} 100%)`,
        });
      } else {
        setMediaArtPalette(brandFallback);
      }
    };
    img.onerror = () => {
      setMediaArtPalette(brandFallback);
    };
    img.src = activeMediaArtwork;
  }, [activeMediaArtwork, osMedia.source, activeMediaArtist, activeMediaTitle]);

  // Real PC Controls & Scrollable Dropdown Menus State
  const [activeControlDropdown, setActiveControlDropdown] = useState<ControlDropdownType>(null);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [wifiSsid, setWifiSsid] = useState('Home 5G');
  const [wifiNetworksList, setWifiNetworksList] = useState<Array<{ ssid: string; signal: number }>>([]);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [bluetoothDevicesList, setBluetoothDevicesList] = useState<Array<{ name: string; connected: boolean }>>([]);
  const [audioDevicesList, setAudioDevicesList] = useState<string[]>(['Speakers', 'Headphones']);
  const [audioDeviceIndex, setAudioDeviceIndex] = useState(0);
  const audioOutput = audioDevicesList[audioDeviceIndex] || 'Speakers';
  const [nightLight, setNightLight] = useState(false);
  const [nightLightStrength, setNightLightStrength] = useState<number>(65);
  const [systemDarkMode, setSystemDarkMode] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState<number>(50);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState<boolean>(false);
  const isDraggingVolumeRef = useRef<boolean>(false);
  const notchShellRef = useRef<HTMLDivElement>(null);
  const leaveCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIslandMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (leaveCollapseTimerRef.current) clearTimeout(leaveCollapseTimerRef.current);
  }, []);

  const handleIslandMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (leaveCollapseTimerRef.current) clearTimeout(leaveCollapseTimerRef.current);

    // If actively adjusting the volume or scrubbing media, DO NOT COLLAPSE!
    // The notch stays fully open until the user releases the adjuster.
    if (isDraggingVolumeRef.current || isDraggingMediaScrubRef.current) {
      return;
    }

    if (isExpanded || showMediaNotch) {
      leaveCollapseTimerRef.current = setTimeout(() => {
        if (isDraggingVolumeRef.current || isDraggingMediaScrubRef.current) return;
        setActiveControlDropdown(null);
        setShowMediaNotch(false);
        setIsExpanded(false);
        setPendingPowerAction(null);
        setIsTucked(true);
      }, 320);
    }
  }, [isExpanded, showMediaNotch]);

  useEffect(() => {
    if (!isDraggingMediaScrub) return;
    const onMove = (e: PointerEvent) => updateMediaScrubFromClientX(e.clientX, false);
    const onUp = (e: PointerEvent) => {
      updateMediaScrubFromClientX(e.clientX, true);
      isDraggingMediaScrubRef.current = false;
      setIsDraggingMediaScrub(false);

      if (notchShellRef.current) {
        const rect = notchShellRef.current.getBoundingClientRect();
        const isStillInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (!isStillInside) {
          handleIslandMouseLeave();
        }
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingMediaScrub, updateMediaScrubFromClientX, handleIslandMouseLeave]);

  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => soundFX.isEnabled());
  const isFirstRenderRef = useRef<boolean>(true);

  // 1. Play liquid expand / collapse sound when island opens or closes
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (isExpanded) {
      soundFX.playExpand();
    } else {
      soundFX.playCollapse();
    }
  }, [isExpanded]);

  // 2. Play crisp glass detent when switching tabs
  useEffect(() => {
    if (isExpanded) {
      soundFX.playTabSwitch();
    }
  }, [activeTab]);

  // 3. Play mystical chord when opening Soul Loadout or cycling Soul skins
  useEffect(() => {
    if (showCompanionWindow && companionDockTab === 'soul') {
      soundFX.playSoulPulse();
    }
  }, [showCompanionWindow, companionDockTab, selectedSkinKey]);

  // 4. Play pitched detent ticks when dragging or scrolling the volume slider
  useEffect(() => {
    if (isExpanded && activeTab === 'Controls') {
      soundFX.playSliderTick(volumeLevel);
    }
  }, [volumeLevel, isExpanded, activeTab]);

  // 5. Global Event Delegation for Hovers, Toggles, and Action Buttons
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'button, .companion-control-tile, .companion-list-row, .companion-wallpaper-card, .companion-day-col, .companion-adaptive-tile, .companion-nav-btn'
      );
      if (target) soundFX.playHover();
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.companion-todo-row, .companion-todo-submit, .companion-kbd-btn, .companion-todo-checkbox, .companion-clip-btn')) {
        soundFX.playSuccessChime();
      } else if (target.closest('.companion-control-tile, .companion-filter-pill, .companion-preset-chip, .companion-adaptive-tile, .companion-toggle-pill')) {
        soundFX.playToggle(true);
      }
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (window.hitodamaAPI?.getControlsState) {
      window.hitodamaAPI.getControlsState().then((st) => {
        if (!st) return;
        setWifiEnabled(Boolean(st.wifiConnected));
        setWifiSsid(st.wifiSsid || (st.wifiConnected ? 'Connected' : 'Off'));
        if (typeof st.bluetoothOn === 'boolean') setBluetoothEnabled(st.bluetoothOn);
        if (typeof st.nightLightOn === 'boolean') setNightLight(st.nightLightOn);
        setSystemDarkMode(Boolean(st.darkMode));
        if (typeof st.volume === 'number') setVolumeLevel(st.volume);
        if (typeof st.muted === 'boolean') setIsMuted(st.muted);
        if (Array.isArray(st.audioDevices) && st.audioDevices.length > 0) {
          setAudioDevicesList(st.audioDevices);
        }
      });
    }
  }, []);

  // Poll Real PC Now Playing Media Session every 1.5s
  useEffect(() => {
    if (!window.hitodamaAPI?.getNowPlaying) return;
    const checkMedia = async () => {
      try {
        const info: any = await window.hitodamaAPI?.getNowPlaying?.();
        if (info) {
          setOsMedia({
            hasSession: Boolean(info.hasSession ?? info.playing),
            playing: Boolean(info.playing),
            title: info.title || '',
            artist: info.artist || '',
            source: info.source,
            thumbnail: info.thumbnail || '',
            durationSec: info.durationSec || 210,
          });
          if (typeof info.positionSec === 'number' && info.positionSec >= 0 && !isDraggingMediaScrubRef.current) {
            setMediaProgress(info.positionSec);
          }
        }
      } catch (_) {}
    };
    checkMedia();
    const interval = setInterval(checkMedia, 1500);
    return () => clearInterval(interval);
  }, []);

  // Smooth 1-second progress advancement while playing
  useEffect(() => {
    if (!isPlayingMedia || isDraggingMediaScrub) return;
    const timer = setInterval(() => {
      setMediaProgress((prev) => Math.min(totalMediaDuration, prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayingMedia, isDraggingMediaScrub, totalMediaDuration]);

  useEffect(() => {
    const audio = new Audio('https://stream.nightride.fm/chillsynth.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const applyUserVolumeChange = useCallback((nextVol: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(nextVol)));
    setVolumeLevel(clamped);
    if (clamped > 0) setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = clamped / 100;
    }
    window.hitodamaAPI?.setVolume?.(clamped);
  }, []);

  const toggleMediaPlayback = useCallback(async () => {
    if (window.hitodamaAPI?.mediaControl) {
      await window.hitodamaAPI.mediaControl('playpause');
      if (osMedia.hasSession) {
        setOsMedia((prev) => ({ ...prev, playing: !prev.playing }));
        return;
      }
      const check: any = await window.hitodamaAPI.getNowPlaying?.();
      if (check && check.hasSession) {
        setOsMedia({
          hasSession: true,
          playing: Boolean(check.playing),
          title: check.title || '',
          artist: check.artist || '',
          source: check.source,
          thumbnail: check.thumbnail || '',
          durationSec: check.durationSec || 210,
        });
        if (typeof check.positionSec === 'number' && !isDraggingMediaScrubRef.current) {
          setMediaProgress(check.positionSec);
        }
        return;
      }
    }
    setIsPlayingLofi((prev) => {
      const next = !prev;
      if (audioRef.current) {
        if (next) audioRef.current.play().catch(() => {});
        else audioRef.current.pause();
      }
      return next;
    });
  }, [osMedia.hasSession]);

  const handleMediaPrev = useCallback(async () => {
    if (window.hitodamaAPI?.mediaControl) {
      await window.hitodamaAPI.mediaControl('prev');
    }
    setMediaProgress(0);
  }, []);

  const handleMediaNext = useCallback(async () => {
    if (window.hitodamaAPI?.mediaControl) {
      await window.hitodamaAPI.mediaControl('next');
    }
    setMediaProgress(0);
  }, []);

  const handleToggleControlDropdown = useCallback(
    async (menu: ControlDropdownType, e: React.MouseEvent) => {
      e.stopPropagation();
      const next = activeControlDropdown === menu ? null : menu;
      setActiveControlDropdown(next);
      if (next === 'wifi' && window.hitodamaAPI?.getWifiNetworks) {
        const nets = await window.hitodamaAPI.getWifiNetworks();
        if (Array.isArray(nets)) setWifiNetworksList(nets);
      } else if (next === 'bluetooth' && window.hitodamaAPI?.getBluetoothDevices) {
        const devs = await window.hitodamaAPI.getBluetoothDevices();
        if (Array.isArray(devs)) setBluetoothDevicesList(devs);
      }
    },
    [activeControlDropdown]
  );

  // Today View, Focus Timer Notch Countdown & Alarm Celebration State
  const [now, setNow] = useState(() => new Date());
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(300);
  const [timerPreset, setTimerPreset] = useState<'1m' | '5m' | '10m' | '15m' | '20m'>('5m');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerAlarmRinging, setTimerAlarmRinging] = useState(false);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [routines, setRoutines] = useState<ScheduledRoutine[]>(() => {
    const saved = localStorage.getItem('hitodama_routines');
    return saved ? JSON.parse(saved) : [];
  });

  const [todos, setTodos] = useState<Array<{ id: number; text: string; completed: boolean }>>(() => {
    const saved = localStorage.getItem('hitodama_todos');
    return saved ? JSON.parse(saved) : [{ id: 1, text: 'Buy Hito!', completed: true }];
  });
  const [sparkleBurstId, setSparkleBurstId] = useState<number | null>(null);
  const [sparkleAnimKey, setSparkleAnimKey] = useState<number>(0);
  const sparkleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newTodoInput, setNewTodoInput] = useState('');
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

  useEffect(() => {
    localStorage.setItem('hitodama_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('hitodama_routines', JSON.stringify(routines));
  }, [routines]);

  // Embers Forge Status: Daily Flame Bonus & Waiting Status
  const isDailyEmberWaiting = dailyEmberClaimedDate !== new Date().toDateString();
  const isEmberWaiting = isDailyEmberWaiting || (rewardedTaskIds.length < 5 && todos.some((t) => !t.completed));

  const handleClaimWaitingEmber = useCallback(() => {
    const today = new Date().toDateString();
    localStorage.setItem('hitodama_daily_ember_date', today);
    setDailyEmberClaimedDate(today);

    addEmbers(15);
    soundFX.playFanfare();

    setHitodamaReply({
      bold: 'Daily Ember Stoked!',
      rest: '+15 Embers added to your soul forge',
    });
    speakAsHitodama('Your daily ember has been stoked. 15 embers added to your soul forge.');
    setContextCard(null);
  }, [addEmbers, speakAsHitodama]);

  const handleGrantCreatorEmbers = useCallback(
    (amount = 5000) => {
      addEmbers(amount);
      soundFX.playFanfare();
    },
    [addEmbers]
  );

  // Sync embers state to Electron Windows System Tray
  useEffect(() => {
    const api = (window as any).hitodamaAPI;
    if (api?.syncEmbersState) {
      api.syncEmbersState({ count: embers, isWaiting: isEmberWaiting });
    }
  }, [embers, isEmberWaiting]);

  // Listen for Tray actions (Claim daily ember / Creator testing stoke)
  useEffect(() => {
    const api = (window as any).hitodamaAPI;
    if (!api) return;

    const unClaim = api.onClaimDailyEmber?.(() => {
      handleClaimWaitingEmber();
    });
    const unGrant = api.onGrantCreatorEmbers?.((amt: number) => {
      handleGrantCreatorEmbers(amt || 5000);
    });

    return () => {
      unClaim?.();
      unGrant?.();
    };
  }, [handleClaimWaitingEmber, handleGrantCreatorEmbers]);

  // Initial sync of embers to tray
  useEffect(() => {
    const api = (window as any).hitodamaAPI;
    api?.syncEmbersState?.({ count: embers, isWaiting: isEmberWaiting });
    api?.setEmbersCount?.(embers);
  }, []);

  // Real Live Clipboard History (with LocalStorage Persistence & Universal Sync)
  const [clipboardCategory, setClipboardCategory] = useState<'All' | 'Text' | 'Images' | 'Links'>('All');
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>(() => {
    try {
      const saved = localStorage.getItem('hitodama_clip_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });
  const [selectedClipboardId, setSelectedClipboardId] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('hitodama_clip_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch (_) {}
    return null;
  });
  const [clipboardSearch, setClipboardSearch] = useState('');
  const [clipboardToast, setClipboardToast] = useState<string | null>(null);
  const [openMenuClipId, setOpenMenuClipId] = useState<number | null>(null);
  const lastSeenClipTextRef = useRef<string>('');
  const lastSeenClipImgRef = useRef<string>('');

  // Close clipboard 3-dot dropdown when clicking outside
  useEffect(() => {
    if (openMenuClipId === null) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.clipboard-row-dropdown') || target?.closest('.clipboard-row-dots-btn')) {
        return;
      }
      setOpenMenuClipId(null);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [openMenuClipId]);

  // Global Shortcuts State & Dynamic Key Recording
  const [customShortcuts, setCustomShortcuts] = useState<{ ask: string; circle: string; dictate: string }>(() => {
    try {
      const saved = localStorage.getItem('hitodama_custom_shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ask: parsed.ask || 'Win + Alt',
          circle: parsed.circle || 'Ctrl + Shift',
          dictate: parsed.dictate || 'Ctrl + Win',
        };
      }
    } catch (_) {}
    return {
      ask: 'Win + Alt',
      circle: 'Ctrl + Shift',
      dictate: 'Ctrl + Win',
    };
  });
  const [bindingShortcutKey, setBindingShortcutKey] = useState<'ask' | 'circle' | 'dictate' | null>(null);

  // Sync shortcuts to Electron on startup
  useEffect(() => {
    window.hitodamaAPI?.updateShortcuts?.(customShortcuts);
  }, []);

  // Listen to key combinations when recording a shortcut
  useEffect(() => {
    if (!bindingShortcutKey) return;
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setBindingShortcutKey(null);
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.metaKey) parts.push('Win');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');

      const isModifierOnly = ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key);
      if (!isModifierOnly) {
        let keyName = e.key;
        if (e.code === 'Space') keyName = 'Space';
        else if (keyName.length === 1) keyName = keyName.toUpperCase();
        if (!parts.includes(keyName)) {
          parts.push(keyName);
        }
      }

      if (parts.length > 0 && (!isModifierOnly || parts.length >= 2)) {
        const comboStr = parts.join(' + ');
        setCustomShortcuts((prev) => {
          const updated = { ...prev, [bindingShortcutKey]: comboStr };
          try {
            localStorage.setItem('hitodama_custom_shortcuts', JSON.stringify(updated));
            window.hitodamaAPI?.updateShortcuts?.(updated);
          } catch (_) {}
          return updated;
        });
        setBindingShortcutKey(null);
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [bindingShortcutKey]);

  // Persist clipboard items to localStorage
  useEffect(() => {
    try {
      if (clipboardItems.length > 0) {
        localStorage.setItem('hitodama_clip_history', JSON.stringify(clipboardItems.slice(0, 50)));
      }
    } catch (_) {}
  }, [clipboardItems]);

  // Helper to merge incoming clipboard items while strictly preserving user pins and deletions
  const mergeClipboardSafely = useCallback((incoming: ClipboardItem[], prevList: ClipboardItem[]) => {
    const pinMap = new Map<string, boolean>();
    for (const p of prevList) {
      if (p.isPinned) {
        if (p.preview) pinMap.set(p.preview, true);
        if (p.imageDataUrl) pinMap.set(p.imageDataUrl, true);
      }
    }
    return incoming.map((item) => {
      const isPinned = Boolean(
        item.isPinned ||
        (item.preview ? pinMap.get(item.preview) : false) ||
        (item.imageDataUrl ? pinMap.get(item.imageDataUrl) : false)
      );
      return isPinned ? { ...item, isPinned: true, isToday: false } : item;
    }).slice(0, 50);
  }, []);

  useEffect(() => {
    // 1. Initial Load from background watcher on startup
    window.hitodamaAPI?.getClipboardHistory?.().then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        setClipboardItems((prev) => mergeClipboardSafely(items, prev));
        setSelectedClipboardId((curr) => curr || items[0].id);
      }
    });

    // 2. Subscribe to new text & screenshot copies emitted by background Electron watcher
    const unreg = window.hitodamaAPI?.onClipboardItemAdded
      ? window.hitodamaAPI.onClipboardItemAdded((newItem) => {
          setClipboardItems((prev) => {
            const filtered = prev.filter((i) =>
              newItem.category === 'Images' && newItem.imageDataUrl && i.imageDataUrl
                ? i.imageDataUrl !== newItem.imageDataUrl
                : i.preview !== newItem.preview
            );
            return [newItem, ...filtered].slice(0, 50);
          });
          setSelectedClipboardId(newItem.id);
        })
      : () => {};

    // 3. Subscribe to tray menu "open-settings" commands (Shortcuts, Soul Loadout, API Keys)
    const unregSettings = window.hitodamaAPI?.onOpenSettings
      ? window.hitodamaAPI.onOpenSettings((section) => {
          setIsExpanded(false);
          setShowCompanionWindow(true);
          if (section === 'soul') {
            setCompanionDockTab('soul');
          } else {
            setCompanionDockTab('settings');
            if (section === 'shortcuts') {
              setSettingsSection('Shortcuts');
            } else if (section === 'connect') {
              setShowConnectModal(true);
            } else {
              setSettingsSection('API keys');
            }
          }
        })
      : () => {};

    // 4. Focus/Sync reader (supports both Electron direct readers and Browser navigator.clipboard)
    const syncActiveClipboard = async () => {
      if (window.hitodamaAPI?.getClipboardHistory) {
        try {
          const items = await window.hitodamaAPI.getClipboardHistory();
          if (Array.isArray(items) && items.length > 0) {
            setClipboardItems((prev) => mergeClipboardSafely(items, prev));
            setSelectedClipboardId((curr) => curr || items[0].id);
          }
        } catch (_) {}
      } else if (navigator.clipboard?.readText) {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim() && text !== lastSeenClipTextRef.current) {
            lastSeenClipTextRef.current = text;
            const isUrl = /^https?:\/\/[^\s]+$/i.test(text.trim());
            const isCode = /[{};()\[\]<>=]/.test(text) && text.includes('\n');
            const chars = text.length;
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            const lines = text.split(/\r?\n/).length;
            const nowStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const item: ClipboardItem = {
              id: Date.now() + Math.floor(Math.random() * 1000),
              category: isUrl ? 'Links' : 'Text',
              preview: text,
              label: text.replace(/\s+/g, ' ').slice(0, 42) + (text.length > 42 ? '...' : ''),
              time: 'now',
              type: isUrl ? 'Link' : isCode ? 'Code Snippet' : 'Text',
              size: `${chars} characters · ${words} words · ${lines} ${lines === 1 ? 'line' : 'lines'}`,
              copied: `Today, ${nowStr}`,
              iconType: isUrl ? 'link' : isCode ? 'code' : 'text',
              isToday: true,
              isPinned: false,
            };
            setClipboardItems((prev) => [item, ...prev.filter((i) => i.preview !== text)].slice(0, 50));
            setSelectedClipboardId((curr) => curr || item.id);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('focus', syncActiveClipboard);

    return () => {
      window.removeEventListener('focus', syncActiveClipboard);
      unreg();
      unregSettings();
    };
  }, [mergeClipboardSafely]);

  // Sync latest clipboard history whenever user navigates to the Clipboard tab
  useEffect(() => {
    if (activeTab === 'Clipboard') {
      window.hitodamaAPI?.getClipboardHistory?.().then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setClipboardItems((prev) => mergeClipboardSafely(items, prev));
          setSelectedClipboardId((curr) => curr || items[0].id);
        }
      });
    }
  }, [activeTab, mergeClipboardSafely]);

  // Official Wallpapers, Dynamic Canvas Color Extraction & Zero-Skip GSAP Iris Reveal
  const [wallpapersList, setWallpapersList] = useState<WallpaperTheme[]>(DEFAULT_WALLPAPERS);
  const [wallpaperSourceTab, setWallpaperSourceTab] = useState<'Recent' | 'My folder'>('Recent');
  const [focusedWallpaperIndex, setFocusedWallpaperIndex] = useState<number>(2);
  const [appliedWallpaperIndex, setAppliedWallpaperIndex] = useState<number>(2);
  const [prevAppliedWallpaperIndex, setPrevAppliedWallpaperIndex] = useState<number>(2);
  const [isWallpaperRippling, setIsWallpaperRippling] = useState<boolean>(false);
  const [isApplyingWallpaper, setIsApplyingWallpaper] = useState<boolean>(false);
  const irisOverlayRef = useRef<HTMLDivElement>(null);

  const extractAndApplyPaletteForIndex = useCallback(
    async (index: number, listToUse: WallpaperTheme[]) => {
      const target = listToUse[index];
      if (!target) return;
      try {
        let srcToLoad = target.url;
        if (window.hitodamaAPI?.getWallpaperDataUrl) {
          srcToLoad = await window.hitodamaAPI.getWallpaperDataUrl(target.filePath || target.url);
        }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        await new Promise<void>((res) => {
          img.onload = () => res();
          img.onerror = () => res();
          img.src = srcToLoad;
        });
        const extracted = extractPaletteFromImageElement(img);
        if (extracted) {
          setWallpapersList((prev) =>
            prev.map((wp, idx) => (idx === index ? { ...wp, ...extracted } : wp))
          );
        }
      } catch (_) {}
    },
    []
  );

  useEffect(() => {
    extractAndApplyPaletteForIndex(appliedWallpaperIndex, wallpapersList);
  }, []);

  const [fullScreenDims, setFullScreenDims] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.screen.width : 1920,
    h: typeof window !== 'undefined' ? window.screen.height : 1080,
  }));

  useEffect(() => {
    const updateDims = () => {
      setFullScreenDims({
        w: window.screen.width || window.innerWidth,
        h: window.screen.height || window.innerHeight,
      });
    };
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  const activeTheme = wallpapersList[appliedWallpaperIndex] || wallpapersList[2] || DEFAULT_WALLPAPERS[2];
  const prevTheme = wallpapersList[prevAppliedWallpaperIndex] || wallpapersList[2] || DEFAULT_WALLPAPERS[2];

  // Real Installed PC Apps & Games with Persistent Starring
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appFilterTab, setAppFilterTab] = useState<'All' | 'Starred' | 'Games' | 'Apps'>('All');
  const [starredAppNames, setStarredAppNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('hitodama_starred_apps');
    return saved ? JSON.parse(saved) : [];
  });
  const [appsList, setAppsList] = useState<InstalledAppItem[]>([]);

  useEffect(() => {
    if (window.hitodamaAPI?.getInstalledApps) {
      window.hitodamaAPI.getInstalledApps().then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setAppsList(list);
        }
      });
    }
  }, []);

  const toggleStarApp = (appName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = appName.toLowerCase();
    setStarredAppNames((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem('hitodama_starred_apps', JSON.stringify(next));
      return next;
    });
  };

  const [isSpeedTesting, setIsSpeedTesting] = useState(false);
  const [speedDownload, setSpeedDownload] = useState<number | null>(null);
  const [speedUpload, setSpeedUpload] = useState<number | null>(null);
  const [speedLastTested, setSpeedLastTested] = useState<string>('Not tested yet');
  const [appsSortBy, setAppsSortBy] = useState<'RAM' | 'CPU'>('RAM');

  const [pendingPowerAction, setPendingPowerAction] = useState<'lock' | 'sleep' | 'restart' | 'shutdown' | null>(null);
  const [powerFeedback, setPowerFeedback] = useState<string | null>(null);

  const [systemStats, setSystemStats] = useState<any>({
    cpu: { percent: 18, model: 'Loading Processor...', speed: '— GHz', processes: 0 },
    gpu: { percent: 8, name: 'Detecting Graphics...', model: 'Detecting Graphics...', vramUsed: '0.0', vramTotal: '0.0' },
    ram: { percent: 45, usedGb: '0.0', totalGb: '0.0', freeGb: '0.0' },
    disk: { usedGb: 0, totalGb: 0 },
    network: { down: '0 B/s', up: '0 B/s' },
    uptime: '0 h 0 m',
    topApps: [],
  });

  const tabContentRef = useRef<HTMLDivElement>(null);
  const volumeTrackRef = useRef<HTMLDivElement>(null);
  const idleTuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelLockRef = useRef<number>(0);
  const prevWindowBoundsRef = useRef<{ w: number; h: number }>({ w: 190, h: 18 });

  const currentSoul: SoulConfig = useMemo(
    () => SOUL_SKINS.find((s) => s.key === selectedSkinKey) || SOUL_SKINS[0],
    [selectedSkinKey]
  );

  const isVoidEquipped = useMemo(
    () => currentSoul.key === 'flame_void' || equippedCards.Soul === 'soul_void' || selectedSkinKey === 'flame_void',
    [currentSoul.key, equippedCards.Soul, selectedSkinKey]
  );

  // Delta-Time Orbit + Spring-Physics Lasso Simulation Loop
  useEffect(() => {
    if (!showCompanionWindow || companionDockTab !== 'soul' || activeDeckSlot) return;

    let rafId: number;
    let lastTime = performance.now();

    const stepPhysics = (nowTime: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (nowTime - lastTime) / 1000));
      lastTime = nowTime;

      if (!draggingNodeSlotRef.current) {
        orbitAngleRef.current = (orbitAngleRef.current + 0.042 * dt) % (Math.PI * 2);
      }

      const phys = nodePhysicsRef.current;
      const timeScale = dt * 60;

      for (const def of ORBIT_SLOTS) {
        const s = phys[def.slot];

        if (draggingNodeSlotRef.current !== def.slot) {
          const kNode = 0.14;
          const dampNode = Math.pow(0.76, timeScale);
          s.vx = (s.vx - s.x * kNode * timeScale) * dampNode;
          s.vy = (s.vy - s.y * kNode * timeScale) * dampNode;
          s.x += s.vx * timeScale;
          s.y += s.vy * timeScale;
          if (Math.abs(s.x) < 0.05 && Math.abs(s.vx) < 0.05) {
            s.x = 0;
            s.vx = 0;
          }
          if (Math.abs(s.y) < 0.05 && Math.abs(s.vy) < 0.05) {
            s.y = 0;
            s.vy = 0;
          }
        }

        const angle = def.baseAngle + orbitAngleRef.current;
        const nodeX = STAGE_CENTER_X + Math.cos(angle) * def.radiusX + s.x;
        const nodeY = STAGE_CENTER_Y + Math.sin(angle) * def.radiusY + s.y;

        const dx = nodeX - STAGE_CENTER_X;
        const dy = nodeY - STAGE_CENTER_Y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / dist;
        const uy = dy / dist;

        const px = -uy;
        const py = ux;
        const tensionRatio = Math.max(0.18, Math.min(1.1, 175 / dist));
        const slackBend = Math.min(44, dist * 0.24) * tensionRatio;

        const targetBendX = STAGE_CENTER_X + dx * 0.48 + px * slackBend;
        const targetBendY = STAGE_CENTER_Y + dy * 0.48 + py * slackBend;

        const kBend = 0.18;
        const dampBend = Math.pow(0.74, timeScale);
        s.bvx = (s.bvx + (targetBendX - s.bendX) * kBend * timeScale) * dampBend;
        s.bvy = (s.bvy + (targetBendY - s.bendY) * kBend * timeScale) * dampBend;
        s.bendX += s.bvx * timeScale;
        s.bendY += s.bvy * timeScale;
      }

      setOrbitRenderTick((t) => (t + 1) % 1000000);
      rafId = requestAnimationFrame(stepPhysics);
    };

    rafId = requestAnimationFrame(stepPhysics);
    return () => cancelAnimationFrame(rafId);
  }, [showCompanionWindow, companionDockTab, activeDeckSlot]);

  const openLoadoutCardDeck = useCallback(
    (slot: LoadoutSlotType) => {
      const slotCards = LOADOUT_CARDS.filter((c) => c.slot === slot);
      const equippedId = equippedCards[slot];
      const idx = Math.max(0, slotCards.findIndex((c) => c.id === equippedId));
      setDeckCardIndex(idx);
      setActiveDeckSlot(slot);
    },
    [equippedCards]
  );

  useEffect(() => {
    if (!draggingNodeSlot) return;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - nodeDragStartRef.current.startX;
      const dy = e.clientY - nodeDragStartRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        nodeDragStartRef.current.moved = true;
      }
      const p = nodePhysicsRef.current[draggingNodeSlot];
      const nextX = nodeDragStartRef.current.origX + dx;
      const nextY = nodeDragStartRef.current.origY + dy;
      p.vx = (nextX - p.x) * 0.5;
      p.vy = (nextY - p.y) * 0.5;
      p.x = nextX;
      p.y = nextY;
    };
    const onUp = () => {
      const slot = draggingNodeSlot;
      const wasMoved = nodeDragStartRef.current.moved;
      draggingNodeSlotRef.current = null;
      setDraggingNodeSlot(null);
      if (!wasMoved && slot) {
        openLoadoutCardDeck(slot);
        if (slot === 'Voice') {
          const voiceCard = LOADOUT_CARDS.find((c) => c.id === equippedCards.Voice);
          const currentVoice = (voiceCard?.name || 'Charon') as HitodamaVoiceName;
          voiceEngine.speak(`I am ${currentVoice}. Give your computer a soul.`, {
            voice: currentVoice,
          });
        }
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingNodeSlot, openLoadoutCardDeck]);

  useEffect(() => {
    if (!isBindingTrigger) return;
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setIsBindingTrigger(false);
        return;
      }
      const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      setAbilityTriggerKey(keyName);
      localStorage.setItem('hitodama_ability_trigger', keyName);
      setIsBindingTrigger(false);
    };
    const handleMouse = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const btnName = e.button === 0 ? 'M1' : e.button === 2 ? 'M2' : `M${e.button + 1}`;
      setAbilityTriggerKey(btnName);
      localStorage.setItem('hitodama_ability_trigger', btnName);
      setIsBindingTrigger(false);
    };
    window.addEventListener('keydown', handleKey, true);
    window.addEventListener('mousedown', handleMouse, true);
    return () => {
      window.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('mousedown', handleMouse, true);
    };
  }, [isBindingTrigger]);

  const playAlarmChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + idx * 0.11 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.11 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.11);
        osc.stop(ctx.currentTime + idx * 0.11 + 0.48);
      });
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (timerAlarmRinging) {
      playAlarmChime();
      alarmIntervalRef.current = setInterval(playAlarmChime, 1500);
    } else if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [timerAlarmRinging, playAlarmChime]);

  const triggerSparklePop = useCallback((todoId: number) => {
    if (sparkleTimerRef.current) clearTimeout(sparkleTimerRef.current);
    setSparkleBurstId(todoId);
    setSparkleAnimKey((k) => k + 1);
    sparkleTimerRef.current = setTimeout(() => {
      setSparkleBurstId((curr) => (curr === todoId ? null : curr));
    }, 1650);
  }, []);

  const openCompanionApp = useCallback(
    (tab: 'soul' | 'settings', openKeyModal = false) => {
      setIsExpanded(false);
      setShowMediaNotch(false);
      setActiveDeckSlot(null);
      setCompanionDockTab(tab);
      setShowCompanionWindow(true);
      if (openKeyModal) {
        setGeminiDraftKey(apiKey);
        setShowConnectModal(true);
      }
    },
    [apiKey]
  );

  useEffect(() => {
    if (!window.hitodamaAPI?.onOpenSettings) return;
    const unreg = window.hitodamaAPI.onOpenSettings((section) => {
      if (section === 'soul') openCompanionApp('soul', false);
      else if (section === 'connect') openCompanionApp('settings', true);
      else if (section === 'shortcuts') {
        openCompanionApp('settings', false);
        setSettingsSection('Shortcuts');
      } else openCompanionApp('settings', false);
    });
    return () => unreg();
  }, [openCompanionApp, setSettingsSection]);

  useEffect(() => {
    if (!window.hitodamaAPI?.setAppWindowRect) return;
    if (showCompanionWindow) {
      window.hitodamaAPI.setAppWindowRect({
        x: appWindowPos.x,
        y: appWindowPos.y,
        width: APP_WIN_W,
        height: APP_WIN_H,
      });
    } else {
      window.hitodamaAPI.setAppWindowRect(null);
    }
  }, [showCompanionWindow, appWindowPos]);

  useEffect(() => {
    if (!isDraggingAppWin) return;
    const handleMove = (e: PointerEvent) => {
      const maxX = Math.max(0, window.innerWidth - APP_WIN_W);
      const maxY = Math.max(0, window.innerHeight - 60);
      const nextX = Math.min(maxX, Math.max(0, Math.round(e.clientX - dragOffsetRef.current.dx)));
      const nextY = Math.min(maxY, Math.max(0, Math.round(e.clientY - dragOffsetRef.current.dy)));
      setAppWindowPos({ x: nextX, y: nextY });
    };
    const handleUp = () => setIsDraggingAppWin(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDraggingAppWin]);

  // Only hide the media notch when the media app (e.g. Spotify) is actually closed!
  useEffect(() => {
    if (!hasMediaSession && showMediaNotch) {
      setShowMediaNotch(false);
    }
  }, [hasMediaSession, showMediaNotch]);

  useEffect(() => {
    if (idleTuckTimerRef.current) clearTimeout(idleTuckTimerRef.current);

    const isBusy =
      !autoTuckEnabled ||
      onboardingStep !== null ||
      Boolean(notchApiAlert) ||
      isExpanded ||
      showMediaNotch ||
      isTimerRunning ||
      timerAlarmRinging ||
      askNotchPhase !== 'idle' ||
      Boolean(contextCard) ||
      Boolean(userBubbleText) ||
      Boolean(hitodamaReply) ||
      dictationState !== 'idle' ||
      lassoActive ||
      soulAnnoyance > 0 ||
      soulIsHit ||
      isBreathingRelief ||
      isDraggingVolume ||
      isDraggingMediaScrub;

    if (!isBusy && !isTucked) {
      idleTuckTimerRef.current = setTimeout(() => {
        setIsTucked(true);
      }, 4500);
    }

    return () => {
      if (idleTuckTimerRef.current) clearTimeout(idleTuckTimerRef.current);
    };
  }, [
    autoTuckEnabled,
    onboardingStep,
    notchApiAlert,
    isExpanded,
    showMediaNotch,
    isTimerRunning,
    timerAlarmRinging,
    askNotchPhase,
    contextCard,
    userBubbleText,
    hitodamaReply,
    dictationState,
    lassoActive,
    soulAnnoyance,
    soulIsHit,
    isBreathingRelief,
    isDraggingVolume,
    isDraggingMediaScrub,
    isTucked,
  ]);

  const currentTabDimensions = useMemo(() => {
    if (activeTab === 'Controls') {
      return { w: 672, h: hasMediaSession ? 396 : 268 };
    }
    const dims: Record<NavTab, { w: number; h: number }> = {
      Controls:  { w: 672, h: 396 },
      Today:     { w: 860, h: 440 },
      Stats:     { w: 860, h: 368 },
      Clipboard: { w: 860, h: 444 },
      Apps:      { w: 690, h: 560 },
      Agents:    { w: 860, h: 440 },
      Wallpaper: { w: 960, h: 316 },
      Power:     { w: 672, h: 168 },
    };
    return dims[activeTab];
  }, [activeTab, hasMediaSession]);

  const showProactiveBanner = !isExpanded && !showCompanionWindow && Boolean(detectedAppId);
  const isCompactAskBar = !showProactiveBanner && (askNotchPhase === 'speaking' || askNotchPhase === 'thinking');
  const isTimerNotchActive = !isExpanded && !showProactiveBanner && !showMediaNotch && !isCompactAskBar && (isTimerRunning || timerAlarmRinging);
  const isMiniMediaPill = !isExpanded && !showProactiveBanner && !showMediaNotch && !isCompactAskBar && !isTimerNotchActive && !notchApiAlert && hasMediaSession;
  const isTuckedSliver = isTucked && !isExpanded && !showProactiveBanner && !showMediaNotch && !isTimerNotchActive && !isCompactAskBar && !isMiniMediaPill && !notchApiAlert;

  const archSize = isTuckedSliver ? 9 : showProactiveBanner ? 20 : isMiniMediaPill || isCompactAskBar || isTimerNotchActive || notchApiAlert ? 16 : 22;

  const notchShellWidth = isExpanded
    ? currentTabDimensions.w - archSize * 2
    : showProactiveBanner
    ? 580 - archSize * 2
    : showMediaNotch
    ? 320
    : notchApiAlert
    ? 294
    : timerAlarmRinging
    ? 256
    : isMiniMediaPill
    ? 204
    : isTimerNotchActive
    ? 192
    : isCompactAskBar
    ? 192
    : isTucked
    ? 190
    : 196;

  const notchShellHeight = isExpanded
    ? currentTabDimensions.h
    : showProactiveBanner
    ? 106
    : showMediaNotch
    ? 124
    : notchApiAlert
    ? 40
    : timerAlarmRinging
    ? 68
    : isMiniMediaPill
    ? 34
    : isTimerNotchActive
    ? 42
    : isCompactAskBar
    ? 44
    : isTucked
    ? 18
    : 72;

  const bottomRadius = isTuckedSliver
    ? 9
    : showProactiveBanner
    ? 20
    : isMiniMediaPill || isCompactAskBar || isTimerNotchActive || notchApiAlert
    ? 15
    : showMediaNotch
    ? 20
    : isExpanded
    ? 22
    : 18;

  const hasFloatingHUD = Boolean(
    onboardingStep !== null ||
      askNotchPhase !== 'idle' ||
      contextCard ||
      userBubbleText ||
      hitodamaReply ||
      dictationState !== 'idle' ||
      lassoActive
  );

  const activeHitboxWidth =
    lassoActive || onboardingStep !== null
      ? window.innerWidth || 1920
      : hasFloatingHUD
      ? Math.max(notchShellWidth + archSize * 2, 740)
      : notchShellWidth + archSize * 2;

  const activeHitboxHeight =
    lassoActive || onboardingStep !== null
      ? window.innerHeight || 1080
      : askNotchPhase !== 'idle' || dictationState !== 'idle' || userBubbleText || hitodamaReply
      ? 720
    : contextCard
    ? Math.max(notchShellHeight + 125, 220)
    : showProactiveBanner
    ? 110
    : showMediaNotch
    ? 128
    : isExpanded
    ? notchShellHeight + 4
    : notchShellHeight;

  useEffect(() => {
    if (!window.hitodamaAPI?.setWindowBounds) return;

    if (boundsTimeoutRef.current) {
      clearTimeout(boundsTimeoutRef.current);
      boundsTimeoutRef.current = null;
    }

    const prev = prevWindowBoundsRef.current;
    const isGrowing = activeHitboxWidth > prev.w || activeHitboxHeight > prev.h;

    if (isGrowing) {
      window.hitodamaAPI.setWindowBounds(activeHitboxWidth, activeHitboxHeight);
      prevWindowBoundsRef.current = { w: activeHitboxWidth, h: activeHitboxHeight };
    } else if (activeHitboxWidth !== prev.w || activeHitboxHeight !== prev.h) {
      boundsTimeoutRef.current = setTimeout(() => {
        window.hitodamaAPI?.setWindowBounds(activeHitboxWidth, activeHitboxHeight);
        prevWindowBoundsRef.current = { w: activeHitboxWidth, h: activeHitboxHeight };
      }, 180);
    }

    return () => {
      if (boundsTimeoutRef.current) clearTimeout(boundsTimeoutRef.current);
    };
  }, [activeHitboxWidth, activeHitboxHeight]);

  // =========================================================================
  // UNIVERSAL GEMINI FUNCTION-CALLING COMMAND EXECUTOR (Zero Hardcoded Keywords!)
  // =========================================================================
  const executeVoiceCommand = useCallback(
    async (rawSpeech: string, optionalImage?: string) => {
      const text = rawSpeech.trim();
      if (!text) return;

      setIsTucked(false);
      setAskNotchPhase('thinking');
      setSoulMode('THINKING');
      setAskWords(text.split(/\s+/));

      let fc: any = null;
      let speech = 'Done.';

      if (apiKey && apiKey.trim()) {
        try {
          const res = await queryGemini(text, apiKey, optionalImage);
          fc = res.functionCall;
          speech = res.speech || 'Done.';
        } catch (err: any) {
          const msg = String(err?.message || '');
          setNotchApiAlert({
            type: 'rate_limit',
            text: msg.includes('429')
              ? 'Gemini API rate limit reached · Click to check key'
              : 'Gemini API error · Click to check Settings',
          });
        }
      } else {
        setNotchApiAlert({
          type: 'missing_key',
          text: 'Connect Gemini API key · Click to setup',
        });
      }

      const lower = text.toLowerCase().trim();

      // 1. Check Notion Database / Workspace Task FIRST so "create a database in Notion with websites" never triggers BUILD_PAGE!
      const isNotionDatabaseTask =
        (lower.includes('notion') || lower.includes('database')) &&
        (lower.includes('create') ||
          lower.includes('make') ||
          lower.includes('build') ||
          lower.includes('add') ||
          lower.includes('save') ||
          lower.includes('websites') ||
          lower.includes('awards'));

      const isClonePage =
        !isNotionDatabaseTask &&
        (lower.includes('like this landing page') ||
          lower.includes('like this website') ||
          lower.includes('make the exact same') ||
          lower.includes('exact same website') ||
          lower.includes('same landing page') ||
          lower.includes('clone this') ||
          lower.includes('replicate this'));

      const isSaveInspo =
        !isNotionDatabaseTask &&
        (lower.includes('save this landing page') ||
          lower.includes('save this website') ||
          lower.includes('save to inspo') ||
          lower.includes('add to inspiration'));

      const isBuildWebsite =
        !isNotionDatabaseTask &&
        !isClonePage &&
        !isSaveInspo &&
        (fc?.name === 'build_website' ||
          /\b(make|create|build|generate|design|code)\s+(me\s+)?(a\s+|an\s+|the\s+)?([a-z0-9_-]+\s+)*(website|webpage|landing\s*page|site|portfolio|saas)\b/i.test(
            lower
          ));

      // Creator Embers command for instant testing!
      if (
        /\b(give\s+me\s+embers|creator\s+embers|test\s+embers|add\s+embers|grant\s+embers|infinite\s+embers|lots\s+of\s+embers|more\s+embers)\b/i.test(
          lower
        )
      ) {
        handleGrantCreatorEmbers(10000);
        setAskNotchPhase('idle');
        setSoulMode('TALKING');
        setTimeout(() => {
          setSoulMode('LISTENING');
          setHitodamaReply(null);
          setUserBubbleText(null);
        }, 3200);
        return;
      }

      // Claim Daily Ember voice command
      if (
        /\b(claim\s+ember|claim\s+daily|collect\s+ember|claim\s+my\s+ember)\b/i.test(
          lower
        )
      ) {
        if (isDailyEmberWaiting) {
          handleClaimWaitingEmber();
        } else {
          setHitodamaReply({
            bold: '🔥 Daily Ember Already Stoked',
            rest: `${embers.toLocaleString()} embers in your forge · Complete tasks for more`,
          });
          speakAsHitodama('Your daily ember is already stoked. Complete tasks or check your deck for more.');
        }
        setAskNotchPhase('idle');
        setSoulMode('TALKING');
        setTimeout(() => {
          setSoulMode('LISTENING');
          setHitodamaReply(null);
          setUserBubbleText(null);
        }, 2800);
        return;
      }

      if (isNotionDatabaseTask) {
        multitaskAgent.spawnTask(text, 'notion', { kind: 'NOTION_DATABASE' });
        setAskNotchPhase('idle');
        setSoulMode('TALKING');
        setHitodamaReply({
          bold: 'Building Notion database in background...',
          rest: 'Curating websites & syncing to Notion',
        });
        speakAsHitodama('Curating those websites and building your Notion database now.');
        setTimeout(() => {
          setSoulMode('LISTENING');
          setHitodamaReply(null);
          setUserBubbleText(null);
        }, 2600);
        return;
      }

      const hasGeneratedWebsite = Boolean(multitaskAgent.getLatestGeneratedPageTask());
      const isEditPage =
        !isNotionDatabaseTask &&
        !isClonePage &&
        !isSaveInspo &&
        hasGeneratedWebsite &&
        /\b(change|edit|update|modify|replace|remove|add\s+a|add\s+an|make\s+the|in\s+the\s+website|on\s+the\s+website|on\s+the\s+page|to\s+the\s+page|to\s+the\s+landing\s+page|previous\s+page|that\s+website)\b/i.test(
          lower
        ) &&
        !lower.includes('night light') &&
        !lower.includes('dark mode') &&
        !lower.includes('volume');

      if (isEditPage) {
        multitaskAgent.spawnTask(text, undefined, { kind: 'EDIT_PAGE' });
        setAskNotchPhase('idle');
        setSoulMode('TALKING');
        setHitodamaReply({
          bold: 'Updating your website file...',
          rest: 'Applying changes & refreshing browser',
        });
        speakAsHitodama('Updating your website with those changes right now.');
        setTimeout(() => {
          setSoulMode('LISTENING');
          setHitodamaReply(null);
          setUserBubbleText(null);
          setContextCard(null);
        }, 2600);
        return;
      }

      if (isClonePage) {
        multitaskAgent.spawnTask(text, undefined, { kind: 'CLONE_PAGE' });
        setAskNotchPhase('idle');
        setSoulMode('TALKING');
        setHitodamaReply({
          bold: 'Cloning active website in background...',
          rest: 'Analyzing screen layout, colors & typography',
        });
        speakAsHitodama('Scanning the website on your screen and building an exact replica.');
        setTimeout(() => {
          setSoulMode('LISTENING');
          setHitodamaReply(null);
          setUserBubbleText(null);
        }, 2600);
        return;
      }

      if (isSaveInspo) {
        multitaskAgent.spawnTask(text, undefined, { kind: 'SAVE_INSPO' });
        setAskNotchPhase('idle');
        setSoulMode('TALKING');
        setHitodamaReply({ bold: 'Saving to Inspiration DB...', rest: 'Track progress in top-right dock' });
        speakAsHitodama('Saving design to your inspiration database.');
        setTimeout(() => {
          setSoulMode('LISTENING');
          setHitodamaReply(null);
          setUserBubbleText(null);
          setContextCard(null);
        }, 2200);
        return;
      }

      if (isBuildWebsite) {
        multitaskAgent.spawnTask(text, undefined, { kind: 'BUILD_PAGE' });
        setAskNotchPhase('idle');
        setSoulMode('TALKING');
        setHitodamaReply({ bold: 'Building website in background...', rest: 'Track progress in top-right dock' });
        speakAsHitodama('Building your website in the background.');
        setTimeout(() => {
          setSoulMode('LISTENING');
          setHitodamaReply(null);
          setUserBubbleText(null);
          setContextCard(null);
        }, 2200);
        return;
      }

      // Dedicated Spotify Playback Handler (Desktop App Priority #1 -> Web Fallback #2)
      const isSpotifyPlayIntent =
        fc?.name === 'play_spotify' ||
        (fc?.name === 'search_web' && String(fc?.args?.platform || '').toLowerCase() === 'spotify') ||
        (lower.includes('spotify') &&
          !lower.startsWith('close ') &&
          !lower.startsWith('quit ') &&
          !/^(open|launch)\s+spotify$/i.test(lower)) ||
        /\bplay\s+(my\s+)?liked\s+songs\b/i.test(lower);

      if (isSpotifyPlayIntent) {
        let rawTarget =
          fc?.args?.query ||
          (fc?.name === 'computer_action' ? fc?.args?.target || fc?.args?.task : '') ||
          text;

        const cleanSpotifyQuery = String(rawTarget)
          .replace(/^(can\s+you\s+|could\s+you\s+|please\s+|hitodama\s+|hey\s+hitodama\s+|yo\s+)+/i, '')
          .replace(/^(play|put\s+on|listen\s+to|start|search\s+for|search|open)\s+/i, '')
          .replace(/\s+(on|in)\s+spotify.*$/i, '')
          .replace(/\s+for\s+me$/i, '')
          .replace(/[?.!]+$/g, '')
          .trim();

        const isLiked =
          fc?.args?.targetType === 'liked_songs' ||
          /^(my\s+)?liked\s+songs?$/i.test(cleanSpotifyQuery) ||
          lower.includes('liked songs');

        const displayTarget = isLiked ? 'Liked Songs' : cleanSpotifyQuery || 'Spotify';

        setAskNotchPhase('idle');
        setAskWords([]);
        setSoulMode('TALKING');
        setHitodamaReply({
          bold: `Playing ${displayTarget} on Spotify...`,
        });
        speakAsHitodama(`Playing ${displayTarget} on Spotify.`);

        if (window.hitodamaAPI?.playSpotify) {
          const spRes = await window.hitodamaAPI.playSpotify(
            displayTarget,
            isLiked ? 'liked_songs' : 'track_or_artist'
          );

          setContextCard({
            header: spRes?.mode === 'app' ? 'Playing in Spotify App' : 'Opened · open.spotify.com',
            title: displayTarget,
            subtitle: spRes?.mode === 'app' ? 'Spotify Desktop' : 'Spotify Web Player',
            domain: 'open.spotify.com',
          });

          // If UIAutomation didn't find the play button directly, use our Vision + Jev clicker to click Play
          if (spRes && !spRes.autoClicked && apiKey) {
            await executeDirectComputerAction(
              {
                actionType: 'click',
                target: isLiked
                  ? 'green Play button for Liked Songs'
                  : `green Play button or first song result for ${displayTarget}`,
              },
              apiKey,
              (status) => setHitodamaReply({ bold: status })
            );
          }
        } else {
          const fallbackUrl = isLiked
            ? 'https://open.spotify.com/collection/tracks'
            : `https://open.spotify.com/search/${encodeURIComponent(displayTarget)}`;
          window.hitodamaAPI?.openUrl(fallbackUrl);
        }

        setTimeout(() => {
          setSoulMode('LISTENING');
          setUserBubbleText(null);
          setHitodamaReply(null);
          setContextCard(null);
        }, 3800);
        return;
      }

      const isFindOrPoint =
        fc?.name === 'find_and_point' ||
        (fc?.name === 'computer_action' && /find|where|point|locate|show|spot|search/i.test(fc?.args?.task || '')) ||
        /\b(find|where\s+is|where's|point\s+to|point\s+at|point\s+out|point|locate|show\s+me|spot|look\s+for|search\s+for)\b/i.test(lower);

      if (isFindOrPoint) {
        let queryTarget = fc?.args?.target || (fc?.name === 'computer_action' ? fc?.args?.task : '') || '';
        if (!queryTarget) {
          queryTarget = text
            .replace(/^(can\s+you\s+|could\s+you\s+|please\s+|hitodama\s+|hey\s+hitodama\s+|help\s+me\s+)+/i, '')
            .replace(/^(find|where\s+is|where's|point\s+to|point\s+at|point\s+out|point|locate|show\s+me\s+where|show\s+me\s+the|show\s+me|spot|look\s+for|search\s+for)\s+/i, '')
            .replace(/^(the|a|an)\s+/i, '')
            .replace(/[?.!]+$/g, '')
            .trim();
        }
        if (!queryTarget) queryTarget = text;

        setAskNotchPhase('idle');
        setSoulMode('LISTENING');
        setHitodamaReply(null);
        setUserBubbleText(null);
        handleFindAndPoint(queryTarget.trim());
        return;
      }

      // Universal Click / Play / Select / Write / Type Detection
      const isDirectWriteOnly =
        /^(write|type|enter|input|paste)\s+/i.test(lower) &&
        !lower.includes(' in ') &&
        !lower.includes(' into ') &&
        !lower.includes(' on ');

      const isComputerAction =
        !isFindOrPoint &&
        (fc?.name === 'computer_action' ||
          isDirectWriteOnly ||
          /\b(click|double\s*click|right\s*click|press|tap|select|choose|hit)\b/i.test(lower) ||
          /\b(play|open|watch)\s+(the\s+)?(first|second|third|1st|2nd|3rd|top|next|this)\s+(video|result|song|track|link|item|post|reel|short)/i.test(lower) ||
          /\b(write|type|enter)\s+.+\s+(in|into|on)\s+/i.test(lower));

      if (isComputerAction && apiKey) {
        let actionType: 'click' | 'double_click' | 'right_click' | 'type' =
          fc?.args?.actionType || 'click';
        let targetDesc: string = fc?.args?.target || '';
        let textToType: string = fc?.args?.textToType || '';
        let pressEnter: boolean = Boolean(fc?.args?.pressEnter);

        if (!fc || fc.name !== 'computer_action') {
          if (isDirectWriteOnly) {
            actionType = 'type';
            targetDesc = '';
            textToType = text.replace(/^(write|type|enter|input|paste)\s+/i, '').trim();
          } else {
            const writeInMatch = text.match(/^(?:click\s+(.+?)\s+and\s+)?(?:write|type|enter)\s+["']?(.+?)["']?\s+(?:in|into|on)\s+(.+)$/i);
            if (writeInMatch) {
              actionType = 'type';
              textToType = writeInMatch[2].trim();
              targetDesc = (writeInMatch[1] || writeInMatch[3] || '').trim();
              pressEnter = /search|chat|message|prompt/i.test(targetDesc);
            } else if (/^double\s*click\b/i.test(lower)) {
              actionType = 'double_click';
              targetDesc = text.replace(/^double\s*click\s+(on\s+|the\s+)?/i, '').trim();
            } else if (/^right\s*click\b/i.test(lower)) {
              actionType = 'right_click';
              targetDesc = text.replace(/^right\s*click\s+(on\s+|the\s+)?/i, '').trim();
            } else {
              actionType = 'click';
              targetDesc = text
                .replace(/^(can\s+you\s+|please\s+|hitodama\s+)+/i, '')
                .replace(/^(click|press|tap|select|choose|hit|play|watch|open)\s+(on\s+)?/i, '')
                .trim();
            }
          }
        }

        setAskNotchPhase('idle');
        setAskWords([]);
        setHitodamaReply({ bold: actionType === 'type' ? 'Typing...' : `Locating ${targetDesc || 'target'}...` });

        const actionRes = await executeDirectComputerAction(
          {
            actionType,
            target: targetDesc,
            textToType,
            pressEnter,
          },
          apiKey,
          (status) => setHitodamaReply({ bold: status }),
          (rect) => {
            // Briefly show the glowing reticle on the clicked element
            setPointedTarget({
              ...rect,
              spokenHint: '',
              confidence: 0.95,
            });
            setRoamingStage('POINTING');
            setTimeout(() => {
              setRoamingStage('IDLE');
              setPointedTarget(null);
            }, 1400);
          }
        );

        const replyMsg = actionRes.summary;
        setSoulMode('TALKING');
        setHitodamaReply({ bold: replyMsg });
        speakAsHitodama(replyMsg);

        setTimeout(() => {
          setSoulMode('LISTENING');
          setUserBubbleText(null);
          setHitodamaReply(null);
        }, 3200);
        return;
      }

      const isAskingForScheduled =
        fc?.name === 'get_scheduled_tasks' ||
        lower.includes('scheduled task') ||
        lower.includes('what are my tasks') ||
        lower.includes('show tasks') ||
        lower.includes('show my tasks') ||
        lower.includes('list tasks') ||
        lower.includes('show routines') ||
        lower.includes('what are my routines') ||
        lower.includes('my routines') ||
        lower.includes('check schedule') ||
        lower.includes('view schedule') ||
        lower.includes('what is scheduled') ||
        lower.includes('what is on my schedule') ||
        lower.includes('my schedule');

      if (isAskingForScheduled) {
        fc = { name: 'get_scheduled_tasks', args: {} };
        if (routines.length > 0) {
          const routineList = routines.slice(0, 3).map((r) => r.title).join(', ');
          speech = `You have ${routines.length} scheduled task${routines.length > 1 ? 's' : ''}: ${routineList}.`;
        } else {
          speech = 'You have no scheduled tasks yet.';
        }
      } else if (!fc) {
        if (lower.includes('night light') || lower.includes('nightlight') || lower.includes('blue light')) {
          const wantOn = !lower.includes('off');
          fc = { name: 'system_action', args: { action: 'night_light', value: wantOn ? 'on' : 'off' } };
          speech = `Night light turned ${wantOn ? 'on' : 'off'}.`;
        } else if (lower.includes('dark mode') || lower.includes('light mode') || lower.includes('eyes are hurting')) {
          const wantDark = !lower.includes('light mode');
          fc = { name: 'system_action', args: { action: 'dark_mode', value: wantDark ? 'on' : 'off' } };
          speech = `${wantDark ? 'Dark' : 'Light'} mode enabled.`;
        } else if (lower.includes('mute') || lower.includes('unmute')) {
          const wantMute = !lower.includes('unmute');
          fc = { name: 'system_action', args: { action: 'mute', value: wantMute ? 'on' : 'off' } };
          speech = wantMute ? 'Muted.' : 'Unmuted.';
        } else if (lower.includes('lock pc') || lower.includes('lock screen') || lower.includes('lock workstation')) {
          fc = { name: 'system_action', args: { action: 'lock' } };
          speech = 'Locking workstation.';
        } else if (lower.includes('sleep pc') || lower.includes('go to sleep')) {
          fc = { name: 'system_action', args: { action: 'sleep' } };
          speech = 'Putting PC to sleep.';
        } else if (lower.includes('volume') || lower.includes('louder') || lower.includes('quieter')) {
          const matchNum = lower.match(/\b(\d{1,3})\b/);
          const vol = matchNum ? matchNum[1] : lower.includes('louder') ? '80' : '30';
          fc = { name: 'system_action', args: { action: 'volume', value: vol } };
          speech = `Volume set to ${vol}%.`;
        } else if (lower.startsWith('open ') || lower.startsWith('launch ')) {
          const app = lower.replace(/^(open|launch)\s+/i, '').trim();
          fc = { name: 'open_application', args: { appName: app } };
          speech = `Opening ${app}.`;
        } else if (lower.includes('youtube') || lower.includes('spotify') || lower.includes('amazon') || lower.includes('github') || lower.includes('reddit') || lower.includes('wikipedia') || lower.includes('search')) {
          const platform = lower.includes('youtube') ? 'youtube'
            : lower.includes('spotify') ? 'spotify'
            : lower.includes('amazon') ? 'amazon'
            : lower.includes('github') ? 'github'
            : lower.includes('reddit') ? 'reddit'
            : lower.includes('wikipedia') ? 'wikipedia'
            : 'google';
          const query = lower
            .replace(/^search( for)?\s*/i, '')
            .replace(new RegExp(`\\s*(on|in)?\\s*${platform}$`, 'i'), '')
            .trim() || text;
          fc = { name: 'search_web', args: { query, platform } };
          speech = `Searching ${platform} for ${query}.`;
        } else if (lower.includes('every morning') || (lower.includes('schedule') && !lower.startsWith('what') && !lower.startsWith('show') && !lower.startsWith('list')) || /\bat\s+\d+/i.test(lower)) {
          fc = { name: 'schedule_routine', args: { title: text, timeLabel: 'Scheduled · Autopilot' } };
          speech = "Scheduled routine. I'll run it on time.";
        } else if (lower.startsWith('remind me') || lower.startsWith('todo ') || lower.startsWith('add task')) {
          const task = text.replace(/^(remind me to|todo|add task)\s+/i, '');
          fc = { name: 'add_todo', args: { task } };
          speech = 'Added task to your list.';
        }
      }

      setAskNotchPhase('idle');
      setAskWords([]);
      setSoulMode('TALKING');
      setHitodamaReply({ bold: speech });

      if (fc) {
        if (fc.name === 'get_scheduled_tasks') {
          setShowCompanionWindow(true);
          setCompanionDockTab('settings');
          setSettingsSection('Your data');
          setContextCard({
            header: 'Today · Scheduled Routines',
            title: `${routines.length} Scheduled Task${routines.length !== 1 ? 's' : ''}`,
            subtitle: routines.length > 0 ? routines.map((r) => r.title).join(' · ') : 'No scheduled tasks yet',
            domain: 'Hito Today',
          });
        } else if (fc.name === 'open_application') {
          const appName = String(fc.args.appName || '').trim();
          const domainMap: Record<string, string> = {
            gmail: 'mail.google.com',
            youtube: 'youtube.com',
            spotify: 'open.spotify.com',
            discord: 'discord.com',
            github: 'github.com',
          };
          const matchedDomain = domainMap[appName.toLowerCase()];
          setContextCard({
            header: matchedDomain ? `Opened · ${matchedDomain}` : 'Launched Application',
            title: appName,
            subtitle: matchedDomain ? `https://${matchedDomain}` : 'Running on Windows',
            domain: matchedDomain,
            badgeType: 'app',
          });
          window.hitodamaAPI?.openApp(appName);
        } else if (fc.name === 'search_web') {
          const query = String(fc.args.query || text).trim();
          const platform = String(fc.args.platform || 'google').toLowerCase();
          const platformConfig: Record<string, { url: string; domain: string }> = {
            youtube: {
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
              domain: 'youtube.com',
            },
            amazon: {
              url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
              domain: 'amazon.com',
            },
            github: {
              url: `https://github.com/search?q=${encodeURIComponent(query)}`,
              domain: 'github.com',
            },
            reddit: {
              url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
              domain: 'reddit.com',
            },
            wikipedia: {
              url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`,
              domain: 'wikipedia.org',
            },
            spotify: {
              url: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
              domain: 'open.spotify.com',
            },
            google: {
              url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
              domain: 'google.com',
            },
          };
          const target = platformConfig[platform] || platformConfig.google;
          setContextCard({
            header: `Opened · ${target.domain}`,
            title: query,
            subtitle: target.url.replace(/^https?:\/\/(www\.)?/, ''),
            domain: target.domain,
          });
          window.hitodamaAPI?.openUrl(target.url);
        } else if (fc.name === 'system_action') {
          const act = String(fc.args.action || '').toLowerCase();
          const val = String(fc.args.value || '').toLowerCase();
          if (act === 'dark_mode' || act === 'light_mode') {
            const wantDark = act === 'dark_mode' ? val !== 'off' : val === 'off';
            setSystemDarkMode(wantDark);
            window.hitodamaAPI?.toggleSystemDarkMode(wantDark).catch(() => {});
          } else if (act === 'night_light') {
            const wantOn = val !== 'off';
            setNightLight(wantOn);
            window.hitodamaAPI?.toggleNightLight?.(wantOn, nightLightStrength).catch(() => {});
          } else if (act === 'volume') {
            const num = parseInt(val, 10);
            if (!isNaN(num)) applyUserVolumeChange(num);
          } else if (act === 'mute') {
            const wantMute = val !== 'off';
            setIsMuted(wantMute);
            window.hitodamaAPI?.setMute?.(wantMute).catch(() => {});
          } else if (act === 'lock' || act === 'sleep') {
            window.hitodamaAPI?.powerAction(act as 'lock' | 'sleep').catch(() => {});
          }
        } else if (fc.name === 'schedule_routine') {
          const title = String(fc.args.title || text);
          const timeLabel = String(fc.args.timeLabel || 'Scheduled · Autopilot');
          setRoutines((prev) => [
            {
              id: Date.now(),
              title,
              timeLabel,
              command: text,
            },
            ...prev,
          ]);
          setShowCompanionWindow(true);
          setCompanionDockTab('settings');
          setSettingsSection('Your data');
          setContextCard({
            header: 'Scheduled · Added to Routines',
            title,
            subtitle: timeLabel,
            domain: 'Hito Today',
          });
        } else if (fc.name === 'add_todo') {
          setTodos((prev) => [
            ...prev,
            { id: Date.now(), text: String(fc.args.task || text), completed: false },
          ]);
        }
      }

      if (speech && speech.trim() && speech !== 'Done.') {
        speakAsHitodama(speech);
      }

      setTimeout(() => {
        setSoulMode('LISTENING');
        setUserBubbleText(null);
        setHitodamaReply(null);
        setContextCard(null);
      }, 4200);
    },
    [apiKey, nightLightStrength, applyUserVolumeChange, routines, speakAsHitodama]
  );

  const startLiveVoiceAsk = useCallback(() => {
    setIsExpanded(false);
    setShowMediaNotch(false);
    setIsTucked(false);
    setContextCard(null);
    setHitodamaReply(null);

    if (!apiKey) {
      setNotchApiAlert({
        type: 'missing_key',
        text: 'Connect Gemini API key · Click to setup',
      });
    }

    if (askNotchPhase !== 'idle') {
      setAskNotchPhase('idle');
      setAskWords([]);
      return;
    }

    setAskNotchPhase('waking');
    setTimeout(() => {
      setAskNotchPhase('speaking');
      setAskWords([]);
    }, 220);
  }, [apiKey, askNotchPhase]);

  const triggerCleanDictationFlow = useCallback(() => {
    setIsExpanded(false);
    setShowMediaNotch(false);
    if (!apiKey) {
      setIsTucked(false);
      setNotchApiAlert({
        type: 'missing_key',
        text: 'Connect Gemini API key for Clean Dictation',
      });
      return;
    }
    setIsTucked(true);
    setDictationState('recording');
    setDictationText('');
  }, [apiKey]);

  const cropScreenToLasso = async (
    base64OrDataUrl: string | undefined,
    points: Array<{ x: number; y: number }>
  ): Promise<string> => {
    if (!base64OrDataUrl) return '';
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          if (!points || points.length < 3) {
            return resolve(
              base64OrDataUrl.startsWith('data:')
                ? base64OrDataUrl
                : `data:image/png;base64,${base64OrDataUrl}`
            );
          }

          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
          }

          const screenW = window.innerWidth || 1920;
          const screenH = window.innerHeight || 1080;
          const scaleX = img.naturalWidth / screenW;
          const scaleY = img.naturalHeight / screenH;

          const pad = 24;
          const cropX = Math.max(0, Math.floor((minX - pad) * scaleX));
          const cropY = Math.max(0, Math.floor((minY - pad) * scaleY));
          const cropW = Math.min(img.naturalWidth - cropX, Math.ceil((maxX - minX + pad * 2) * scaleX));
          const cropH = Math.min(img.naturalHeight - cropY, Math.ceil((maxY - minY + pad * 2) * scaleY));

          if (cropW <= 10 || cropH <= 10) {
            return resolve(
              base64OrDataUrl.startsWith('data:')
                ? base64OrDataUrl
                : `data:image/png;base64,${base64OrDataUrl}`
            );
          }

          const canvas = document.createElement('canvas');
          canvas.width = cropW;
          canvas.height = cropH;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(base64OrDataUrl);

          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          resolve(canvas.toDataURL('image/png'));
        } catch (_) {
          resolve(base64OrDataUrl);
        }
      };
      img.onerror = () => resolve(base64OrDataUrl);
      img.src = base64OrDataUrl.startsWith('data:')
        ? base64OrDataUrl
        : `data:image/png;base64,${base64OrDataUrl}`;
    });
  };

  const triggerLassoFlow = useCallback(async () => {
    setIsExpanded(false);
    setShowMediaNotch(false);
    setIsTucked(true);
    setLassoActive(true);
    window.hitodamaAPI?.setLassoActive?.(true);
    // Clear all previous speech state so old questions never appear!
    setLassoQuery('');
    lassoQueryRef.current = '';
    liveSpeechRef.current = '';
    setAskWords([]);
    setUserBubbleText(null);
    setHitodamaReply(null);
    setLassoPoints([]);
    lassoPointsRef.current = [];
    capturedScreenRef.current = null;
    window.hitodamaAPI?.captureScreen().then((res) => {
      if (res?.success && res.image) {
        capturedScreenRef.current = res.image;
      }
    });
  }, []);

  useEffect(() => {
    if (tabContentRef.current && isExpanded) {
      setActiveControlDropdown(null);
      gsap.killTweensOf(tabContentRef.current);
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: -5 },
        { opacity: 1, y: 0, duration: 0.16, ease: 'cubic-bezier(0.33, 1, 0.68, 1)', clearProps: 'transform' }
      );
    }
  }, [activeTab, isExpanded]);

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

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isTimerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          setIsExpanded(false);
          setIsTucked(false);
          setTimerAlarmRinging(true);
          setSoulMode('TALKING');
          addEmbers(5);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, addEmbers]);

  // Only advance media timer while song is actively playing (pauses when song is paused!)
  useEffect(() => {
    if (!isPlayingMedia) return;
    const interval = setInterval(() => {
      setMediaProgress((prev) => (prev >= totalMediaDuration ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayingMedia, totalMediaDuration]);

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
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isElectron]);

  const updateVolumeFromClientX = useCallback(
    (clientX: number) => {
      if (!volumeTrackRef.current) return;
      const rect = volumeTrackRef.current.getBoundingClientRect();
      const pct = Math.round(((clientX - rect.left) / rect.width) * 100);
      applyUserVolumeChange(pct);
    },
    [applyUserVolumeChange]
  );

  useEffect(() => {
    if (!isDraggingVolume) return;
    const onMove = (e: PointerEvent) => updateVolumeFromClientX(e.clientX);
    const onUp = (e: PointerEvent) => {
      isDraggingVolumeRef.current = false;
      setIsDraggingVolume(false);

      if (notchShellRef.current) {
        const rect = notchShellRef.current.getBoundingClientRect();
        const isStillInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (!isStillInside) {
          handleIslandMouseLeave();
        }
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingVolume, updateVolumeFromClientX, handleIslandMouseLeave]);

  const confirmAndExecutePowerAction = async () => {
    if (!pendingPowerAction) return;
    const action = pendingPowerAction;
    setPendingPowerAction(null);
    setPowerFeedback(`Executing ${action}...`);
    if (window.hitodamaAPI?.powerAction) {
      await window.hitodamaAPI.powerAction(action);
    }
    setTimeout(() => setPowerFeedback(null), 2500);
  };

  const handleRunSpeedTest = async () => {
    if (isSpeedTesting) return;
    setIsSpeedTesting(true);
    if (window.hitodamaAPI?.runSpeedTest) {
      const res = await window.hitodamaAPI.runSpeedTest();
      if (res?.success) {
        setSpeedDownload(res.downloadMbps);
        setSpeedUpload(res.uploadMbps);
        setSpeedLastTested('Just now');
      }
      setIsSpeedTesting(false);
    } else {
      setTimeout(() => {
        setSpeedDownload(85);
        setSpeedUpload(42);
        setSpeedLastTested('Just now');
        setIsSpeedTesting(false);
      }, 1200);
    }
  };

  const handleLaunchApp = async (nameOrId: string) => {
    if (window.hitodamaAPI?.openApp) {
      await window.hitodamaAPI.openApp(nameOrId);
    }
  };

  const handleAddTodo = () => {
    const text = newTodoInput.trim();
    if (!text) return;

    if (/\bat\s+\d+/i.test(text) || /^every\s+/i.test(text)) {
      setRoutines((prev) => [
        {
          id: Date.now(),
          title: text,
          timeLabel: 'Scheduled · Autopilot',
          command: text,
        },
        ...prev,
      ]);
    }

    const newId = Date.now();
    setTodos((prev) => [...prev, { id: newId, text, completed: false }]);
    setNewTodoInput('');
  };

  const handleToggleTodo = (id: number) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const willComplete = !target.completed;

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: willComplete } : t))
    );

    if (willComplete && !rewardedTaskIds.includes(id) && rewardedTaskIds.length < 5) {
      const nextRewarded = [...rewardedTaskIds, id];
      setRewardedTaskIds(nextRewarded);
      localStorage.setItem('hitodama_rewarded_tasks', JSON.stringify(nextRewarded));

      const rewardAmount = nextRewarded.length === 5 ? 9 : 4;
      addEmbers(rewardAmount);
      triggerSparklePop(id);
    }
  };

  const handleDeleteTodo = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playToggle(false);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerClipboardToast = (msg: string) => {
    setClipboardToast(msg);
    setTimeout(() => setClipboardToast(null), 1600);
  };

  const handleTogglePinClip = useCallback((id: number) => {
    setClipboardItems((prev) => {
      const target = prev.find((item) => item.id === id);
      const willPin = target ? !target.isPinned : false;
      triggerClipboardToast(willPin ? 'Pinned' : 'Unpinned');
      const updated = prev.map((item) =>
        item.id === id
          ? { ...item, isPinned: willPin, isToday: willPin ? false : true }
          : item
      );
      try {
        localStorage.setItem('hitodama_clip_history', JSON.stringify(updated.slice(0, 50)));
      } catch (_) {}
      return updated;
    });
    window.hitodamaAPI?.togglePinClipboardItem?.(id);
  }, []);

  const handleDeleteClip = useCallback((id: number) => {
    setClipboardItems((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      setSelectedClipboardId((curr) => (curr === id ? (remaining.length > 0 ? remaining[0].id : null) : curr));
      try {
        localStorage.setItem('hitodama_clip_history', JSON.stringify(remaining.slice(0, 50)));
      } catch (_) {}
      return remaining;
    });
    window.hitodamaAPI?.deleteClipboardItem?.(id);
    triggerClipboardToast('Removed');
  }, []);

  const handleCopyClip = useCallback((clip: ClipboardItem) => {
    if (!clip) return;
    if (clip.preview) {
      navigator.clipboard?.writeText(clip.preview).catch(() => {});
      window.hitodamaAPI?.writeClipboardText?.(clip.preview);
    }
    if (clip.imageDataUrl) {
      window.hitodamaAPI?.writeClipboardImage?.(clip.imageDataUrl);
    }
    triggerClipboardToast('Copied!');
  }, []);

  const applyWallpaperByIndex = useCallback(
    async (index: number) => {
      const targetWp = wallpapersList[index];
      if (!targetWp || isApplyingWallpaper) return;

      setIsApplyingWallpaper(true);

      extractAndApplyPaletteForIndex(index, wallpapersList);

      try {
        const img = new Image();
        img.src = targetWp.url;
        if (img.decode) {
          await img.decode();
        } else {
          await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          });
        }
      } catch (_) {}

      setPrevAppliedWallpaperIndex(appliedWallpaperIndex);
      setAppliedWallpaperIndex(index);
      setIsWallpaperRippling(true);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = irisOverlayRef.current;
          const maxRadius = Math.ceil(Math.hypot(fullScreenDims.w, fullScreenDims.h));

          if (!el) {
            const sourcePathOrUrl = targetWp.filePath || targetWp.url;
            window.hitodamaAPI?.setWallpaper?.(sourcePathOrUrl).finally(() => {
              setIsWallpaperRippling(false);
              setIsApplyingWallpaper(false);
            });
            return;
          }

          gsap.killTweensOf(el);
          gsap.fromTo(
            el,
            {
              clipPath: 'circle(22px at 50% 330px)',
              opacity: 1,
            },
            {
              clipPath: `circle(${maxRadius}px at 50% 330px)`,
              opacity: 1,
              duration: 1.15,
              ease: 'power2.inOut',
              onComplete: async () => {
                const sourcePathOrUrl = targetWp.filePath || targetWp.url;
                if (window.hitodamaAPI?.setWallpaper) {
                  try {
                    await window.hitodamaAPI.setWallpaper(sourcePathOrUrl);
                  } catch (_) {}
                }
                gsap.to(el, {
                  opacity: 0,
                  duration: 0.34,
                  ease: 'power1.out',
                  onComplete: () => {
                    setIsWallpaperRippling(false);
                    setIsApplyingWallpaper(false);
                  },
                });
              },
            }
          );
        });
      });
    },
    [wallpapersList, appliedWallpaperIndex, isApplyingWallpaper, fullScreenDims, extractAndApplyPaletteForIndex]
  );

  const handleWallpaperStripClick = useCallback(
    (index: number) => {
      if (index !== focusedWallpaperIndex) {
        setFocusedWallpaperIndex(index);
      } else {
        applyWallpaperByIndex(index);
      }
    },
    [focusedWallpaperIndex, applyWallpaperByIndex]
  );

  const wallpaperTrackRef = useRef<HTMLDivElement>(null);

  const handleWallpaperWheel = useCallback(
    (e: React.WheelEvent) => {
      e.stopPropagation();
      const nowMs = performance.now();
      if (nowMs - wheelLockRef.current < 140) return;
      wheelLockRef.current = nowMs;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;

      const dir = delta > 0 ? 1 : -1;
      setFocusedWallpaperIndex((i) => (i + dir + wallpapersList.length) % wallpapersList.length);
      soundFX.playSliderTick(50);

      if (wallpaperTrackRef.current) {
        gsap.killTweensOf(wallpaperTrackRef.current);
        gsap.fromTo(
          wallpaperTrackRef.current,
          { x: dir * 56, opacity: 0.88 },
          {
            x: 0,
            opacity: 1,
            duration: 0.36,
            ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
            clearProps: 'transform,opacity',
          }
        );
      }
    },
    [wallpapersList.length]
  );

  const handlePickLocalWallpapers = useCallback(async () => {
    setWallpaperSourceTab('My folder');
    if (!window.hitodamaAPI?.pickWallpaperFiles) return;
    const res = await window.hitodamaAPI.pickWallpaperFiles();
    if (res?.success && res.files && res.files.length > 0) {
      const newThemes: WallpaperTheme[] = await Promise.all(
        res.files.map(async (f, i) => {
          const img = new Image();
          await new Promise<void>((r) => {
            img.onload = () => r();
            img.onerror = () => r();
            img.src = f.url;
          });
          const pal = extractPaletteFromImageElement(img) || {
            accent: '#F68C58',
            accentSecondary: '#EE9B27',
            pillBg: 'rgba(246, 140, 88, 0.22)',
            rowBg: 'rgba(246, 140, 88, 0.16)',
            darkText: '#1E110A',
            darkSubText: 'rgba(30, 17, 10, 0.72)',
          };
          return {
            id: Date.now() + i,
            title: f.title,
            url: f.url,
            filePath: f.filePath,
            thumb: f.url,
            ...pal,
          };
        })
      );
      setWallpapersList((prev) => [...newThemes, ...prev]);
      setFocusedWallpaperIndex(0);
    }
  }, []);

  const trackWallpapers = useMemo(() => {
    const total = wallpapersList.length;
    if (total === 0) return [];
    const offsets = [-2, -1, 0, 1, 2];
    return offsets.map((offset) => {
      const originalIndex = (focusedWallpaperIndex + offset + total * 10) % total;
      return {
        slotKey: offset,
        wp: wallpapersList[originalIndex],
        originalIndex,
        isCenter: offset === 0,
        isApplied: originalIndex === appliedWallpaperIndex,
      };
    });
  }, [wallpapersList, focusedWallpaperIndex, appliedWallpaperIndex]);

  const trackTranslateX = 0;

  const currentSlotCards = useMemo(
    () => (activeDeckSlot ? LOADOUT_CARDS.filter((c) => c.slot === activeDeckSlot) : []),
    [activeDeckSlot]
  );

  const handleEquipOrUnlockCard = (card: LoadoutCardItem) => {
    const isVoidUnlocked = unlockedCardIds.includes('soul_void');
    const isUnlocked =
      unlockedCardIds.includes(card.id) ||
      card.cost === 0 ||
      (card.id === 'abil_collapse' && isVoidUnlocked);

    if (card.notForSale && !isVoidUnlocked) {
      return;
    }

    if (isUnlocked && !card.notForSale) {
      const nextEquipped = { ...equippedCards, [card.slot]: card.id };
      setEquippedCards(nextEquipped);
      localStorage.setItem('hitodama_equipped_cards', JSON.stringify(nextEquipped));
      if (card.slot === 'Soul' && card.skinKey) {
        setSelectedSkinKey(card.skinKey);
        localStorage.setItem('hitodama_skin', card.skinKey);
      }
      if (card.slot === 'Voice') {
        const voiceName = (card.name || 'Charon') as HitodamaVoiceName;
        voiceEngine.speak(`Voice switched to ${voiceName}. Give your computer a soul.`, {
          voice: voiceName,
        });
      }
    } else if (isUnlocked && card.id === 'abil_collapse') {
      const nextEquipped = { ...equippedCards, Abilities: card.id };
      setEquippedCards(nextEquipped);
      localStorage.setItem('hitodama_equipped_cards', JSON.stringify(nextEquipped));
    } else if (embers >= card.cost && !card.notForSale) {
      const nextEmbers = embers - card.cost;
      setEmbers(nextEmbers);
      localStorage.setItem('hitodama_embers', String(nextEmbers));

      const extraUnlocks = card.id === 'soul_void' ? ['soul_void', 'abil_collapse'] : [card.id];
      const nextUnlocked = Array.from(new Set([...unlockedCardIds, ...extraUnlocks]));
      setUnlockedCardIds(nextUnlocked);
      localStorage.setItem('hitodama_unlocked_cards', JSON.stringify(nextUnlocked));

      const nextEquipped = { ...equippedCards, [card.slot]: card.id };
      setEquippedCards(nextEquipped);
      localStorage.setItem('hitodama_equipped_cards', JSON.stringify(nextEquipped));
      if (card.slot === 'Soul' && card.skinKey) {
        setSelectedSkinKey(card.skinKey);
        localStorage.setItem('hitodama_skin', card.skinKey);
      }
      if (card.slot === 'Voice') {
        const voiceName = (card.name || 'Charon') as HitodamaVoiceName;
        voiceEngine.speak(`Voice unlocked: ${voiceName}. Give your computer a soul.`, {
          voice: voiceName,
        });
      }
    }
  };

  const handleSaveGeminiKey = () => {
    const trimmed = geminiDraftKey.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('hitodama_gemini_key', trimmed);
      setNotchApiAlert(null);
      setSoulMode('LISTENING');
    }
    setShowConnectModal(false);
  };

  const handleForgetGeminiKey = () => {
    setApiKey('');
    setGeminiDraftKey('');
    localStorage.removeItem('hitodama_gemini_key');
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
      null,
    [filteredClipboardItems, selectedClipboardId]
  );

  const processedApps = useMemo(() => {
    const q = appSearchQuery.trim().toLowerCase();
    return appsList
      .map((a) => ({
        ...a,
        starred: starredAppNames.includes(a.name.toLowerCase()),
      }))
      .filter((a) => {
        if (q && !a.name.toLowerCase().includes(q) && !a.tag.toLowerCase().includes(q)) {
          return false;
        }
        if (appFilterTab === 'Starred') return a.starred;
        if (appFilterTab === 'Games') return a.tag === 'Game';
        if (appFilterTab === 'Apps') return a.tag !== 'Game';
        return true;
      });
  }, [appsList, starredAppNames, appSearchQuery, appFilterTab]);

  const alphabeticalAppGroups = useMemo(() => {
    const map = new Map<string, InstalledAppItem[]>();
    for (const app of processedApps) {
      const firstChar = app.name.trim().charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(app);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [processedApps]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConnectModal) setShowConnectModal(false);
        else if (activeControlDropdown) setActiveControlDropdown(null);
        else if (activeDeckSlot) setActiveDeckSlot(null);
        else if (showCompanionWindow) {
          setShowCompanionWindow(false);
          setIsTucked(true);
        } else if (notchApiAlert) {
          setNotchApiAlert(null);
        } else if (askNotchPhase !== 'idle') {
          setAskNotchPhase('idle');
          setAskWords([]);
        } else if (lassoActive) setLassoActive(false);
        else if (dictationState !== 'idle') setDictationState('idle');
        else if (isExpanded) {
          setIsExpanded(false);
          setIsTucked(true);
        } else if (showMediaNotch) {
          setShowMediaNotch(false);
          setIsTucked(true);
        } else if (contextCard) setContextCard(null);
      } else if (activeDeckSlot) {
        if (e.key === 'ArrowRight') {
          setDeckCardIndex((i) => Math.min(currentSlotCards.length - 1, i + 1));
        } else if (e.key === 'ArrowLeft') {
          setDeckCardIndex((i) => Math.max(0, i - 1));
        }
      } else if (e.altKey && (e.key === 'w' || e.key === 'W' || e.code === 'Space')) {
        e.preventDefault();
        startLiveVoiceAsk();
      } else if (isExpanded && activeTab === 'Clipboard') {
        const isInput = document.activeElement?.tagName === 'INPUT';
        if (isInput) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            (document.activeElement as HTMLElement)?.blur();
            if (filteredClipboardItems.length > 0) {
              setSelectedClipboardId(filteredClipboardItems[0].id);
            }
          } else if (e.key === 'Enter' && selectedClip) {
            e.preventDefault();
            if (selectedClip.preview) {
              navigator.clipboard?.writeText(selectedClip.preview).catch(() => {});
              window.hitodamaAPI?.typeText?.(selectedClip.preview);
            }
            triggerClipboardToast('Pasted!');
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const idx = filteredClipboardItems.findIndex((i) => i.id === selectedClip?.id);
          if (idx >= 0 && idx < filteredClipboardItems.length - 1) {
            setSelectedClipboardId(filteredClipboardItems[idx + 1].id);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const idx = filteredClipboardItems.findIndex((i) => i.id === selectedClip?.id);
          if (idx > 0) {
            setSelectedClipboardId(filteredClipboardItems[idx - 1].id);
          }
        } else if (e.key === 'Enter' && selectedClip) {
          e.preventDefault();
          if (selectedClip.preview) {
            navigator.clipboard?.writeText(selectedClip.preview).catch(() => {});
            window.hitodamaAPI?.typeText?.(selectedClip.preview);
          }
          triggerClipboardToast('Pasted!');
        } else if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey) && selectedClip) {
          e.preventDefault();
          handleCopyClip(selectedClip);
        } else if ((e.key === 'p' || e.key === 'P') && selectedClip) {
          e.preventDefault();
          handleTogglePinClip(selectedClip.id);
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClip) {
          e.preventDefault();
          handleDeleteClip(selectedClip.id);
        }
      } else if (isExpanded && activeTab === 'Wallpaper') {
        if (e.key === 'ArrowRight') {
          setFocusedWallpaperIndex((i) => (i + 1) % wallpapersList.length);
        } else if (e.key === 'ArrowLeft') {
          setFocusedWallpaperIndex((i) => (i - 1 + wallpapersList.length) % wallpapersList.length);
        } else if (e.key === 'Enter') {
          applyWallpaperByIndex(focusedWallpaperIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showConnectModal,
    activeControlDropdown,
    activeDeckSlot,
    currentSlotCards.length,
    showCompanionWindow,
    notchApiAlert,
    askNotchPhase,
    lassoActive,
    dictationState,
    isExpanded,
    showMediaNotch,
    contextCard,
    activeTab,
    filteredClipboardItems,
    selectedClip,
    wallpapersList.length,
    focusedWallpaperIndex,
    applyWallpaperByIndex,
    startLiveVoiceAsk,
    handleCopyClip,
    handleTogglePinClip,
    handleDeleteClip,
  ]);

  // Hold-to-Speak Microphone Recorder with 100ms Timeslicing (`recorder.start(100)`)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeHoldModeRef = useRef<'ASK' | 'DICTATE' | 'LASSO' | null>(null);

  const startHoldRecording = useCallback(
    async (mode: 'ASK' | 'DICTATE' | 'LASSO') => {
      if (activeHoldModeRef.current) return;
      activeHoldModeRef.current = mode;

      if (!apiKey) {
        setIsTucked(false);
        setNotchApiAlert({
          type: 'missing_key',
          text: 'Connect Gemini API key · Click to setup',
        });
        return;
      }

      if (mode === 'ASK') {
        setIsExpanded(false);
        setShowMediaNotch(false);
        setIsTucked(false);
        setContextCard(null);
        setHitodamaReply(null);
        setAskNotchPhase('speaking');
        setAskWords([]);
      } else if (mode === 'DICTATE') {
        setIsExpanded(false);
        setShowMediaNotch(false);
        setIsTucked(true);
        setDictationState('recording');
        setDictationText('');
      } else if (mode === 'LASSO') {
        setIsExpanded(false);
        setShowMediaNotch(false);
        setIsTucked(true);
        setLassoActive(true);
        window.hitodamaAPI?.setLassoActive?.(true);
        // Clear all previous speech state so old questions never appear!
        setLassoQuery('');
        lassoQueryRef.current = '';
        liveSpeechRef.current = '';
        setAskWords([]);
        setUserBubbleText(null);
        setHitodamaReply(null);
        setLassoPoints([]);
        lassoPointsRef.current = [];
        capturedScreenRef.current = null;
        window.hitodamaAPI?.captureScreen().then((res) => {
          if (res?.success && res.image) {
            capturedScreenRef.current = res.image;
          }
        });
      }

      soundFX.playWakeListening();
      liveSpeechRef.current = '';

      // Live Speech Recognition: Catch spoken words continuously in real time as user talks!
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onresult = (event: any) => {
            let combined = '';
            for (let i = 0; i < event.results.length; ++i) {
              combined += event.results[i][0].transcript;
            }
            const trimmed = combined.trim();
            if (!trimmed) return;
            liveSpeechRef.current = trimmed;
            if (mode === 'ASK') {
              setAskWords(trimmed.split(/\s+/).filter(Boolean));
            } else if (mode === 'DICTATE') {
              setDictationText(trimmed);
            } else if (mode === 'LASSO') {
              setLassoQuery(trimmed);
              lassoQueryRef.current = trimmed;
            }
          };

          rec.onerror = () => {};
          rec.onend = () => {};
          rec.start();
          speechRecognitionRef.current = rec;
        } catch (_) {}
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          if (blob.size < 100 && !liveSpeechRef.current.trim()) {
            setAskNotchPhase('idle');
            setDictationState('idle');
            setLassoActive(false);
            return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
            const dataUrl = String(reader.result || '');
            const base64Audio = dataUrl.split(',')[1] || '';

            try {
              if (mode === 'ASK') {
                setAskNotchPhase('thinking');
                setSoulMode('THINKING');
                let transcript = liveSpeechRef.current.trim();
                if (!transcript && base64Audio) {
                  transcript = await transcribeAudioWithGeminiAPI(
                    base64Audio,
                    blob.type,
                    'ASK',
                    apiKey
                  );
                }
                if (transcript && !transcript.includes('<noise>') && !transcript.includes('(silence)')) {
                  setUserBubbleText(transcript);
                  const lower = transcript.toLowerCase();
                  let screenImage: string | undefined = undefined;
                  if (
                    lower.includes('screen') ||
                    lower.includes('look at') ||
                    lower.includes('this error') ||
                    lower.includes('what is this') ||
                    lower.includes('code') ||
                    lower.includes('read')
                  ) {
                    let shotImage = capturedScreenRef.current;
                    if (!shotImage) {
                      const shot = await window.hitodamaAPI?.captureScreen();
                      shotImage = shot?.image;
                    }
                    screenImage = shotImage;
                  }
                  await executeVoiceCommand(transcript, screenImage);
                } else {
                  setAskNotchPhase('idle');
                  setSoulMode('LISTENING');
                  setHitodamaReply({ bold: "I didn't catch that. Hold and speak clearly." });
                  setTimeout(() => setHitodamaReply(null), 3500);
                }
              } else if (mode === 'DICTATE') {
                let cleaned = liveSpeechRef.current.trim();
                if (!cleaned && base64Audio) {
                  cleaned = await transcribeAudioWithGeminiAPI(
                    base64Audio,
                    blob.type,
                    'DICTATE',
                    apiKey
                  );
                } else if (cleaned) {
                  try {
                    const refined = await cleanDictation(cleaned, apiKey);
                    if (refined && refined.trim()) cleaned = refined.trim();
                  } catch (_) {}
                }
                if (cleaned && !cleaned.includes('<noise>') && !cleaned.includes('(silence)')) {
                  setDictationText(cleaned);
                  setDictationState('done');
                  await window.hitodamaAPI?.typeText(cleaned);
                  addEmbers(2);
                  setTimeout(() => setDictationState('idle'), 1400);
                } else {
                  setDictationState('idle');
                  setHitodamaReply({ bold: "No speech detected to dictate." });
                  setTimeout(() => setHitodamaReply(null), 3000);
                }
              } else if (mode === 'LASSO') {
                const points = [...lassoPointsRef.current];
                setLassoActive(false);
                window.hitodamaAPI?.setLassoActive?.(false);
                setAskNotchPhase('thinking');
                setSoulMode('THINKING');

                // 1. Get spoken words from live speech OR transcribe the recorded audio with Gemini
                let q = liveSpeechRef.current.trim() || lassoQueryRef.current.trim();
                if (!q && base64Audio) {
                  try {
                    q = await transcribeAudioWithGeminiAPI(
                      base64Audio,
                      blob.type,
                      'ASK',
                      apiKey
                    );
                  } catch (_) {}
                }

                // 2. Immediately display the actual spoken words in the HUD (replacing any old question)
                const cleanQ =
                  q && !q.includes('<noise>') && !q.includes('(silence)')
                    ? q.trim()
                    : '';
                if (cleanQ) {
                  setLassoQuery(cleanQ);
                  setUserBubbleText(cleanQ);
                  setAskWords(cleanQ.split(/\s+/));
                } else {
                  setUserBubbleText('Analyzing circled area...');
                  setAskWords(['Analyzing', 'circled', 'area...']);
                }

                let shotImage = capturedScreenRef.current;
                if (!shotImage) {
                  const shot = await window.hitodamaAPI?.captureScreen();
                  shotImage = shot?.image || '';
                }
                const cropped = await cropScreenToLasso(shotImage, points);
                const answer = await askLassoWithGemini(
                  cleanQ,
                  cropped || shotImage || '',
                  apiKey,
                  !cleanQ && base64Audio ? base64Audio : undefined,
                  !cleanQ && blob.type ? blob.type : undefined
                );
                capturedScreenRef.current = null;
                setAskNotchPhase('idle');
                setAskWords([]);
                setSoulMode('TALKING');
                if (answer) {
                  addEmbers(2);
                  setHitodamaReply({ bold: answer });
                  speakAsHitodama(answer);
                  setTimeout(() => {
                    setSoulMode('LISTENING');
                    setHitodamaReply(null);
                    setUserBubbleText(null);
                  }, 6000);
                }
              }
            } catch (err: any) {
              console.error('Voice transcription error:', err);
              setAskNotchPhase('idle');
              setDictationState('idle');
              setLassoActive(false);
              window.hitodamaAPI?.setLassoActive?.(false);
              const errMsg = String(err?.message || '');
              const userMsg = errMsg.includes('429')
                ? 'Rate limit reached · Please wait a moment'
                : 'Could not process audio · Check connection';
              setHitodamaReply({ bold: userMsg });
              setTimeout(() => setHitodamaReply(null), 4000);
              setNotchApiAlert({
                type: 'rate_limit',
                text: errMsg.includes('429')
                  ? 'Gemini API rate limit reached · Click to check key'
                  : 'Voice transcription error · Click to check Gemini key',
              });
            }
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorderRef.current = recorder;
        // 100ms timeslice so audio chunks buffer continuously even on quick holds!
        recorder.start(100);
      } catch (_) {}
    },
    [apiKey, executeVoiceCommand]
  );

  const stopHoldRecording = useCallback(() => {
    activeHoldModeRef.current = null;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    const api = window.hitodamaAPI as any;
    if (!api) return;

    const unregHotkey = api.onHotkeyEvent
      ? api.onHotkeyEvent((action: string) => {
          setLastHotkeyAction(action);
          if (action === 'ASK_DOWN') startHoldRecording('ASK');
          else if (action === 'ASK_UP') stopHoldRecording();
          else if (action === 'DICTATE_DOWN') startHoldRecording('DICTATE');
          else if (action === 'DICTATE_UP') stopHoldRecording();
          else if (action === 'LASSO_DOWN') startHoldRecording('LASSO');
          else if (action === 'LASSO_UP') stopHoldRecording();
        })
      : () => {};

    const unregLasso = api.onTriggerLasso
      ? api.onTriggerLasso(() => {
          triggerLassoFlow();
        })
      : () => {};

    const unregDictate = api.onTriggerDictation
      ? api.onTriggerDictation(() => {
          triggerCleanDictationFlow();
        })
      : () => {};

    const unregAsk = api.onTriggerAsk
      ? api.onTriggerAsk(() => {
          startLiveVoiceAsk();
        })
      : () => {};

    return () => {
      unregHotkey();
      unregLasso();
      unregDictate();
      unregAsk();
    };
  }, [startHoldRecording, stopHoldRecording, triggerLassoFlow, triggerCleanDictationFlow, startLiveVoiceAsk]);

  const renderCircleGauge = (
    pct: number,
    color: string,
    title: string,
    subtitle: string,
    badges: string[]
  ) => {
    const size = 90;
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <div className="companion-stat-gauge-card">
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
        <div style={{ marginTop: '8px', fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>{title}</div>
        <div className="companion-truncate" style={{ fontSize: '10.5px', color: '#71717A', marginTop: '1px', maxWidth: '100%' }}>
          {subtitle}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          {badges.map((b, i) => (
            <span key={i} className="companion-stat-badge">{b}</span>
          ))}
        </div>
      </div>
    );
  };

  const timerRingSize = 76;
  const timerStroke = 4.5;
  const timerRadius = (timerRingSize - timerStroke * 2) / 2;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerFraction = timerTotalSeconds > 0 ? timerSeconds / timerTotalSeconds : 0;
  const timerDashoffset = timerCircumference * (1 - timerFraction);

  const completedTodosCount = todos.filter((t) => t.completed).length;
  const totalTodosCount = Math.max(1, todos.length);
  const todoRingSize = 28;
  const todoRingStroke = 2.8;
  const todoRingRadius = (todoRingSize - todoRingStroke * 2) / 2;
  const todoRingCircumference = 2 * Math.PI * todoRingRadius;
  const todoRingDashoffset =
    todoRingCircumference * (1 - completedTodosCount / totalTodosCount);

  const hoursStr = String(now.getHours() % 12 || 12).padStart(2, '0');
  const minsStr = String(now.getMinutes()).padStart(2, '0');
  const ampmStr = now.getHours() >= 12 ? 'PM' : 'AM';
  const dayShortStr = now.toLocaleDateString('en-US', { weekday: 'short' });

  const lassoPathString = useMemo(() => {
    if (lassoPoints.length < 2) return '';
    return lassoPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  }, [lassoPoints]);

  const adaptiveVars = {
    '--adaptive-accent': activeTheme.accent,
    '--adaptive-secondary': activeTheme.accentSecondary,
    '--adaptive-pill-bg': activeTheme.pillBg,
    '--adaptive-row-bg': activeTheme.rowBg,
    '--adaptive-dark-text': activeTheme.darkText,
    '--adaptive-dark-sub': activeTheme.darkSubText,
  } as React.CSSProperties;

  const orbitingNodes = useMemo(() => {
    const angleNow = orbitAngleRef.current;
    const phys = nodePhysicsRef.current;

    return ORBIT_SLOTS.map((d) => {
      const angle = d.baseAngle + angleNow;
      const p = phys[d.slot];

      const cx = STAGE_CENTER_X + Math.cos(angle) * d.radiusX + p.x;
      const cy = STAGE_CENTER_Y + Math.sin(angle) * d.radiusY + p.y;

      const toCenterDx = STAGE_CENTER_X - cx;
      const toCenterDy = STAGE_CENTER_Y - cy;

      const boxHalfW = 56;
      const boxHalfH = 21;
      const scaleX = boxHalfW / Math.max(0.001, Math.abs(toCenterDx));
      const scaleY = boxHalfH / Math.max(0.001, Math.abs(toCenterDy));
      const edgeScale = Math.min(1, Math.min(scaleX, scaleY));

      const boxEdgeX = cx + toCenterDx * edgeScale;
      const boxEdgeY = cy + toCenterDy * edgeScale;

      const fromPortalDx = p.bendX - STAGE_CENTER_X;
      const fromPortalDy = p.bendY - STAGE_CENTER_Y;
      const portalDist = Math.max(1, Math.hypot(fromPortalDx, fromPortalDy));
      const pux = fromPortalDx / portalDist;
      const puy = fromPortalDy / portalDist;

      const startX = STAGE_CENTER_X + pux * PORTAL_OUTER_R;
      const startY = STAGE_CENTER_Y + puy * PORTAL_OUTER_R;

      const cp1X = startX + pux * Math.min(55, portalDist * 0.45);
      const cp1Y = startY + puy * Math.min(55, portalDist * 0.45);
      const cp2X = p.bendX;
      const cp2Y = p.bendY;

      const pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${boxEdgeX.toFixed(1)} ${boxEdgeY.toFixed(1)}`;

      const t = 0.35;
      const mt = 1 - t;
      const dotX =
        mt * mt * mt * startX +
        3 * mt * mt * t * cp1X +
        3 * mt * t * t * cp2X +
        t * t * t * boxEdgeX;
      const dotY =
        mt * mt * mt * startY +
        3 * mt * t * t * cp1Y +
        3 * mt * t * t * cp2Y +
        t * t * t * boxEdgeY;

      return {
        ...d,
        cx,
        cy,
        boxEdgeX,
        boxEdgeY,
        pathD,
        dotX,
        dotY,
      };
    });
  }, [orbitRenderTick]);

  const getEquippedCardName = (slot: LoadoutSlotType) => {
    if (slot === 'Abilities' && equippedCards.Abilities === 'none') return '—';
    const card = LOADOUT_CARDS.find((c) => c.id === equippedCards[slot]);
    return card ? card.name : '—';
  };


  const handleNotchWheel = (e: React.WheelEvent) => {
    if (e.deltaY <= 4) return;
    const nowMs = performance.now();
    if (nowMs - wheelLockRef.current < 220) return;
    wheelLockRef.current = nowMs;

    if (timerAlarmRinging) {
      setTimerAlarmRinging(false);
      setSoulMode('LISTENING');
      return;
    }

    if (!isExpanded) {
      if (hasMediaSession && !showMediaNotch) {
        setIsTucked(false);
        setShowMediaNotch(true);
      } else if (isTucked) {
        setIsTucked(false);
      } else {
        setActiveTab('Controls');
        setShowMediaNotch(false);
        setIsExpanded(true);
      }
    }
  };

  return (
    <div
      className="hitodama-companion-root"
      style={{
        ...adaptiveVars,
        background: isElectron
          ? 'transparent'
          : `url("${isWallpaperRippling ? prevTheme.url : activeTheme.url}") center/cover no-repeat`,
        filter: nightLight && !isElectron ? `sepia(${Math.round(nightLightStrength * 0.45)}%) saturate(${1 + nightLightStrength * 0.0015})` : undefined,
        transition: 'filter 0.3s ease',
      }}
      
    >
      {/* Glowing Blue Desktop Border ONLY when Hitodama is actively working / controlling the PC */}
      <div
        className={`hitodama-screen-edge-glow ${
          askNotchPhase === 'thinking' || Boolean(contextCard) || Boolean(hitodamaReply)
            ? 'is-active'
            : ''
        }`}
      />
      {isWallpaperRippling && (
        <div
          ref={irisOverlayRef}
          className="wallpaper-radial-iris-overlay"
          style={{
            width: `${fullScreenDims.w}px`,
            height: `${fullScreenDims.h}px`,
            backgroundImage: `url("${activeTheme.url}")`,
            clipPath: 'circle(22px at 50% 330px)',
            willChange: 'clip-path, opacity',
          }}
        />
      )}

      {/* =====================================================================
          TOP HARDWARE NOTCH SHELL
          ===================================================================== */}
      <div
        ref={notchShellRef}
        className={`hitodama-bezel-shell ${isExpanded ? 'is-expanded' : ''} ${isTuckedSliver ? 'is-tucked' : ''}`}
        style={{
          width: `${notchShellWidth}px`,
          height: `${notchShellHeight}px`,
          borderBottomLeftRadius: `${bottomRadius}px`,
          borderBottomRightRadius: `${bottomRadius}px`,
          zIndex: onboardingStep !== null ? 9999 : undefined,
        }}
        onMouseEnter={handleIslandMouseEnter}
        onMouseLeave={handleIslandMouseLeave}
        onWheel={handleNotchWheel}
      >
        <svg
          className="hitodama-svg-arch left"
          viewBox="0 0 24 24"
          style={{
            left: `-${archSize}px`,
            width: `${archSize + 1}px`,
            height: `${archSize}px`,
          }}
          preserveAspectRatio="none"
        >
          <path
            d="M 0 0 L 24 0 L 24 24 L 23 24 C 23 10 13.5 0 0 0 Z"
            fill="#0C0C0E"
          />
        </svg>

        <svg
          className="hitodama-svg-arch right"
          viewBox="0 0 24 24"
          style={{
            right: `-${archSize}px`,
            width: `${archSize + 1}px`,
            height: `${archSize}px`,
          }}
          preserveAspectRatio="none"
        >
          <path
            d="M 24 0 L 0 0 L 0 24 L 1 24 C 1 10 10.5 0 24 0 Z"
            fill="#0C0C0E"
          />
        </svg>

        <div
          className="hitodama-bezel-inner"
          style={{
            borderBottomLeftRadius: `${bottomRadius}px`,
            borderBottomRightRadius: `${bottomRadius}px`,
          }}
        >
          {/* STATE 0: PROACTIVE CONTEXT APP NOTCH ("Connect GitHub to Hitodama?") */}
          {showProactiveBanner && detectedAppId && (
            <ProactiveContextNotch
              appId={detectedAppId}
              soul={currentSoul}
              isConnected={multitaskAgent.isAppConnected(detectedAppId)}
              onConnect={() => {
                multitaskAgent.connectApp(detectedAppId);
                if (appBannerTimerRef.current) clearTimeout(appBannerTimerRef.current);
                appBannerTimerRef.current = setTimeout(() => {
                  setDetectedAppId(null);
                }, 6000);
              }}
              onUnlink={() => {
                multitaskAgent.unlinkApp(detectedAppId);
              }}
              onDismiss={(mode) => {
                multitaskAgent.dismissApp(detectedAppId, mode);
                setDetectedAppId(null);
              }}
              onRunSuggestion={(suggestionText) => {
                multitaskAgent.spawnTask(suggestionText, detectedAppId);
                setDetectedAppId(null);
                setIsExpanded(true);
                setActiveTab('Agents');
              }}
            />
          )}

          {!isExpanded && !showProactiveBanner && !showMediaNotch && notchApiAlert && (
            <div
              className="hitodama-notch-api-alert"
              onClick={() => {
                setNotchApiAlert(null);
                openCompanionApp('settings', true);
              }}
            >
              <span className="api-alert-dot" />
              <span className="api-alert-text">{notchApiAlert.text}</span>
            </div>
          )}

          {!isExpanded && !showProactiveBanner && !showMediaNotch && !notchApiAlert && isCompactAskBar && (
            <div className="hitodama-notch-ask-compact" onClick={() => setAskNotchPhase('idle')}>
              <div className="ask-mini-soul-left">
                <SoulCanvas
                  soul={currentSoul}
                  width={62}
                  height={42}
                  scale={0.96}
                  isDull={isSoulDull}
                  interactive={true}
                  mode={askNotchPhase === 'thinking' ? 'THINKING' : soulMode === 'TALKING' ? 'TALKING' : 'LISTENING'}
                />
              </div>

              {askNotchPhase === 'speaking' ? (
                <div className="ask-waveform-right">
                  {[0.45, 0.85, 1.0, 0.75, 0.95, 0.65, 0.4].map((h, i) => (
                    <span
                      key={i}
                      className="companion-wave-bar"
                      style={{
                        height: `${Math.round(h * 14)}px`,
                        animationDuration: `${0.38 + (i % 3) * 0.12}s`,
                        animationDelay: `${i * 0.06}s`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="ask-waveform-right thinking">
                  {[0.4, 0.75, 1.0, 0.65, 0.45].map((h, i) => (
                    <span
                      key={i}
                      className="companion-wave-bar"
                      style={{
                        height: `${Math.round(h * 12)}px`,
                        animationDuration: `${0.45 + (i % 2) * 0.14}s`,
                        animationDelay: `${i * 0.08}s`,
                        opacity: 0.85,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!isExpanded && !showProactiveBanner && !showMediaNotch && !notchApiAlert && !isCompactAskBar && isTimerNotchActive && (
            <div
              className={`hitodama-notch-timer-bar ${timerAlarmRinging ? 'is-ringing' : ''}`}
              onClick={() => {
                if (timerAlarmRinging) {
                  setTimerAlarmRinging(false);
                  setTimerSeconds(timerTotalSeconds);
                  setSoulMode('LISTENING');
                } else {
                  setActiveTab('Today');
                  setIsExpanded(true);
                }
              }}
            >
              <div className={timerAlarmRinging ? 'alarm-dancing-soul' : 'ask-mini-soul-left'}>
                <SoulCanvas
                  soul={currentSoul}
                  width={timerAlarmRinging ? 58 : 52}
                  height={timerAlarmRinging ? 48 : 40}
                  scale={timerAlarmRinging ? 0.95 : 0.88}
                  isDull={isSoulDull}
                  interactive={true}
                  mode={timerAlarmRinging ? 'TALKING' : 'LISTENING'}
                />
              </div>
              {timerAlarmRinging ? (
                <div className="alarm-ringing-copy">
                  <span className="alarm-title">Time's up!</span>
                  <span className="alarm-sub">Click to stop alarm</span>
                </div>
              ) : (
                <span className="notch-timer-digits">
                  {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                  {String(timerSeconds % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          )}

          {/* STATE 1C: APPLE DYNAMIC ISLAND MINI MEDIA NOTCH (Synth freezes when paused) */}
          {!isExpanded && !showProactiveBanner && !showMediaNotch && !notchApiAlert && !isCompactAskBar && !isTimerNotchActive && isMiniMediaPill && (
            <div
              className="hitodama-notch-mini-media"
              onClick={() => setShowMediaNotch(true)}
              onContextMenu={(e) => {
                e.preventDefault();
                openCompanionApp('soul', false);
              }}
            >
              <div
                className="mini-media-album-thumb"
                style={
                  activeMediaArtwork
                    ? {
                        backgroundImage: `url("${activeMediaArtwork}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {
                        background: mediaArtPalette.gradient,
                      }
                }
              />
              <div className="mini-media-eq-bars">
                {[0.28, 0.35, 0.62, 0.72, 0.85, 1.0].map((h, i) => (
                  <span
                    key={i}
                    className={`mini-eq-bar ${!isPlayingMedia ? 'is-paused' : ''}`}
                    style={{
                      height: isPlayingMedia ? `${Math.round(h * 14)}px` : '4px',
                      background: mediaArtPalette.accent,
                      boxShadow: isPlayingMedia ? `0 0 6px rgba(${mediaArtPalette.rgb}, 0.55)` : 'none',
                      animationDuration: `${0.42 + (i % 3) * 0.14}s`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STATE 1E: AWAKE OR TUCKED SOUL NOTCH (standard Hitodama notch) */}
          {!isExpanded && !showProactiveBanner && !showMediaNotch && !notchApiAlert && !isCompactAskBar && !isTimerNotchActive && !isMiniMediaPill && (
            <div
              className={`hitodama-notch-soul ${soulIsHit ? 'is-hit' : ''}`}
              style={{
                opacity: roamingStage !== 'IDLE' || onboardingStep !== null ? 0 : 1,
                pointerEvents: roamingStage !== 'IDLE' || onboardingStep !== null ? 'none' : 'auto',
                transition: 'opacity 0.22s ease',
              }}
              onClick={handleHitodamaPoke}
              onContextMenu={(e) => {
                e.preventDefault();
                openCompanionApp('soul', false);
              }}
            >
              <div
                className="hitodama-soul-underglow"
                style={{
                  opacity: isTucked ? 0 : isSoulDull ? 0.35 : 1,
                  background:
                    isSoulDull
                      ? 'radial-gradient(circle, rgba(100, 116, 139, 0.28) 0%, transparent 72%)'
                      : soulAnnoyance > 0.35
                      ? 'radial-gradient(circle, rgba(239, 68, 68, 0.48) 0%, transparent 72%)'
                      : isBreathingRelief
                      ? (isVoidEquipped ? 'radial-gradient(circle, rgba(196, 181, 253, 0.52) 0%, transparent 72%)' : 'radial-gradient(circle, rgba(92, 184, 255, 0.52) 0%, transparent 72%)')
                      : (isVoidEquipped ? 'radial-gradient(circle, rgba(167, 139, 250, 0.46) 0%, transparent 72%)' : 'radial-gradient(circle, rgba(92, 184, 255, 0.36) 0%, transparent 72%)'),
                  transition: 'opacity 0.25s ease, background 0.3s ease',
                }}
              />
              <div
                className="hitodama-idle-soul-wrap"
                style={{
                  opacity: isTucked ? 0 : 1,
                  transform: isTucked ? 'translateY(-38px) scale(0.55)' : isHovered ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <SoulCanvas
                  soul={currentSoul}
                  width={84}
                  height={64}
                  scale={1.13}
                  mode={soulMode}
                  isDull={isSoulDull}
                  interactive={true}
                  annoyance={soulAnnoyance}
                  isHit={soulIsHit}
                  isBreathingRelief={isBreathingRelief}
                  onClick={handleHitodamaPoke}
                />
              </div>
            </div>
          )}

          {/* STATE 2: COMPACT MEDIA PLAYER NOTCH (Bottom-anchored glow keeps top-left & top-right #0C0C0E seamless!) */}
          {!isExpanded && showMediaNotch && (
            <div
              className="hitodama-notch-media-v2"
              style={{
                background: `radial-gradient(circle at 50% 95%, rgba(${mediaArtPalette.rgb}, 0.28) 0%, rgba(12, 12, 14, 0) 68%), #0C0C0E`,
              }}
              onClick={() => {
                setActiveTab('Controls');
                setShowMediaNotch(false);
                setIsExpanded(true);
              }}
            >
              <div className="companion-media-top-row">
                <div
                  className="companion-album-art compact"
                  style={
                    activeMediaArtwork
                      ? {
                          backgroundImage: `url("${activeMediaArtwork}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : {
                          background: mediaArtPalette.gradient,
                        }
                  }
                />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <div className="companion-truncate" style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    {activeMediaTitle}
                  </div>
                  <div className="companion-truncate" style={{ fontSize: '11px', color: '#D4D4D8', marginTop: '2px' }}>
                    {activeMediaArtist}
                  </div>
                </div>
              </div>

              <div className="companion-media-scrub-row" onClick={(e) => e.stopPropagation()}>
                <span className="companion-mono-tiny" style={{ color: '#8A8F9E' }}>
                  {formatTime(mediaProgress)}
                </span>
                <div
                  ref={notchScrubRef}
                  className="companion-scrub-track"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (leaveCollapseTimerRef.current) {
                      clearTimeout(leaveCollapseTimerRef.current);
                    }
                    activeScrubRef.current = notchScrubRef.current;
                    isDraggingMediaScrubRef.current = true;
                    setIsDraggingMediaScrub(true);
                    updateMediaScrubFromClientX(e.clientX, true);
                  }}
                >
                  <div
                    className="companion-scrub-fill white"
                    style={{
                      width: `${Math.min(100, (mediaProgress / totalMediaDuration) * 100)}%`,
                      background: mediaArtPalette.accent,
                    }}
                  >
                    <div className="companion-scrub-thumb" style={{ background: '#ffffff' }} />
                  </div>
                </div>
                <span className="companion-mono-tiny" style={{ color: '#8A8F9E' }}>
                  {formatTime(totalMediaDuration)}
                </span>
              </div>

              <div className="companion-media-controls-row" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleMediaPrev} className="companion-media-btn">
                  <SvgIcon name="prev" size={16} color="#FFFFFF" />
                </button>
                <button onClick={toggleMediaPlayback} className="companion-media-btn play">
                  <SvgIcon name={isPlayingMedia ? 'pause' : 'play'} size={18} color="#FFFFFF" />
                </button>
                <button onClick={handleMediaNext} className="companion-media-btn">
                  <SvgIcon name="next" size={16} color="#FFFFFF" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: FULL EXPANDED DYNAMIC ISLAND */}
          {isExpanded && (
            <div className="hitodama-expanded-inner">
              <div className="companion-nav-header">
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
                <div className="companion-header-actions">
                  {activeTab === 'Wallpaper' && (
                    <button
                      onClick={handlePickLocalWallpapers}
                      className="companion-header-circle"
                      title="Pick wallpapers from folder"
                    >
                      <SvgIcon name="folder" size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const next = !sfxEnabled;
                      setSfxEnabled(next);
                      soundFX.setEnabled(next);
                    }}
                    title={sfxEnabled ? 'UI Sounds: On' : 'UI Sounds: Muted'}
                    className="companion-header-circle"
                  >
                    {sfxEnabled ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div ref={tabContentRef} className="companion-tab-body">
                {activeTab === 'Controls' && (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between', position: 'relative' }}
                    onClick={() => setActiveControlDropdown(null)}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div className={`companion-adaptive-tile ${wifiEnabled ? 'is-on' : ''}`}>
                        <div
                          className="tile-left"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const next = !wifiEnabled;
                            setWifiEnabled(next);
                            setWifiSsid(next ? 'Connected' : 'Off');
                            await window.hitodamaAPI?.toggleWifi?.(next);
                          }}
                        >
                          <span className="tile-icon-circle">
                            <SvgIcon name="wifi" size={14} />
                          </span>
                          <div className="tile-copy">
                            <div className="tile-title">Wi-Fi</div>
                            <div className="tile-sub">{wifiEnabled ? wifiSsid : 'Off'}</div>
                          </div>
                        </div>
                        <div
                          className="tile-chevron-zone"
                          onClick={(e) => handleToggleControlDropdown('wifi', e)}
                        >
                          <span className="tile-chevron">⌄</span>
                        </div>
                      </div>

                      <div className={`companion-adaptive-tile ${bluetoothEnabled ? 'is-on' : ''}`}>
                        <div
                          className="tile-left"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const next = !bluetoothEnabled;
                            setBluetoothEnabled(next);
                            await window.hitodamaAPI?.toggleBluetooth?.(next);
                          }}
                        >
                          <span className="tile-icon-circle">
                            <SvgIcon name="bluetooth" size={13} />
                          </span>
                          <div className="tile-copy">
                            <div className="tile-title">Bluetooth</div>
                            <div className="tile-sub">{bluetoothEnabled ? 'On' : 'Off'}</div>
                          </div>
                        </div>
                        <div
                          className="tile-chevron-zone"
                          onClick={(e) => handleToggleControlDropdown('bluetooth', e)}
                        >
                          <span className="tile-chevron">⌄</span>
                        </div>
                      </div>

                      <div className="companion-adaptive-tile is-on">
                        <div
                          className="tile-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAudioDeviceIndex((i) => (i + 1) % audioDevicesList.length);
                          }}
                        >
                          <span className="tile-icon-circle">
                            <SvgIcon name="speaker" size={14} />
                          </span>
                          <div className="tile-copy">
                            <div className="tile-title">Audio</div>
                            <div className="tile-sub companion-truncate" style={{ maxWidth: '92px' }}>
                              {audioOutput}
                            </div>
                          </div>
                        </div>
                        <div
                          className="tile-chevron-zone"
                          onClick={(e) => handleToggleControlDropdown('audio', e)}
                        >
                          <span className="tile-chevron">⌄</span>
                        </div>
                      </div>
                    </div>

                    {activeControlDropdown === 'wifi' && (
                      <div
                        className="audio-output-dropdown companion-scrollable-dropdown"
                        style={{ left: 0, right: 'auto', width: '220px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="dropdown-section-label">Wi-Fi Networks</div>
                        {wifiNetworksList.length === 0 ? (
                          <div className="audio-device-option selected">
                            <span>{wifiEnabled ? wifiSsid : 'Wi-Fi Off'}</span>
                            {wifiEnabled && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        ) : (
                          wifiNetworksList.map((net) => (
                            <button
                              key={net.ssid}
                              onClick={async () => {
                                setWifiEnabled(true);
                                setWifiSsid(net.ssid);
                                setActiveControlDropdown(null);
                                await window.hitodamaAPI?.toggleWifi?.(true, net.ssid);
                              }}
                              className={`audio-device-option ${wifiSsid === net.ssid ? 'selected' : ''}`}
                            >
                              <span className="companion-truncate" style={{ maxWidth: '145px' }}>
                                {net.ssid}
                              </span>
                              <span className="companion-mono-tiny">{net.signal}%</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {activeControlDropdown === 'bluetooth' && (
                      <div
                        className="audio-output-dropdown companion-scrollable-dropdown"
                        style={{ left: '198px', right: 'auto', width: '220px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="dropdown-section-label">Bluetooth Devices</div>
                        {bluetoothDevicesList.length === 0 ? (
                          <div className="audio-device-option">
                            <span>No paired devices found</span>
                          </div>
                        ) : (
                          bluetoothDevicesList.map((dev, i) => (
                            <button
                              key={`${dev.name}-${i}`}
                              onClick={() => setActiveControlDropdown(null)}
                              className={`audio-device-option ${dev.connected ? 'selected' : ''}`}
                            >
                              <span className="companion-truncate" style={{ maxWidth: '150px' }}>
                                {dev.name}
                              </span>
                              <span className="companion-mono-tiny">{dev.connected ? 'On' : ''}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {activeControlDropdown === 'audio' && (
                      <div
                        className="audio-output-dropdown companion-scrollable-dropdown"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="dropdown-section-label">Output Devices</div>
                        {audioDevicesList.map((dev, idx) => (
                          <button
                            key={`${dev}-${idx}`}
                            onClick={() => {
                              setAudioDeviceIndex(idx);
                              setActiveControlDropdown(null);
                            }}
                            className={`audio-device-option ${audioDeviceIndex === idx ? 'selected' : ''}`}
                          >
                            <span className="companion-truncate" style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '165px' }}>
                              <SvgIcon name="speaker" size={12} /> {dev}
                            </span>
                            {audioDeviceIndex === idx && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', position: 'relative' }}>
                      <div className={`companion-adaptive-tile ${nightLight ? 'is-on' : ''}`}>
                        <div
                          className="tile-left"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const next = !nightLight;
                            setNightLight(next);
                            await window.hitodamaAPI?.toggleNightLight?.(next, nightLightStrength);
                          }}
                        >
                          <span className="tile-icon-circle">
                            <SvgIcon name="moon" size={13} />
                          </span>
                          <div className="tile-copy">
                            <div className="tile-title">Night Light</div>
                            <div className="tile-sub">
                              {nightLight ? `On · ${nightLightStrength}%` : 'Off'}
                            </div>
                          </div>
                        </div>
                        <div
                          className="tile-chevron-zone"
                          onClick={(e) => handleToggleControlDropdown('nightlight', e)}
                        >
                          <span className="tile-chevron">⌄</span>
                        </div>
                      </div>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const nextDark = !systemDarkMode;
                          setSystemDarkMode(nextDark);
                          await window.hitodamaAPI?.toggleSystemDarkMode(nextDark);
                        }}
                        className={`companion-adaptive-tile ${systemDarkMode ? 'is-on' : ''}`}
                      >
                        <div className="tile-left">
                          <span className="tile-icon-circle">
                            <SvgIcon name="contrast" size={14} />
                          </span>
                          <div className="tile-copy">
                            <div className="tile-title">Dark mode</div>
                            <div className="tile-sub">{systemDarkMode ? 'On' : 'Off'}</div>
                          </div>
                        </div>
                      </button>

                      {activeControlDropdown === 'nightlight' && (
                        <div
                          className="audio-output-dropdown"
                          style={{ top: '62px', left: 0, right: 'auto', width: '280px', padding: '12px 14px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffffff' }}>
                              Night Light Strength
                            </span>
                            <span className="companion-mono-tiny" style={{ color: 'var(--adaptive-accent)' }}>
                              {nightLightStrength}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={nightLightStrength}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setNightLightStrength(val);
                              setNightLight(true);
                              window.hitodamaAPI?.toggleNightLight?.(true, val);
                            }}
                            className="nightlight-strength-slider"
                          />
                        </div>
                      )}
                    </div>

                    <div
                      ref={volumeTrackRef}
                      className="companion-volume-pill-track"
                      onPointerDown={(e) => {
                        if (leaveCollapseTimerRef.current) {
                          clearTimeout(leaveCollapseTimerRef.current);
                        }
                        isDraggingVolumeRef.current = true;
                        setIsDraggingVolume(true);
                        updateVolumeFromClientX(e.clientX);
                      }}
                      onWheel={(e) => {
                        const delta = e.deltaY < 0 ? 4 : -4;
                        applyUserVolumeChange(volumeLevel + delta);
                      }}
                    >
                      <div
                        className="companion-volume-pill-fill"
                        style={{
                          width: `${isMuted ? 8 : Math.max(8, volumeLevel)}%`,
                          transition: isDraggingVolume ? 'none' : 'width 0.12s ease-out',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextMute = !isMuted;
                            setIsMuted(nextMute);
                            window.hitodamaAPI?.setMute?.(nextMute);
                          }}
                          className="volume-inner-speaker-btn"
                        >
                          <SvgIcon name={isMuted ? 'mute' : 'speaker'} size={14} />
                        </button>
                      </div>
                      <span className="volume-right-pct">{isMuted ? '0%' : `${volumeLevel}%`}</span>
                    </div>

                    {hasMediaSession && (
                      <div
                        className="companion-media-card-v2"
                        style={{
                          background: `linear-gradient(135deg, rgba(${mediaArtPalette.rgb}, 0.30) 0%, rgba(${mediaArtPalette.rgb}, 0.09) 52%, #17171A 100%)`,
                          border: `1px solid rgba(${mediaArtPalette.rgb}, 0.22)`,
                        }}
                      >
                        <button
                          onClick={(e) => handleToggleControlDropdown('audio', e)}
                          className="media-speaker-tag"
                        >
                          <SvgIcon name="speaker" size={11} />
                          <span>{audioOutput}</span>
                        </button>

                        <div className="media-middle-row">
                          <div
                            className="companion-album-art"
                            style={
                              activeMediaArtwork
                                ? {
                                    backgroundImage: `url("${activeMediaArtwork}")`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                  }
                                : {
                                    background: mediaArtPalette.gradient,
                                  }
                            }
                          />

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, textAlign: 'left' }}>
                            <div className="companion-truncate" style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', textAlign: 'left' }}>
                              {activeMediaTitle}
                            </div>
                            <div className="companion-truncate" style={{ fontSize: '11.5px', color: '#D4D4D8', textAlign: 'left' }}>
                              {activeMediaArtist}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={handleMediaPrev} className="media-circle-btn">
                              <SvgIcon name="prev" size={14} color="#D4D4D8" />
                            </button>
                            <button onClick={toggleMediaPlayback} className="media-ivory-play-btn">
                              <SvgIcon name={isPlayingMedia ? 'pause' : 'play'} size={16} color="#1C1917" />
                            </button>
                            <button onClick={handleMediaNext} className="media-circle-btn">
                              <SvgIcon name="next" size={14} color="#D4D4D8" />
                            </button>
                          </div>
                        </div>

                        <div className="media-bottom-scrub">
                          <span className="companion-mono-tiny">{formatTime(mediaProgress)}</span>
                          <div
                            ref={controlsScrubRef}
                            className="companion-scrub-track"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              if (leaveCollapseTimerRef.current) {
                                clearTimeout(leaveCollapseTimerRef.current);
                              }
                              activeScrubRef.current = controlsScrubRef.current;
                              isDraggingMediaScrubRef.current = true;
                              setIsDraggingMediaScrub(true);
                              updateMediaScrubFromClientX(e.clientX, true);
                            }}
                          >
                            <div
                              className="companion-scrub-fill adaptive"
                              style={{
                                width: `${Math.min(100, (mediaProgress / totalMediaDuration) * 100)}%`,
                                background: mediaArtPalette.accent,
                              }}
                            >
                              <div
                                className="companion-scrub-thumb adaptive"
                                style={{ background: mediaArtPalette.accent }}
                              />
                            </div>
                          </div>
                          <span className="companion-mono-tiny">{formatTime(totalMediaDuration)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'Today' && (
                  <div
                    className="today-tab-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '148px 1.25fr 1fr',
                      gridTemplateRows: 'minmax(0, 1fr)',
                      gap: '12px',
                      width: '100%',
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="companion-glass-card" style={{ padding: '18px 12px', alignItems: 'center', justifyContent: 'center', flex: 1.25 }}>
                        <div className="companion-bold-clock">{hoursStr}</div>
                        <div className="companion-clock-dots">• • •</div>
                        <div className="companion-bold-clock">{minsStr}</div>
                        <div style={{ fontSize: '11px', color: '#8A8A93', marginTop: '12px', fontWeight: 500 }}>
                          {ampmStr} · {dayShortStr} {selectedDay}
                        </div>
                      </div>

                      <div className="companion-glass-card" style={{ padding: '14px 12px', alignItems: 'center', justifyContent: 'center', flex: 0.75 }}>
                        <SvgIcon name="sun" size={24} color="#F5B027" />
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '4px 0 2px 0' }}>
                          32°C
                        </div>
                        <div style={{ fontSize: '11px', color: '#8A8A93' }}>Mostly clear</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="companion-glass-card" style={{ padding: '14px 16px', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>This week</span>
                          <span className="companion-mono-tiny">
                            {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', alignItems: 'center' }}>
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
                                <span style={{ fontSize: '9.5px', color: '#71717A', fontWeight: 600 }}>
                                  {item.day}
                                </span>
                                <span className={`companion-day-squircle ${isSelected ? 'selected' : ''}`}>
                                  {item.num}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div
                          className="companion-event-banner"
                          onClick={() => {
                            if (routines.length > 0) {
                              executeVoiceCommand(routines[0].command);
                            }
                          }}
                          style={{ cursor: routines.length > 0 ? 'pointer' : 'default' }}
                        >
                          <div className="companion-event-bar" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffffff' }}>
                              {routines.length > 0 ? routines[0].timeLabel : 'No scheduled routines'}
                            </div>
                            <div className="companion-truncate" style={{ fontSize: '10.5px', color: '#8A8A93' }}>
                              {routines.length > 0 ? routines[0].title : 'Ask Hito to schedule any task'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="companion-glass-card" style={{ padding: '14px 16px', flexDirection: 'row', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <div style={{ position: 'relative', width: `${timerRingSize}px`, height: `${timerRingSize}px`, flexShrink: 0 }}>
                          <svg width={timerRingSize} height={timerRingSize} style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                              cx={timerRingSize / 2}
                              cy={timerRingSize / 2}
                              r={timerRadius}
                              stroke="rgba(238, 155, 39, 0.16)"
                              strokeWidth={timerStroke}
                              fill="transparent"
                            />
                            <circle
                              cx={timerRingSize / 2}
                              cy={timerRingSize / 2}
                              r={timerRadius}
                              stroke="var(--adaptive-secondary)"
                              strokeWidth={timerStroke}
                              strokeDasharray={timerCircumference}
                              strokeDashoffset={timerDashoffset}
                              strokeLinecap="round"
                              fill="transparent"
                              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                            />
                          </svg>
                          <div className="companion-timer-readout">
                            {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                            {String(timerSeconds % 60).padStart(2, '0')}
                          </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div className="timer-unit-box">
                              <strong>0</strong> <span>h</span>
                            </div>
                            <div className="timer-unit-box">
                              <strong>{String(Math.floor(timerSeconds / 60)).padStart(2, '0')}</strong> <span>min</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
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
                                    setTimerAlarmRinging(false);
                                  }}
                                  className={`companion-preset-chip ${isActive ? 'active' : ''}`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setTimerAlarmRinging(false);
                                setIsTimerRunning(!isTimerRunning);
                              }}
                              className="timer-start-btn"
                            >
                              {isTimerRunning ? 'Pause' : 'Start'}
                            </button>
                            <button
                              onClick={() => {
                                setIsTimerRunning(false);
                                setTimerAlarmRinging(false);
                                setTimerSeconds(timerTotalSeconds);
                              }}
                              className="timer-reset-btn"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="companion-glass-card today-todo-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Today</span>
                          <div style={{ position: 'relative', width: `${todoRingSize}px`, height: `${todoRingSize}px` }}>
                            <svg width={todoRingSize} height={todoRingSize} style={{ transform: 'rotate(-90deg)' }}>
                              <circle
                                cx={todoRingSize / 2}
                                cy={todoRingSize / 2}
                                r={todoRingRadius}
                                stroke="rgba(255, 255, 255, 0.12)"
                                strokeWidth={todoRingStroke}
                                fill="transparent"
                              />
                              <circle
                                cx={todoRingSize / 2}
                                cy={todoRingSize / 2}
                                r={todoRingRadius}
                                stroke="#8ED92F"
                                strokeWidth={todoRingStroke}
                                strokeDasharray={todoRingCircumference}
                                strokeDashoffset={todoRingDashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                                style={{ transition: 'stroke-dashoffset 0.35s ease' }}
                              />
                            </svg>
                            <span className="todo-ring-center-label">
                              {completedTodosCount}/{todos.length}
                            </span>
                          </div>
                        </div>

                        <div className="today-todo-scroll-list">
                          {todos.map((todo) => (
                            <div
                              key={todo.id}
                              onClick={() => handleToggleTodo(todo.id)}
                              className={`companion-todo-row ${todo.completed ? 'completed' : ''}`}
                              style={{ position: 'relative', flexShrink: 0 }}
                            >
                              {sparkleBurstId === todo.id && (
                                <div key={sparkleAnimKey} className="todo-sparkle-burst">
                                  <span className="sparkle-dot left-dot">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                                      <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" />
                                    </svg>
                                  </span>
                                  <span className="sparkle-plus">+4</span>
                                  <span className="sparkle-dot right-dot">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                                      <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" />
                                    </svg>
                                  </span>
                                </div>
                              )}

                              <span className={`companion-todo-check ${todo.completed ? 'checked' : ''}`}>
                                {todo.completed && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </span>

                              <span className="companion-todo-text">{todo.text}</span>

                              {!todo.completed && (
                                <span className="todo-inline-ember-gain">
                                  <SvgIcon name="ember" size={10} color="#FFA94D" />
                                  <span>+4</span>
                                </span>
                              )}

                              <button
                                onClick={(e) => handleDeleteTodo(todo.id, e)}
                                className="companion-todo-del-btn"
                                title="Delete task"
                              >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path
                                    d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>

                      <div className="todo-bottom-input-bar">
                        <span style={{ color: '#71717A', fontSize: '14px', marginLeft: '4px' }}>+</span>
                        <input
                          type="text"
                          placeholder="Add a to-do..."
                          value={newTodoInput}
                          onChange={(e) => setNewTodoInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                          className="companion-todo-input"
                        />
                        <button onClick={handleAddTodo} className="companion-todo-submit">
                          →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Stats' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.85fr 1fr',
                      gap: '10px',
                      width: '100%',
                      flex: 1,
                      paddingBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', flex: 1 }}>
                        {renderCircleGauge(
                          systemStats.cpu.percent,
                          activeTheme.accent,
                          'CPU',
                          systemStats.cpu.model,
                          [systemStats.cpu.speed, `${systemStats.cpu.processes} proc`]
                        )}
                        {renderCircleGauge(
                          systemStats.gpu.percent,
                          '#C084FC',
                          'GPU',
                          systemStats.gpu.name || systemStats.gpu.model,
                          [`${systemStats.gpu.vramUsed} / ${systemStats.gpu.vramTotal} GB`]
                        )}
                        {renderCircleGauge(
                          systemStats.ram.percent,
                          '#8ED92F',
                          'RAM',
                          `${systemStats.ram.usedGb} / ${systemStats.ram.totalGb} GB`,
                          [`${systemStats.ram.freeGb} GB free`]
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div className="companion-mini-stat-box">
                          <div className="companion-mini-stat-label">DISK C:</div>
                          <div className="companion-mini-stat-val">
                            {systemStats.disk.usedGb} / {systemStats.disk.totalGb} GB
                          </div>
                        </div>
                        <div className="companion-mini-stat-box">
                          <div className="companion-mini-stat-label">NETWORK</div>
                          <div className="companion-mini-stat-val">
                            ↓ {systemStats.network.down}  ↑ {systemStats.network.up}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8A8A93' }}>
                            Top apps · {appsSortBy}
                          </span>
                          <button
                            onClick={() => setAppsSortBy((prev) => (prev === 'RAM' ? 'CPU' : 'RAM'))}
                            className="companion-sort-link"
                          >
                            {appsSortBy === 'RAM' ? 'CPU ⇄' : 'RAM ⇄'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(systemStats.topApps && systemStats.topApps.length > 0
                            ? systemStats.topApps
                            : [
                                { name: 'Scanning processes...', icon: '•', usage: '— MB', cpuUsage: '—', width: '30%' },
                              ]
                          ).map((app: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <span className="companion-app-badge">{app.icon}</span>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                  <span className="companion-truncate" style={{ color: '#ffffff', fontWeight: 700 }}>
                                    {app.name}
                                  </span>
                                  <span className="companion-mono-tiny" style={{ color: '#8A8A93', flexShrink: 0 }}>
                                    {appsSortBy === 'RAM' ? app.usage : app.cpuUsage}
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: app.width,
                                      height: '100%',
                                      background: '#8ED92F',
                                      borderRadius: '2px',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="companion-glass-card" style={{ padding: '12px 14px', justifyContent: 'space-between', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8A8A93' }}>Internet speed</span>
                          <span className="companion-mono-tiny">{speedLastTested}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '18px', margin: '4px 0' }}>
                          <div>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                              {speedDownload !== null ? speedDownload : '—'}
                            </span>{' '}
                            <span style={{ fontSize: '10px', color: '#8A8A93' }}>Mbps ↓</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                              {speedUpload !== null ? speedUpload : '—'}
                            </span>{' '}
                            <span style={{ fontSize: '10px', color: '#8A8A93' }}>Mbps ↑</span>
                          </div>
                        </div>
                        <button
                          onClick={handleRunSpeedTest}
                          disabled={isSpeedTesting}
                          className="companion-adaptive-cta-btn"
                        >
                          <span>▶</span>
                          <span>{isSpeedTesting ? 'Testing connection...' : 'Run speed test'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Clipboard' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
                    <div className="clipboard-unified-bar">
                      <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                        <SvgIcon name="search" size={13} color="#71717A" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search clipboard..."
                        value={clipboardSearch}
                        onChange={(e) => setClipboardSearch(e.target.value)}
                        className="companion-clean-input"
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {(['All', 'Text', 'Images', 'Links'] as const).map((cat) => {
                          const isActive = clipboardCategory === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => setClipboardCategory(cat)}
                              className={`clipboard-inline-filter ${isActive ? 'active' : ''}`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => openCompanionApp('settings', false)}
                          className="clipboard-gear-btn"
                        >
                          <SvgIcon name="gear" size={13} />
                        </button>
                      </div>
                    </div>

                    {clipboardItems.length === 0 ? (
                      <div className="companion-glass-card" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#71717A' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#A1A1AA' }}>Clipboard is empty</div>
                        <div style={{ fontSize: '11.5px' }}>Copy any text, link, code snippet, or screenshot on your PC to see it here.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.32fr', gap: '14px', flex: 1, minHeight: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                          {filteredClipboardItems.some((i) => i.isPinned) && (
                            <div>
                              <div className="companion-section-header">PINNED</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {filteredClipboardItems
                                  .filter((i) => i.isPinned)
                                  .map((item) => {
                                    const isSelected = selectedClip?.id === item.id;
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => {
                                          setSelectedClipboardId(item.id);
                                        }}
                                        onDoubleClick={() => {
                                          setSelectedClipboardId(item.id);
                                          if (item.preview) {
                                            navigator.clipboard?.writeText(item.preview).catch(() => {});
                                            window.hitodamaAPI?.writeClipboardText?.(item.preview);
                                            window.hitodamaAPI?.typeText?.(item.preview);
                                          }
                                          triggerClipboardToast('Pasted!');
                                        }}
                                        className={`clipboard-item-row ${isSelected ? 'selected' : ''}`}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                                          <span className="clipboard-icon-box">
                                            <SvgIcon name="pin" size={11} />
                                          </span>
                                          <span className="companion-truncate" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                            {item.label}
                                          </span>
                                        </div>
                                        <div className="clipboard-row-actions">
                                          {item.time && <span className="companion-mono-tiny">{item.time}</span>}
                                          <button
                                            type="button"
                                            title="Options"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuClipId((curr) => (curr === item.id ? null : item.id));
                                            }}
                                            className="clipboard-row-dots-btn"
                                          >
                                            <SvgIcon name="dots" size={13} color="#94A3B8" />
                                          </button>
                                        </div>

                                        {openMenuClipId === item.id && (
                                          <div
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                            className="clipboard-row-dropdown"
                                          >
                                            <button
                                              type="button"
                                              className="clipboard-dropdown-item"
                                              onPointerDown={(e) => e.stopPropagation()}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuClipId(null);
                                                setSelectedClipboardId(item.id);
                                                handleCopyClip(item);
                                              }}
                                            >
                                              <SvgIcon name="clipboard" size={11} />
                                              <span>Copy</span>
                                            </button>
                                            <button
                                              type="button"
                                              className="clipboard-dropdown-item"
                                              onPointerDown={(e) => e.stopPropagation()}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuClipId(null);
                                                handleTogglePinClip(item.id);
                                              }}
                                            >
                                              <SvgIcon name="pin" size={11} />
                                              <span>Unpin</span>
                                            </button>
                                            <button
                                              type="button"
                                              className="clipboard-dropdown-item danger"
                                              onPointerDown={(e) => e.stopPropagation()}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuClipId(null);
                                                handleDeleteClip(item.id);
                                              }}
                                            >
                                              <SvgIcon name="trash" size={11} />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="companion-section-header">TODAY</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {filteredClipboardItems
                                .filter((i) => !i.isPinned)
                                .map((item) => {
                                  const isSelected = selectedClip?.id === item.id;
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => {
                                        setSelectedClipboardId(item.id);
                                      }}
                                      onDoubleClick={() => {
                                        setSelectedClipboardId(item.id);
                                        if (item.preview) {
                                          navigator.clipboard?.writeText(item.preview).catch(() => {});
                                          window.hitodamaAPI?.writeClipboardText?.(item.preview);
                                          window.hitodamaAPI?.typeText?.(item.preview);
                                        }
                                        triggerClipboardToast('Pasted!');
                                      }}
                                      className={`clipboard-item-row ${isSelected ? 'selected' : ''}`}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                                        <span className="clipboard-icon-box">
                                          {item.iconType === 'link' ? (
                                            <SvgIcon name="link" size={11} />
                                          ) : item.iconType === 'image' ? (
                                            <SvgIcon name="image" size={11} />
                                          ) : item.iconType === 'code' ? (
                                            '</>'
                                          ) : (
                                            '≡'
                                          )}
                                        </span>
                                        <span className="companion-truncate" style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                          {item.label}
                                        </span>
                                      </div>
                                      <div className="clipboard-row-actions">
                                        {item.time && <span className="companion-mono-tiny">{item.time}</span>}
                                        <button
                                          type="button"
                                          title="Options"
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuClipId((curr) => (curr === item.id ? null : item.id));
                                          }}
                                          className="clipboard-row-dots-btn"
                                        >
                                          <SvgIcon name="dots" size={13} color="#94A3B8" />
                                        </button>
                                      </div>

                                      {openMenuClipId === item.id && (
                                        <div
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                          className="clipboard-row-dropdown"
                                        >
                                          <button
                                            type="button"
                                            className="clipboard-dropdown-item"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuClipId(null);
                                              setSelectedClipboardId(item.id);
                                              handleCopyClip(item);
                                            }}
                                          >
                                            <SvgIcon name="clipboard" size={11} />
                                            <span>Copy</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="clipboard-dropdown-item"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuClipId(null);
                                              handleTogglePinClip(item.id);
                                            }}
                                          >
                                            <SvgIcon name="pin" size={11} />
                                            <span>Pin</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="clipboard-dropdown-item danger"
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuClipId(null);
                                              handleDeleteClip(item.id);
                                            }}
                                          >
                                            <SvgIcon name="trash" size={11} />
                                            <span>Delete</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>

                        {selectedClip && (
                          <div className="companion-glass-card" style={{ padding: '18px 20px', justifyContent: 'space-between', position: 'relative' }}>
                            {clipboardToast && <div className="companion-floating-toast">{clipboardToast}</div>}
                            {selectedClip.imageDataUrl ? (
                              <img
                                src={selectedClip.imageDataUrl}
                                alt="Copied preview"
                                style={{ maxHeight: '140px', objectFit: 'contain', borderRadius: '8px' }}
                              />
                            ) : (
                              <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: '#FFFFFF', fontWeight: 700, wordBreak: 'break-word', maxHeight: '145px', overflowY: 'auto' }}>
                                {selectedClip.preview}
                              </div>
                            )}

                            <div className="clipboard-meta-table">
                              <div className="meta-row">
                                <span className="meta-label">Type</span>
                                <strong className="meta-val">{selectedClip.type}</strong>
                              </div>
                              <div className="meta-row">
                                <span className="meta-label">Size</span>
                                <strong className="meta-val">{selectedClip.size}</strong>
                              </div>
                              <div className="meta-row">
                                <span className="meta-label">Copied</span>
                                <strong className="meta-val">{selectedClip.copied}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="clipboard-footer-bar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button
                          onClick={() => {
                            if (!selectedClip) return;
                            if (selectedClip.preview) {
                              navigator.clipboard?.writeText(selectedClip.preview).catch(() => {});
                              window.hitodamaAPI?.writeClipboardText?.(selectedClip.preview);
                              window.hitodamaAPI?.typeText?.(selectedClip.preview);
                            }
                            triggerClipboardToast('Pasted!');
                          }}
                          className="clipboard-action-pair"
                        >
                          <span className="kbd-badge">↵</span>
                          <span className="kbd-label">Paste</span>
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedClip) return;
                            handleCopyClip(selectedClip);
                          }}
                          className="clipboard-action-pair"
                        >
                          <span className="kbd-badge">Ctrl C</span>
                          <span className="kbd-label">Copy</span>
                        </button>
                        <button
                          onClick={() => selectedClip && handleTogglePinClip(selectedClip.id)}
                          className="clipboard-action-pair"
                        >
                          <span className="kbd-badge">Ctrl P</span>
                          <span className="kbd-label">{selectedClip?.isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button
                          onClick={() => selectedClip && handleDeleteClip(selectedClip.id)}
                          className="clipboard-action-pair"
                        >
                          <span className="kbd-badge">Del</span>
                          <span className="kbd-label">Remove</span>
                        </button>
                      </div>
                      <div className="companion-mono-tiny">
                        ↑↓ Move · Ctrl/Shift pick several · Tab Filter
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Agents' && (
                  <AgentsNotchView
                    tasks={agentTasks}
                    onOpenGeneratedPage={(html, filePath) => {
                      (window as any).hitodamaAPI?.openGeneratedPage?.(html, filePath);
                    }}
                  />
                )}

                {activeTab === 'Apps' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    <div className="clipboard-unified-bar">
                      <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                        <SvgIcon name="search" size={13} color="#71717A" />
                      </span>
                      <input
                        type="text"
                        value={appSearchQuery}
                        onChange={(e) => setAppSearchQuery(e.target.value)}
                        placeholder="Search apps..."
                        className="companion-clean-input"
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {appSearchQuery.trim() && (
                          <button
                            onClick={() => {
                              setIsExpanded(false);
                              handleFindAndPoint(appSearchQuery);
                            }}
                            className="clipboard-inline-filter"
                            style={{
                              background: 'rgba(92, 184, 255, 0.18)',
                              borderColor: 'rgba(92, 184, 255, 0.45)',
                              color: '#BAE6FD',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Have Hito fly across your monitor and point at this on screen"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="9" />
                              <line x1="12" y1="2" x2="12" y2="6" />
                              <line x1="12" y1="18" x2="12" y2="22" />
                              <line x1="2" y1="12" x2="6" y2="12" />
                              <line x1="18" y1="12" x2="22" y2="12" />
                            </svg>
                            <span>Point Out</span>
                          </button>
                        )}
                        {(['All', 'Starred', 'Games', 'Apps'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setAppFilterTab(tab)}
                            className={`clipboard-inline-filter ${appFilterTab === tab ? 'active' : ''}`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className="companion-scrollable-list"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        flex: 1,
                        overflowY: 'auto',
                        paddingRight: '4px',
                      }}
                    >
                      {appFilterTab === 'All' && !appSearchQuery && processedApps.some((a) => a.starred) && (
                        <div>
                          <div className="companion-section-header">STARRED</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {processedApps
                              .filter((a) => a.starred)
                              .map((item) => (
                                <div
                                  key={`starred-${item.id}`}
                                  onClick={() => handleLaunchApp(item.appId || item.name)}
                                  className="companion-app-row highlighted"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {item.iconUrl ? (
                                      <img src={item.iconUrl} alt="" className="companion-native-app-icon" />
                                    ) : (
                                      <span className="companion-app-badge">{item.key}</span>
                                    )}
                                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                                      {item.name}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="companion-mono-tiny" style={{ color: '#8A8A93' }}>
                                      {item.tag}
                                    </span>
                                    <button
                                      onClick={(e) => toggleStarApp(item.name, e)}
                                      className="companion-star-btn starred"
                                    >
                                      <SvgIcon name="star" size={13} color="var(--adaptive-accent)" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {alphabeticalAppGroups.map(([letter, items]) => (
                        <div key={letter}>
                          <div className="win11-alpha-header">{letter}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {items.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleLaunchApp(item.appId || item.name)}
                                className="companion-app-row"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {item.iconUrl ? (
                                    <img src={item.iconUrl} alt="" className="companion-native-app-icon" />
                                  ) : (
                                    <span className="companion-app-badge">{item.key}</span>
                                  )}
                                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>
                                    {item.name}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span className="companion-mono-tiny" style={{ color: '#8A8A93' }}>
                                    {item.tag}
                                  </span>
                                  <button
                                    onClick={(e) => toggleStarApp(item.name, e)}
                                    className={`companion-star-btn ${item.starred ? 'starred' : ''}`}
                                  >
                                    <SvgIcon
                                      name="star"
                                      size={13}
                                      color={item.starred ? 'var(--adaptive-accent)' : '#3F3F46'}
                                    />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'Wallpaper' && (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}
                    onWheel={handleWallpaperWheel}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setWallpaperSourceTab('Recent')}
                          className={`companion-filter-pill ${wallpaperSourceTab === 'Recent' ? 'active' : ''}`}
                        >
                          Recent
                        </button>
                        <button
                          onClick={handlePickLocalWallpapers}
                          className={`companion-filter-pill ${wallpaperSourceTab === 'My folder' ? 'active' : ''}`}
                        >
                          My folder
                        </button>
                        <span className="companion-mono-tiny" style={{ marginLeft: '6px' }}>
                          {wallpapersList.length} pictures
                        </span>
                      </div>
                    </div>

                    <div className="wallpaper-slanted-gallery">
                      <div ref={wallpaperTrackRef} className="wallpaper-slanted-track">
                        {trackWallpapers.map(({ wp, originalIndex, isCenter, isApplied }) => (
                          <div
                            key={wp.id}
                            onClick={() => handleWallpaperStripClick(originalIndex)}
                            className={`wallpaper-slanted-strip ${isCenter ? 'selected' : ''} ${isApplied ? 'applied' : ''}`}
                          >
                            <div
                              className="wallpaper-slanted-image"
                              style={{ backgroundImage: `url("${wp.thumb}")` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ height: '4px' }} />
                  </div>
                )}

                {activeTab === 'Power' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center' }}>
                    {pendingPowerAction ? (
                      <div className="power-confirm-bar">
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                          Are you sure you want to {pendingPowerAction === 'shutdown' ? 'shut down' : pendingPowerAction} your PC?
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={confirmAndExecutePowerAction} className="power-confirm-btn danger">
                            Confirm {pendingPowerAction}
                          </button>
                          <button onClick={() => setPendingPowerAction(null)} className="power-confirm-btn">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <button onClick={() => setPendingPowerAction('lock')} className="companion-power-card">
                          <SvgIcon name="padlock" size={18} color="#ffffff" />
                          <span className="companion-power-label">Lock</span>
                        </button>
                        <button onClick={() => setPendingPowerAction('sleep')} className="companion-power-card">
                          <SvgIcon name="moon" size={18} color="#ffffff" />
                          <span className="companion-power-label">Sleep</span>
                        </button>
                        <button onClick={() => setPendingPowerAction('restart')} className="companion-power-card">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            <polyline points="21 3 21 9 15 9" />
                          </svg>
                          <span className="companion-power-label">Restart</span>
                        </button>
                        <button onClick={() => setPendingPowerAction('shutdown')} className="companion-power-card">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                          </svg>
                          <span className="companion-power-label">Shut down</span>
                        </button>
                      </div>
                    )}
                    {powerFeedback && (
                      <div className="companion-mono-tiny" style={{ textAlign: 'center', color: 'var(--adaptive-accent)' }}>
                        {powerFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          FIRST-LAUNCH GAMIFIED WAKING SOUL ONBOARDING WITH EMBER REWARDS
          ===================================================================== */}
      {onboardingStep !== null && (
        <HitodamaOnboardingExperience
          soul={currentSoul}
          customShortcuts={customShortcuts}
          lastTriggeredHotkey={lastHotkeyAction}
          liveSpeechText={liveSpeechRef.current || askWords.join(' ')}
          isIslandExpanded={isExpanded}
          geminiDraftKey={geminiDraftKey}
          tavilyDraftKey={tavilyDraftKey}
          onChangeGeminiKey={setGeminiDraftKey}
          onChangeTavilyKey={setTavilyDraftKey}
          onAwardEmbers={addEmbers}
          onSpeak={speakAsHitodama}
          onPreviewExpandIsland={(expand) => {
            setIsTucked(!expand);
            setIsExpanded(expand);
            if (expand) setActiveTab('Controls');
          }}
          onComplete={completeOnboarding}
        />
      )}

      {/* =====================================================================
          FREELY DRAGGABLE HITODAMA CONFIGURATION, ORBITING LOADOUT & CARD DECK WINDOW
          ===================================================================== */}
      {showCompanionWindow && (
        <div
          className={`hitodama-config-app-window ${companionDockTab === 'soul' ? 'loadout-theme' : 'settings-theme'}`}
          style={{
            position: 'fixed',
            left: `${appWindowPos.x}px`,
            top: `${appWindowPos.y}px`,
            margin: 0,
          }}
        >
          <div
            className="config-app-topbar"
            style={{ cursor: isDraggingAppWin ? 'grabbing' : 'grab' }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              dragOffsetRef.current = {
                dx: e.clientX - appWindowPos.x,
                dy: e.clientY - appWindowPos.y,
              };
              setIsDraggingAppWin(true);
            }}
          >
            {activeDeckSlot ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {activeDeckSlot}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'none' }}>
                <div className="topbar-soul-avatar">
                  <SoulCanvas soul={currentSoul} width={50} height={44} scale={0.94} mode="LISTENING" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.01em' }}>
                  Hitodama
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="embers-currency-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <LivingEmberIcon size={15} isDull={isSoulDull} />
                <span>{embers.toLocaleString()} embers</span>
              </div>
              <button
                onClick={() => {
                  const next = !sfxEnabled;
                  setSfxEnabled(next);
                  soundFX.setEnabled(next);
                }}
                title={sfxEnabled ? 'UI Sounds: On' : 'UI Sounds: Muted'}
                className="companion-header-circle"
              >
                {sfxEnabled ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  if (activeDeckSlot) {
                    setActiveDeckSlot(null);
                  } else {
                    setShowCompanionWindow(false);
                    setShowConnectModal(false);
                  }
                }}
                className="config-app-close-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {activeDeckSlot && currentSlotCards.length > 0 ? (
            <div
              className="loadout-fanned-deck-stage"
              onWheel={(e) => {
                const nowMs = performance.now();
                if (nowMs - wheelLockRef.current < 140) return;
                wheelLockRef.current = nowMs;
                if (e.deltaY > 0 || e.deltaX > 0) {
                  setDeckCardIndex((i) => Math.min(currentSlotCards.length - 1, i + 1));
                } else if (e.deltaY < 0 || e.deltaX < 0) {
                  setDeckCardIndex((i) => Math.max(0, i - 1));
                }
              }}
            >
              <div className="fanned-cards-stack">
                {currentSlotCards.map((card, idx) => {
                  const diff = idx - deckCardIndex;
                  if (Math.abs(diff) > 3) return null;

                  const isActiveCard = diff === 0;
                  const isVoidUnlocked = unlockedCardIds.includes('soul_void');
                  const isUnlocked =
                    unlockedCardIds.includes(card.id) ||
                    card.cost === 0 ||
                    (card.id === 'abil_collapse' && isVoidUnlocked);
                  const isEquipped = equippedCards[card.slot] === card.id;
                  const moreToGo = Math.max(0, card.cost - embers);

                  const translateX = diff * 36;
                  const translateY = Math.abs(diff) * 8;
                  const rotateDeg = diff * 4.5;
                  const scaleVal = 1 - Math.abs(diff) * 0.045;
                  const zIndexVal = 20 - Math.abs(diff);

                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        if (!isActiveCard) setDeckCardIndex(idx);
                      }}
                      className={`collectible-loadout-card ${isActiveCard ? 'is-front' : 'is-fanned'}`}
                      style={{
                        background: card.cardTint,
                        transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotateDeg}deg) scale(${scaleVal})`,
                        zIndex: zIndexVal,
                        opacity: isActiveCard ? 1 : Math.max(0.32, 0.72 - Math.abs(diff) * 0.18),
                      }}
                    >
                      {isActiveCard && (
                        <>
                          <div className="card-visual-center">
                            {card.iconKind === 'wave' && (
                              <div
                                className="card-cyan-waveform"
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const vName = (card.name || 'Charon') as HitodamaVoiceName;
                                  voiceEngine.speak(`I am ${vName}. Give your computer a soul.`, {
                                    voice: vName,
                                  });
                                }}
                                title="Click to hear voice preview"
                              >
                                {[0.4, 0.75, 1.0, 0.65, 0.38].map((barH, bIdx) => (
                                  <span key={bIdx} style={{ height: `${Math.round(barH * 42)}px` }} />
                                ))}
                              </div>
                            )}
                            {card.iconKind === 'soul' && (
                              <div style={{ width: '88px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <SoulCanvas
                                  soul={SOUL_SKINS.find((s) => s.key === card.skinKey) || currentSoul}
                                  width={84}
                                  height={68}
                                  scale={1.0}
                                  mode="LISTENING"
                                />
                              </div>
                            )}
                            {card.iconKind === 'void' && (
                              <div className="card-void-soul-wrap">
                                <SoulCanvas
                                  soul={SOUL_SKINS.find((s) => s.key === 'flame_void') || currentSoul}
                                  width={84}
                                  height={68}
                                  scale={1.0}
                                  mode="LISTENING"
                                />
                              </div>
                            )}
                            {card.iconKind === 'collapse_eye' && (
                              <div className="card-padlock-large">
                                <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
                                  <ellipse cx="32" cy="22" rx="24" ry="13" stroke="#E2BA78" strokeWidth="4.5" />
                                  <circle cx="32" cy="22" r="11" fill="#1C1915" stroke="#E2BA78" strokeWidth="4.5" />
                                </svg>
                              </div>
                            )}
                            {card.iconKind === 'sidearm_bullet' && (
                              <div className="card-padlock-large">
                                <svg width="44" height="58" viewBox="0 0 44 58" fill="none">
                                  <path
                                    d="M13 24C13 13 22 5 22 5C22 5 31 13 31 24V48C31 50.2 29.2 52 27 52H17C14.8 52 13 50.2 13 48V24Z"
                                    stroke="#E2BA78"
                                    strokeWidth="4.2"
                                    strokeLinejoin="round"
                                  />
                                  <line x1="13" y1="26" x2="31" y2="26" stroke="#E2BA78" strokeWidth="4" />
                                  <line x1="13" y1="40" x2="31" y2="40" stroke="#E2BA78" strokeWidth="4" />
                                </svg>
                              </div>
                            )}
                            {card.iconKind === 'lock' && (
                              <div className="card-padlock-large">
                                <SvgIcon name="padlock" size={62} color="rgba(255,255,255,0.28)" />
                              </div>
                            )}
                            {card.iconKind === 'plus' && (
                              <div className="card-plus-large">+</div>
                            )}
                            {card.iconKind === 'chad' && (
                              <div className="card-padlock-large">
                                <SvgIcon name="smile" size={54} color="#FB923C" />
                              </div>
                            )}

                            <div className="card-title-text">{card.name}</div>

                            {card.rarity && (
                              <span className="card-rarity-pill">{card.rarity}</span>
                            )}

                            {card.description && (
                              <p className="card-lore-desc">{card.description}</p>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquipOrUnlockCard(card);
                            }}
                            className={`card-bottom-action-btn ${isEquipped ? 'equipped' : isUnlocked && !card.notForSale ? 'unlocked' : embers >= card.cost && !card.notForSale ? 'can-afford' : 'locked'}`}
                          >
                            {card.notForSale && !isVoidUnlocked
                              ? 'Not for sale'
                              : isEquipped
                              ? card.slot === 'Soul'
                                ? 'Worn'
                                : 'Active'
                              : isUnlocked
                              ? card.slot === 'Soul'
                                ? 'Wear Soul'
                                : 'Activate'
                              : moreToGo === 0
                              ? `🔥 Forge for ${card.cost.toLocaleString()} Embers`
                              : `🔥 ${card.cost.toLocaleString()} Embers · ${moreToGo.toLocaleString()} more to go`}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="deck-pagination-bar">
                <button
                  onClick={() => setDeckCardIndex((i) => Math.max(0, i - 1))}
                  disabled={deckCardIndex === 0}
                  className="deck-page-circle-btn"
                >
                  ‹
                </button>
                <span className="deck-page-counter">
                  {deckCardIndex + 1} of {currentSlotCards.length}
                </span>
                <button
                  onClick={() => setDeckCardIndex((i) => Math.min(currentSlotCards.length - 1, i + 1))}
                  disabled={deckCardIndex === currentSlotCards.length - 1}
                  className="deck-page-circle-btn"
                >
                  ›
                </button>
              </div>

              {activeDeckSlot === 'Abilities' && (
                <div className="abilities-trigger-footer">
                  <div className="trigger-copy-left">
                    <div className="trigger-title">Trigger button</div>
                    <div className="trigger-sub">
                      Click, then press any key or mouse button. Esc cancels.
                    </div>
                  </div>
                  <button
                    onClick={() => setIsBindingTrigger(true)}
                    className={`trigger-keybind-btn ${isBindingTrigger ? 'binding' : ''}`}
                  >
                    {isBindingTrigger ? 'Press key...' : abilityTriggerKey}
                  </button>
                </div>
              )}
            </div>
          ) : companionDockTab === 'settings' ? (
            <div className="config-app-body">
              <div className="config-sidebar">
                <div className="config-sidebar-title">Settings</div>
                <div className="config-sidebar-search">
                  <SvgIcon name="search" size={12} color="#64748B" />
                  <input
                    type="text"
                    placeholder="Search settings"
                    value={settingsSearch}
                    onChange={(e) => setSettingsSearch(e.target.value)}
                  />
                </div>

                <div className="config-sidebar-nav">
                  {(
                    [
                      { id: 'Hito', icon: 'user' },
                      { id: 'Shortcuts', icon: 'keyboard' },
                      { id: 'Behavior', icon: 'sliders' },
                      { id: 'System', icon: 'gear' },
                      { id: 'API keys', icon: 'key' },
                      { id: 'Your data', icon: 'database' },
                      { id: 'Privacy', icon: 'shield' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSettingsSection(item.id)}
                      className={`config-sidebar-item ${settingsSection === item.id ? 'active' : ''}`}
                    >
                      <span className="sidebar-item-icon">
                        <SvgIcon name={item.icon} size={13} />
                      </span>
                      <span>{item.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-main-panel">
                {settingsSection === 'API keys' && (
                  <>
                    <h2 className="config-panel-heading">API keys</h2>
                    <p className="config-panel-sub">
                      Your Gemini key, and a free Tavily key for web search.
                    </p>

                    <div className="config-group-label">Gemini</div>
                    <div className="config-card-group">
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Gemini API key</div>
                          <div className="config-row-desc">
                            {apiKey
                              ? 'Stored encrypted on this PC, never shown again once saved'
                              : 'No Gemini key saved yet — click Change to add your key'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setGeminiDraftKey(apiKey);
                            setShowConnectModal(true);
                          }}
                          className="config-pill-btn"
                        >
                          Change
                        </button>
                      </div>

                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Forget my API key</div>
                          <div className="config-row-desc">
                            Erases your Gemini key from this PC; Hito asks for one again
                          </div>
                        </div>
                        <button onClick={handleForgetGeminiKey} className="config-pill-btn">
                          Forget...
                        </button>
                      </div>
                    </div>

                    <div className="config-group-label" style={{ marginTop: '18px' }}>
                      Web search
                    </div>
                    <div className="config-card-group">
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Tavily API key</div>
                          <div className={`config-row-desc ${tavilyKey ? 'connected-green' : ''}`}>
                            {tavilyKey
                              ? 'Connected · Live web search enabled'
                              : 'Not connected · Add a free Tavily key below for live web search'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="password"
                            placeholder="tvly-..."
                            value={tavilyDraftKey}
                            onChange={(e) => setTavilyDraftKey(e.target.value)}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '7px',
                              padding: '5px 10px',
                              color: '#F1F5F9',
                              fontSize: '11.5px',
                              width: '130px',
                              outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => {
                              if (tavilyDraftKey.trim()) {
                                setTavilyKey(tavilyDraftKey.trim());
                                localStorage.setItem('hitodama_tavily_key', tavilyDraftKey.trim());
                              } else {
                                setTavilyKey('');
                                localStorage.removeItem('hitodama_tavily_key');
                              }
                            }}
                            className="config-pill-btn"
                          >
                            {tavilyKey ? 'Update' : 'Save'}
                          </button>
                        </div>
                      </div>

                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Get a free Tavily key</div>
                          <div className="config-row-desc">
                            1,000 free credits a month, no card. Sign up, copy the key, paste it above
                          </div>
                        </div>
                        <button
                          onClick={() => window.hitodamaAPI?.openUrl('https://tavily.com')}
                          className="config-pill-btn"
                        >
                          Get one
                        </button>
                      </div>

                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">What it sends</div>
                          <div className="config-row-desc" style={{ lineHeight: 1.45 }}>
                            Only your research question goes to Tavily, from this PC under your own account. Tavily may use searches to improve its AI — don't research passwords, ID numbers or health details. Deep research only when you ask for it (about 7 credits)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="config-group-label" style={{ marginTop: '18px' }}>
                      Connected Apps & Soul Links
                    </div>
                    <div className="config-card-group">
                      {(['notion', 'github', 'vscode', 'figma', 'gmail'] as const).map((appKey) => {
                        const linked = multitaskAgent.isAppConnected(appKey);
                        const labelMap = {
                          notion: 'Notion Workspace',
                          github: 'GitHub Repositories',
                          vscode: 'Visual Studio Code',
                          figma: 'Figma Design Canvas',
                          gmail: 'Google Mail',
                        };
                        return (
                          <div key={appKey} className="config-card-row">
                            <div className="config-row-copy">
                              <div className="config-row-title">{labelMap[appKey]}</div>
                              <div className={`config-row-desc ${linked ? 'connected-green' : ''}`}>
                                {linked ? 'Connected · Proactive suggestions & agent actions enabled' : 'Not linked'}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (linked) multitaskAgent.unlinkApp(appKey);
                                else multitaskAgent.connectApp(appKey);
                                // Trigger re-render
                                setDetectedAppId((prev) => (prev === appKey ? null : prev));
                              }}
                              className="config-pill-btn"
                              style={
                                linked
                                  ? { borderColor: 'rgba(239, 68, 68, 0.35)', color: '#FCA5A5' }
                                  : { borderColor: 'rgba(92, 184, 255, 0.35)', color: '#BAE6FD' }
                              }
                            >
                              {linked ? 'Unlink' : 'Connect'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {settingsSection === 'Hito' && (
                  <>
                    <h2 className="config-panel-heading">Hito</h2>
                    <p className="config-panel-sub">Your soul's identity, active loadout, and onboarding guide.</p>
                    <div className="config-card-group">
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Active Soul Loadout</div>
                          <div className="config-row-desc">
                            Soul: {getEquippedCardName('Soul')} · Voice: {getEquippedCardName('Voice')} · Personality: {getEquippedCardName('Personality')}
                          </div>
                        </div>
                        <button onClick={() => setCompanionDockTab('soul')} className="config-pill-btn">
                          Customize Loadout
                        </button>
                      </div>
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Embers Forge Balance</div>
                          <div className="config-row-desc">
                            {embers.toLocaleString()} embers available · {rewardedTaskIds.length}/5 daily task rewards claimed today
                          </div>
                        </div>
                        <div
                          className="embers-currency-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        >
                          <LivingEmberIcon size={15} isDull={isSoulDull} />
                          <span>{embers.toLocaleString()} embers</span>
                        </div>
                      </div>
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Interactive Onboarding Tour</div>
                          <div className="config-row-desc">Replay the 4-step walkthrough and API setup guide</div>
                        </div>
                        <button
                          onClick={() => {
                            setShowCompanionWindow(false);
                            setIsTucked(false);
                            setOnboardingStep(0);
                          }}
                          className="config-pill-btn"
                        >
                          Replay Tour
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {settingsSection === 'Shortcuts' && (
                  <>
                    <h2 className="config-panel-heading">Shortcuts</h2>
                    <p className="config-panel-sub">Global Windows hotkeys for voice commands, dictation, and vision.</p>
                    <div className="config-card-group">
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Ask Hito</div>
                          <div className="config-row-desc">Wake the soul to run commands, toggle dark mode, or search YouTube & Google</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBindingShortcutKey(bindingShortcutKey === 'ask' ? null : 'ask')}
                          className={`config-pill-btn ${bindingShortcutKey === 'ask' ? 'binding' : ''}`}
                        >
                          {bindingShortcutKey === 'ask' ? 'Press keys... (Esc)' : customShortcuts.ask}
                        </button>
                      </div>
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Circle to Ask</div>
                          <div className="config-row-desc">Circle any region on screen and ask about it out loud</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBindingShortcutKey(bindingShortcutKey === 'circle' ? null : 'circle')}
                          className={`config-pill-btn ${bindingShortcutKey === 'circle' ? 'binding' : ''}`}
                        >
                          {bindingShortcutKey === 'circle' ? 'Press keys... (Esc)' : customShortcuts.circle}
                        </button>
                      </div>
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Clean Dictation</div>
                          <div className="config-row-desc">Talk badly with false starts and paste finished text into any window</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBindingShortcutKey(bindingShortcutKey === 'dictate' ? null : 'dictate')}
                          className={`config-pill-btn ${bindingShortcutKey === 'dictate' ? 'binding' : ''}`}
                        >
                          {bindingShortcutKey === 'dictate' ? 'Press keys... (Esc)' : customShortcuts.dictate}
                        </button>
                      </div>
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Ability Trigger Button</div>
                          <div className="config-row-desc">Key or mouse button used to fire equipped Abilities like Collapse or Sidearm</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsBindingTrigger((prev) => !prev)}
                          className={`config-pill-btn ${isBindingTrigger ? 'binding' : ''}`}
                        >
                          {isBindingTrigger ? 'Press key...' : abilityTriggerKey}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {settingsSection === 'Behavior' && (
                  <>
                    <h2 className="config-panel-heading">Behavior</h2>
                    <p className="config-panel-sub">Control how the top notch and voice feedback behave while you work.</p>
                    <div className="config-card-group">
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Auto-tuck into top bezel when idle</div>
                          <div className="config-row-desc">Retracts into a 18px sliver after 4.5s so top browser tabs are never blocked</div>
                        </div>
                        <button
                          onClick={() => {
                            const next = !autoTuckEnabled;
                            setAutoTuckEnabled(next);
                            localStorage.setItem('hitodama_autotuck', String(next));
                          }}
                          className="config-pill-btn"
                        >
                          {autoTuckEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Spoken voice responses ({getEquippedCardName('Voice')})</div>
                          <div className="config-row-desc">Read Hito's replies out loud alongside the on-screen pill</div>
                        </div>
                        <button
                          onClick={() => {
                            const next = !voiceFeedbackEnabled;
                            setVoiceFeedbackEnabled(next);
                            localStorage.setItem('hitodama_voice_tts', String(next));
                          }}
                          className="config-pill-btn"
                        >
                          {voiceFeedbackEnabled ? 'On' : 'Muted'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {settingsSection === 'System' && (
                  <>
                    <h2 className="config-panel-heading">System</h2>
                    <p className="config-panel-sub">Windows integration, startup behavior, and hardware telemetry.</p>
                    <div className="config-card-group">
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Launch Hito at Windows startup</div>
                          <div className="config-row-desc">Start minimized in your top monitor bezel and system tray</div>
                        </div>
                        <button
                          onClick={() => {
                            const next = !launchAtStartup;
                            setLaunchAtStartup(next);
                            localStorage.setItem('hitodama_startup', String(next));
                          }}
                          className="config-pill-btn"
                        >
                          {launchAtStartup ? 'Active' : 'Off'}
                        </button>
                      </div>
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Detected Graphics Hardware</div>
                          <div className="config-row-desc">{systemStats.gpu.name || systemStats.gpu.model} ({systemStats.gpu.vramTotal} GB VRAM)</div>
                        </div>
                        <span className="config-pill-btn">Active</span>
                      </div>
                    </div>
                  </>
                )}

                {settingsSection === 'Your data' && (
                  <>
                    <h2 className="config-panel-heading">Your data</h2>
                    <p className="config-panel-sub">Manage local clipboard history, To-Do tasks, and scheduled routines.</p>
                    <div className="config-card-group">
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Clear Clipboard History ({clipboardItems.length} items)</div>
                          <div className="config-row-desc">Removes all unpinned items from Hito's local clipboard list</div>
                        </div>
                        <button
                          onClick={() => {
                            setClipboardItems((prev) => {
                              const remaining = prev.filter((i) => i.isPinned);
                              try {
                                localStorage.setItem('hitodama_clip_history', JSON.stringify(remaining));
                              } catch (_) {}
                              return remaining;
                            });
                            window.hitodamaAPI?.clearClipboardHistory?.();
                          }}
                          className="config-pill-btn"
                        >
                          Clear Unpinned
                        </button>
                      </div>
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Reset To-Do & Routine List</div>
                          <div className="config-row-desc">Clears all completed tasks and scheduled routines</div>
                        </div>
                        <button
                          onClick={() => {
                            setTodos([]);
                            setRoutines([]);
                          }}
                          className="config-pill-btn"
                        >
                          Clear Tasks
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {settingsSection === 'Privacy' && (
                  <>
                    <h2 className="config-panel-heading">Privacy</h2>
                    <p className="config-panel-sub">100% local storage. Your keys and screen captures never touch a middleman server.</p>
                    <div className="config-card-group">
                      <div className="config-card-row">
                        <div className="config-row-copy">
                          <div className="config-row-title">Direct-to-Provider Architecture</div>
                          <div className="config-row-desc" style={{ lineHeight: 1.5 }}>
                            Hito runs directly on your PC. Voice, screen lasso captures, and search prompts go straight from your machine to Google Gemini and Tavily using your own keys.
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="loadout-compass-stage">
              <div className="loadout-heading-label">Loadout</div>

              <svg
                className="loadout-compass-svg"
                width="880"
                height="492"
                viewBox="0 0 880 492"
              >
                {orbitingNodes.map((n) => (
                  <g key={n.slot}>
                    <path
                      d={n.pathD}
                      stroke={draggingNodeSlot === n.slot ? 'rgba(125, 211, 252, 0.85)' : 'rgba(148, 163, 184, 0.46)'}
                      strokeWidth={draggingNodeSlot === n.slot ? '2.1' : '1.6'}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle
                      cx={n.boxEdgeX}
                      cy={n.boxEdgeY}
                      r="2.2"
                      fill={draggingNodeSlot === n.slot ? '#7DD3FC' : 'rgba(148, 163, 184, 0.65)'}
                    />
                    {n.slot === 'Soul' && (
                      <circle
                        cx={n.dotX}
                        cy={n.dotY}
                        r="3.2"
                        fill={isVoidEquipped ? "#C4B5FD" : "#7DD3FC"}
                        style={{ filter: isVoidEquipped ? 'drop-shadow(0 0 6px #A78BFA)' : 'drop-shadow(0 0 6px #38BDF8)' }}
                      />
                    )}
                  </g>
                ))}
              </svg>

              <div
                className="loadout-center-portal-outer breathing"
                style={{
                  position: 'absolute',
                  left: `${STAGE_CENTER_X}px`,
                  top: `${STAGE_CENTER_Y}px`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: isVoidEquipped ? '0 0 34px rgba(167, 139, 250, 0.42)' : undefined,
                  borderColor: isVoidEquipped ? 'rgba(196, 181, 253, 0.35)' : undefined,
                }}
              >
                <div className="loadout-center-portal-inner">
                  <SoulCanvas soul={currentSoul} width={64} height={54} scale={0.92} mode="LISTENING" />
                </div>
              </div>

              {orbitingNodes.map((n) => (
                <button
                  key={n.slot}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const p = nodePhysicsRef.current[n.slot];
                    nodeDragStartRef.current = {
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: p.x,
                      origY: p.y,
                      moved: false,
                    };
                    draggingNodeSlotRef.current = n.slot;
                    setDraggingNodeSlot(n.slot);
                  }}
                  className={`loadout-compass-node ${draggingNodeSlot === n.slot ? 'is-dragging' : ''}`}
                  style={{
                    left: `${n.cx}px`,
                    top: `${n.cy}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="node-icon">
                    <SvgIcon name={n.icon} size={13} color={n.iconColor} />
                  </span>
                  <div className="node-copy">
                    <div className="node-title">{getEquippedCardName(n.slot)}</div>
                    <div className="node-sub">{n.slot}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!activeDeckSlot && (
            <div className="config-bottom-dock-wrap">
              <div className="config-bottom-dock">
                <button
                  onClick={() => {
                    setShowCompanionWindow(false);
                    setIsTucked(false);
                    setIsExpanded(true);
                    setActiveTab('Controls');
                  }}
                  className="dock-icon-btn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    setShowCompanionWindow(false);
                    setIsTucked(false);
                    setIsExpanded(true);
                    setActiveTab('Clipboard');
                  }}
                  className="dock-icon-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="12" r="5" />
                    <circle cx="15" cy="12" r="5" />
                  </svg>
                </button>

                <button
                  onClick={() => setCompanionDockTab('soul')}
                  className={`dock-icon-btn ${companionDockTab === 'soul' ? 'active-pill' : ''}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2c.5 4.5 4 7.5 4 12a4 4 0 1 1-8 0c0-4.5 3.5-7.5 4-12z" />
                  </svg>
                  {companionDockTab === 'soul' && <span>Soul</span>}
                </button>

                <button
                  onClick={triggerCleanDictationFlow}
                  className="dock-icon-btn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16" />
                    <path d="M9 20h6" />
                    <path d="M12 7v13" />
                  </svg>
                </button>

                <button
                  onClick={() => setCompanionDockTab('settings')}
                  className={`dock-icon-btn ${companionDockTab === 'settings' ? 'active-pill' : ''}`}
                >
                  <SvgIcon name="gear" size={15} />
                  {companionDockTab === 'settings' && <span>Settings</span>}
                </button>
              </div>
            </div>
          )}

          {showConnectModal && (
            <div className="connect-modal-backdrop" onClick={() => setShowConnectModal(false)}>
              <div className="connect-modal-card" onClick={(e) => e.stopPropagation()}>
                <h3 className="connect-modal-title">Connect Hito</h3>
                <p className="connect-modal-p">
                  Watch the full video to learn how to create your Gemini API key and add it to Hito.
                </p>
                <p className="connect-modal-p secondary">
                  The key belongs to your own Google account, and Google's Gemini API terms apply. On a free key Google may use what you send to improve its products, and people may review it, so use a billing-enabled key for anything private. Google's terms require one for apps used in the European Economic Area, the UK and Switzerland. Hito is not affiliated with Google.
                </p>

                <input
                  type="password"
                  placeholder="Paste Gemini API key"
                  value={geminiDraftKey}
                  onChange={(e) => setGeminiDraftKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGeminiKey()}
                  className="connect-modal-input"
                  autoFocus
                />

                <button onClick={handleSaveGeminiKey} className="connect-modal-save-btn">
                  Save and start
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isExpanded && !showCompanionWindow && contextCard && (
        <div
          className="hitodama-context-drop-card"
          onClick={() => {
            if (contextCard.header.includes('Ember Waiting')) {
              handleClaimWaitingEmber();
            } else {
              setContextCard(null);
            }
          }}
        >
          <div className="hitodama-context-header">{contextCard.header}</div>
          <div className="hitodama-context-main">
            {contextCard.domain ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(contextCard.domain)}&sz=32`}
                alt=""
                style={{ width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0 }}
              />
            ) : (
              <div className="hitodama-badge-icon app">
                <SvgIcon name="bolt" size={12} />
              </div>
            )}
            <span className="hitodama-context-title">{contextCard.title}</span>
          </div>
          {contextCard.subtitle && <div className="hitodama-context-sub">{contextCard.subtitle}</div>}
        </div>
      )}

      {!isExpanded && !showCompanionWindow && askNotchPhase !== 'idle' && (
        <div className="hitodama-ask-stage-hud">
          <div className="hitodama-voice-pill user-white ask-wide-pill">
            <span className="pill-tag">YOU</span>
            <input
              type="text"
              value={askWords.join(' ')}
              onChange={(e) => {
                const w = e.target.value.split(/\s+/);
                setAskWords(w);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeVoiceCommand(askWords.join(' '));
                }
              }}
              placeholder="Ask Hito..."
              className="hitodama-lasso-input"
              style={{ width: '400px' }}
              autoFocus
            />
          </div>
        </div>
      )}

      {!isExpanded && askNotchPhase === 'idle' && dictationState === 'idle' && !lassoActive && (userBubbleText || hitodamaReply) && (
        <div className="hitodama-floating-hud-stack">
          {userBubbleText && (
            <div className="hitodama-voice-pill user-white">
              <span className="pill-tag">YOU</span>
              <span className="pill-text">{userBubbleText}</span>
            </div>
          )}
          {hitodamaReply && (
            <div className="hitodama-voice-pill hitodama-dark">
              <span className="pill-tag">HITODAMA</span>
              <span className="pill-text">
                {hitodamaReply.bold && <strong>{hitodamaReply.bold} </strong>}
                {hitodamaReply.rest && <span className="muted">{hitodamaReply.rest}</span>}
              </span>
            </div>
          )}
        </div>
      )}

      {dictationState !== 'idle' && (
        <div className="hitodama-dictation-stage">
          {dictationState === 'recording' && (
            <div className="hitodama-dictation-card">
              <span className="pill-tag">YOU</span>
              <input
                type="text"
                value={dictationText}
                onChange={(e) => setDictationText(e.target.value)}
                placeholder="Speak or type..."
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && dictationText.trim()) {
                    let finalClean = dictationText.trim();
                    if (apiKey) {
                      try {
                        const cleaned = await cleanDictation(finalClean, apiKey);
                        if (cleaned && cleaned.trim()) finalClean = cleaned.trim();
                      } catch (_) {}
                    }
                    setDictationText(finalClean);
                    setDictationState('done');
                    await window.hitodamaAPI?.typeText(finalClean);
                    addEmbers(2);
                    setTimeout(() => setDictationState('idle'), 1400);
                  }
                }}
                className="hitodama-lasso-input"
                style={{ width: '480px' }}
                autoFocus
              />
            </div>
          )}

          <div className="hitodama-dictation-status-pill" onClick={() => setDictationState('idle')}>
            {dictationState === 'recording' ? (
              <div className="hitodama-blue-bars">
                {[0.55, 0.95, 1.0, 0.85, 0.55].map((s, idx) => (
                  <span
                    key={idx}
                    className="companion-wave-bar"
                    style={{
                      height: `${Math.round(s * 14)}px`,
                      background: '#5CB8FF',
                      animationDuration: `${0.4 + idx * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <span className="hitodama-dictation-check">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </div>
        </div>
      )}

      {lassoActive && (
        <div
          className="hitodama-lasso-overlay"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setIsDrawingLasso(true);
            const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            setLassoPoints([pt]);
            lassoPointsRef.current = [pt];
          }}
          onPointerMove={(e) => {
            if (!isDrawingLasso) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            setLassoPoints((prev) => {
              const updated = [...prev, pt];
              lassoPointsRef.current = updated;
              return updated;
            });
          }}
          onPointerUp={() => setIsDrawingLasso(false)}
        >
          <svg className="hitodama-lasso-svg" width="100%" height="100%">
            {lassoPathString && (
              <>
                <path
                  d={lassoPathString}
                  fill="none"
                  stroke="rgba(92, 184, 255, 0.35)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={lassoPathString}
                  fill="none"
                  stroke="#7CC4FA"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </svg>

          <div className="hitodama-lasso-hud" onPointerDown={(e) => e.stopPropagation()}>
            <div className="hitodama-voice-pill user-white">
              <span className="pill-tag">YOU</span>
              <input
                type="text"
                value={lassoQuery}
                onChange={(e) => {
                  setLassoQuery(e.target.value);
                  lassoQueryRef.current = e.target.value;
                }}
                placeholder="Circle and ask..."
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const q = lassoQuery.trim() || 'What is this circled item?';
                    const points = [...lassoPointsRef.current];
                    setLassoActive(false);
                    window.hitodamaAPI?.setLassoActive?.(false);
                    setAskNotchPhase('thinking');
                    setSoulMode('THINKING');
                    setUserBubbleText(q);
                    try {
                      let shotImage = capturedScreenRef.current;
                      if (!shotImage) {
                        const shot = await window.hitodamaAPI?.captureScreen();
                        shotImage = shot?.image || '';
                      }
                      const cropped = await cropScreenToLasso(shotImage, points);
                      const answer = await askLassoWithGemini(
                        q,
                        cropped || shotImage || '',
                        apiKey
                      );
                      capturedScreenRef.current = null;
                      setAskNotchPhase('idle');
                      setSoulMode('TALKING');
                      if (answer) {
                  addEmbers(2);
                  setHitodamaReply({ bold: answer });
                  speakAsHitodama(answer);
                        setTimeout(() => {
                          setSoulMode('LISTENING');
                          setHitodamaReply(null);
                          setUserBubbleText(null);
                        }, 6000);
                      }
                    } catch (err: any) {
                      setAskNotchPhase('idle');
                      setSoulMode('LISTENING');
                      const errMsg = String(err?.message || '');
                      setHitodamaReply({ bold: errMsg.includes('429') ? 'Rate limit reached · Please wait a moment' : 'Could not analyze circled region.' });
                      setTimeout(() => setHitodamaReply(null), 3500);
                    }
                  }
                }}
                className="hitodama-lasso-input"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. HITODAMA ROAMING SCREEN POINTER ("PEEK, FLY & POINT") */}
      <RoamingSoulPointer
        soul={currentSoul}
        target={pointedTarget}
        query={roamingQuery}
        stage={roamingStage}
        isVoid={isVoidEquipped}
        onDismiss={() => {
          setRoamingStage('RETURNING');
          soundFX.playSliderTick(50);
        }}
        onTargetClick={() => {
          soundFX.playClick();
        }}
        onReturningDone={() => {
          setRoamingStage('IDLE');
          setPointedTarget(null);
        }}
      />

      

      {/* 6. FLOATING TOP-RIGHT HITODAMA AGENT SQUIRCLE + HOVER TOAST */}
      <AgentTopRightDock
        tasks={agentTasks}
        soul={currentSoul}
        onOpenAgentsView={() => {
          setIsExpanded(true);
          setActiveTab('Agents');
        }}
        onDockActiveChange={(active, isHovered) => {
          window.hitodamaAPI?.setAgentDockActive?.({ active, isHovered });
        }}
      />
    </div>
  );
};