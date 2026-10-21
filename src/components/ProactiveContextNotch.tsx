// src/components/ProactiveContextNotch.tsx
// Proactive App Detection & Context Suggestion Banner ("Connect to Hito?")
// Hitodama Soul-Link + Authentic App Logos + App-Matched Gradients + Infinite Marquee

import React from 'react';
import {
  APP_INTEGRATIONS,
  DetectedAppConfig,
  multitaskAgent,
} from '../lib/multitaskAgent';
import { SOUL_SKINS, SoulConfig } from '../lib/soulMath';
import { SoulCanvas } from './SoulCanvas';

interface ProactiveContextNotchProps {
  appId: DetectedAppConfig['id'];
  soul?: SoulConfig;
  isConnected: boolean;
  onConnect: () => void;
  onUnlink?: () => void;
  onDismiss: (mode: 'NO' | 'NOT_NOW') => void;
  onRunSuggestion: (suggestion: string) => void;
}

export const ProactiveContextNotch: React.FC<ProactiveContextNotchProps> = ({
  appId,
  soul,
  isConnected,
  onConnect,
  onUnlink,
  onDismiss,
  onRunSuggestion,
}) => {
  const app = APP_INTEGRATIONS[appId] || APP_INTEGRATIONS.notion;
  const activeSoul = soul || SOUL_SKINS[0];

  // Duplicate suggestions 2x so the CSS marquee loops seamlessly from 0% to -50%
  const marqueeItems = [...app.suggestions, ...app.suggestions];

  const renderAuthenticAppLogo = (id: DetectedAppConfig['id']) => {
    switch (id) {
      case 'notion':
        // Authentic Notion 3D Isometric Cube + Serif 'N' Vector
        return (
          <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
            <path
              d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z"
              fill="#FFFFFF"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z"
              fill="#111115"
            />
          </svg>
        );
      case 'github':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        );
      case 'vscode':
        return (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path
              d="M17.5 2L7.2 11.4L3.2 8.3L1.5 9.2V14.8L3.2 15.7L7.2 12.6L17.5 22L22.5 19.9V4.1L17.5 2ZM17.5 16.5L10.8 12L17.5 7.5V16.5Z"
              fill="#38BDF8"
            />
          </svg>
        );
      case 'figma':
        return (
          <svg width="18" height="18" viewBox="0 0 38 57" fill="none">
            <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE" />
            <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83" />
            <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262" />
            <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E" />
            <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF" />
          </svg>
        );
      case 'gmail':
        return (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M2 6.5V18C2 19.1 2.9 20 4 20H6V9.8L12 14.3L18 9.8V20H20C21.1 20 22 19.1 22 18V6.5C22 4.8 20.1 3.8 18.7 4.8L12 9.8L5.3 4.8C3.9 3.8 2 4.8 2 6.5Z" fill="#EA4335" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        padding: '12px 18px 11px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: `radial-gradient(120% 120% at 50% -20%, ${activeSoul.glow}24 0%, rgba(19, 21, 26, 0.98) 60%), #0D0E12`,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle Ambient Glow Matched to Active Soul */}
      <div
        style={{
          position: 'absolute',
          right: '-20px',
          top: '-20px',
          width: '200px',
          height: '120px',
          background: `radial-gradient(circle, ${activeSoul.glow}22 0%, transparent 70%)`,
          filter: 'blur(24px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* TOP ROW: Hitodama Flame + App Logo + Title + Action Pills */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Left: Dual Squircle Badges (Hitodama + App) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '16px',
              padding: '3px 8px 3px 5px',
              gap: '8px',
              boxShadow: `0 4px 16px rgba(0, 0, 0, 0.5), 0 0 16px ${activeSoul.glow}16`,
              flexShrink: 0,
            }}
          >
            {/* Live Animated Hitodama Spirit - Enlarged & Distinct */}
            <div style={{ width: '38px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SoulCanvas
                soul={activeSoul}
                width={38}
                height={36}
                scale={0.62}
                mode="LISTENING"
                interactive={false}
              />
            </div>

            {/* Target App Logo Tile */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderAuthenticAppLogo(app.id)}
            </div>
          </div>

          {/* Center-Left Hitodama Typography */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {isConnected ? `${app.name} Linked` : `Connect ${app.name} to Hito?`}
              </span>
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#94A3B8',
                fontWeight: 500,
                marginTop: '1px',
                letterSpacing: '0.01em',
              }}
            >
              Use Hito in {app.name} to:
            </div>
          </div>
        </div>

        {/* Right: Hitodama Glass Action Pills (Supports Connect + Connected Status + Unlink) */}
        {!isConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => onDismiss('NO')}
              className="hitodama-context-btn muted"
              style={{
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#CBD5E1',
                cursor: 'pointer',
              }}
            >
              No
            </button>

            <button
              onClick={() => onDismiss('NOT_NOW')}
              className="hitodama-context-btn muted"
              style={{
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#CBD5E1',
                cursor: 'pointer',
              }}
            >
              Later
            </button>

            <button
              onClick={onConnect}
              className="hitodama-context-btn primary"
              style={{
                padding: '5px 13px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '999px',
                background: `linear-gradient(135deg, ${app.accentColor}, #0284C7)`,
                border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: `0 4px 14px ${app.accentColor}44`,
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              Connect
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.38)',
                color: '#6EE7B7',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                }}
              />
              Connected
            </span>

            <button
              onClick={() => {
                if (onUnlink) onUnlink();
                else multitaskAgent.unlinkApp(app.id);
              }}
              className="hitodama-context-btn muted"
              title={`Unlink ${app.name} from Hito`}
              style={{
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#CBD5E1',
                cursor: 'pointer',
              }}
            >
              Unlink
            </button>

            <button
              onClick={() => onDismiss('NOT_NOW')}
              className="hitodama-context-btn muted"
              style={{
                padding: '5px 11px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#CBD5E1',
                cursor: 'pointer',
              }}
            >
              Hide
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM ROW: Continuous Smooth Infinite Marquee Ticker (Pauses on Hover, No Diamond Icons) */}
      <div className="hitodama-marquee-viewport">
        <div className="hitodama-marquee-track">
          {marqueeItems.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!isConnected) multitaskAgent.connectApp(app.id);
                onRunSuggestion(suggestion);
              }}
              className="hitodama-marquee-pill"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#E2E8F0',
              }}
            >
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
