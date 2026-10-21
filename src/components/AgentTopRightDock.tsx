// src/components/AgentTopRightDock.tsx
// Floating Top-Right Hito Agent Squircle & Choice Popover
// 100% SVG Vector Graphics · Zero Emojis · Matches Hitodama Notch Hierarchy

import React, { useState } from 'react';
import { AgentTask, multitaskAgent } from '../lib/multitaskAgent';
import { SOUL_SKINS, SoulConfig } from '../lib/soulMath';
import { SoulCanvas } from './SoulCanvas';
import { soundFX } from '../lib/soundFX';

interface AgentTopRightDockProps {
  tasks: AgentTask[];
  soul?: SoulConfig;
  onOpenAgentsView: () => void;
  onDockActiveChange?: (active: boolean, isHovered: boolean) => void;
}

export const AgentTopRightDock: React.FC<AgentTopRightDockProps> = ({
  tasks,
  soul,
  onOpenAgentsView,
  onDockActiveChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Show active running/waiting task, or recent completed task if not dismissed
  const activeTask =
    tasks.find(
      (t) =>
        (t.status === 'RUNNING' || t.status === 'WAITING') &&
        !dismissedTaskIds.has(t.id)
    ) ||
    tasks.find(
      (t) =>
        t.status === 'COMPLETED' &&
        Date.now() - t.createdAt < 300000 &&
        !dismissedTaskIds.has(t.id)
    );

  const isDockVisible = Boolean(activeTask);

  React.useEffect(() => {
    onDockActiveChange?.(isDockVisible, isHovered);
  }, [isDockVisible, isHovered, onDockActiveChange]);

  if (!activeTask) return null;

  const isCompleted = activeTask.status === 'COMPLETED';
  const activeSoul = soul || SOUL_SKINS[0];
  const accentColor = isCompleted ? '#10B981' : '#00E5FF';
  const glowColor = isCompleted ? 'rgba(16, 185, 129, 0.35)' : 'rgba(0, 229, 255, 0.28)';

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedTaskIds((prev) => new Set([...prev, activeTask.id]));
    setIsHovered(false);
    onDockActiveChange?.(false, false);
    if (activeTask.status === 'RUNNING' || activeTask.status === 'WAITING') {
      multitaskAgent.removeTask(activeTask.id);
    }
    soundFX.playCollapse();
  };

  const handleOpenInBrowser = async (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playSuccessChime();
    if (activeTask.generatedHtml && typeof window !== 'undefined' && (window as any).hitodamaAPI?.openGeneratedPage) {
      await (window as any).hitodamaAPI.openGeneratedPage(activeTask.generatedHtml);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const content = activeTask.generatedHtml || activeTask.resultText || activeTask.stepText;
    if (content && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        soundFX.playSuccessChime();
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {}
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: '68px',
        right: '28px',
        zIndex: 9999,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: !isHovered ? 'hitodamaSlowFloat 3.2s ease-in-out infinite' : 'none',
      }}
    >
      {!isHovered ? (
        // Collapsed Squircle: 52x52 with Rich Luminous Soul & Status Dot
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(11, 13, 18, 0.94)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.45)' : 'rgba(0, 168, 204, 0.35)'}`,
            boxShadow: `0 12px 32px rgba(0, 0, 0, 0.7), 0 0 20px ${glowColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <SoulCanvas
            soul={activeSoul}
            width={44}
            height={44}
            scale={1.0}
            mode={isCompleted ? 'TALKING' : 'THINKING'}
            interactive={false}
          />

          {/* Glowing Status Dot at Corner */}
          <span
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 10px ${accentColor}`,
              animation: !isCompleted ? 'agentPulseDot 1.4s ease-in-out infinite' : 'none',
            }}
          />
        </div>
      ) : (
        // Expanded Choice Card: Matches Hitodama Notch UI Hierarchy
        <div
          style={{
            width: '340px',
            background: 'rgba(11, 13, 18, 0.96)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 168, 204, 0.32)'}`,
            boxShadow: `0 20px 48px rgba(0, 0, 0, 0.8), 0 0 24px ${glowColor}`,
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'dockToastExpand 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header Row: Soul + Title + Status Badge + Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <SoulCanvas
                  soul={activeSoul}
                  width={28}
                  height={28}
                  scale={1.0}
                  mode={isCompleted ? 'TALKING' : 'THINKING'}
                  interactive={false}
                />
              </div>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                }}
              >
                Hito Agent
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.18)' : 'rgba(0, 200, 225, 0.18)',
                  color: accentColor,
                  border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.35)' : 'rgba(0, 200, 225, 0.35)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: accentColor,
                    boxShadow: `0 0 4px ${accentColor}`,
                  }}
                />
                {isCompleted ? 'Done' : 'RUNNING'}
              </span>

              <button
                onClick={handleDismiss}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                title={isCompleted ? 'Dismiss' : 'Cancel Task'}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Task Title */}
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#FFFFFF',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {activeTask.prompt}
          </div>

          {/* Body: Running Progress vs Completed Outcome */}
          {!isCompleted ? (
            <>
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'rgba(255, 255, 255, 0.72)',
                  lineHeight: 1.35,
                }}
              >
                {activeTask.stepText}
              </div>

              {/* Glowing Horizontal Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginTop: '2px',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(8, activeTask.progress)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0EA5E9 0%, #38BDF8 50%, #BAE6FD 100%)',
                    borderRadius: '999px',
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)',
                    transition: 'width 0.22s linear',
                  }}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: '11.5px',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.4,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '8px 10px',
              }}
            >
              {activeTask.resultText || 'Task completed successfully.'}
            </div>
          )}

          {/* Choice Action Menu ("just let me choose") */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
            {activeTask.generatedHtml && (
              <button
                onClick={handleOpenInBrowser}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(16, 185, 129, 0.42)',
                  color: '#6EE7B7',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.16)')}
              >
                <span>Open Website</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            )}

            {(activeTask.generatedHtml || activeTask.resultText) && (
              <button
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: copied ? '#10B981' : 'rgba(255, 255, 255, 0.85)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAgentsView();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 14px',
                borderRadius: '9999px',
                background: 'rgba(14, 165, 233, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(14, 165, 233, 0.22)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(14, 165, 233, 0.14)')}
            >
              <span>View in Agents</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
