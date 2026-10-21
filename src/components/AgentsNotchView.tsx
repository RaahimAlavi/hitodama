// src/components/AgentsNotchView.tsx
import React, { useState, useEffect } from 'react';
import {
  AgentTask,
  InspirationItem,
  multitaskAgent,
} from '../lib/multitaskAgent';

interface AgentsNotchViewProps {
  tasks: AgentTask[];
  onOpenGeneratedPage?: (html: string, filePath?: string) => void;
}

export const AgentsNotchView: React.FC<AgentsNotchViewProps> = ({
  tasks,
  onOpenGeneratedPage,
}) => {
  const [viewMode, setViewMode] = useState<'TASKS' | 'INSPO'>('TASKS');
  const [inspirations, setInspirations] = useState<InspirationItem[]>([]);

  useEffect(() => {
    return multitaskAgent.subscribeInspirations((items) => {
      setInspirations(items);
    });
  }, []);

  const runningTasks = tasks.filter(
    (t) => t.status === 'RUNNING' || t.status === 'WAITING'
  );
  const completedTasks = tasks.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'FAILED'
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '6px',
        paddingBottom: '24px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Row: RUNNING header + optional Inspo DB toggle if inspirations exist */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div className="companion-section-header" style={{ margin: 0 }}>
          {viewMode === 'TASKS' ? 'RUNNING' : `INSPIRATION DB (${inspirations.length})`}
        </div>
        {inspirations.length > 0 && (
          <button
            onClick={() => setViewMode((v) => (v === 'TASKS' ? 'INSPO' : 'TASKS'))}
            className="companion-sort-link"
          >
            {viewMode === 'TASKS' ? `Inspo DB (${inspirations.length})` : 'Back to Tasks'}
          </button>
        )}
      </div>

      {viewMode === 'TASKS' ? (
        <>
          {/* RUNNING STATUS BAR OR ACTIVE WORKER CARDS */}
          {runningTasks.length === 0 ? (
            <div
              style={{
                background: '#141518',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#52525B',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#A1A1AA' }}>
                  All agent workers idle
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#71717A' }}>
                Ask Hito to build, clone, or research
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {runningTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    background: 'linear-gradient(180deg, rgba(14, 58, 92, 0.55) 0%, rgba(12, 24, 42, 0.85) 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    minWidth: 0,
                    overflow: 'hidden',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="companion-truncate" style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', minWidth: 0 }}>
                      {task.prompt}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          color: '#38BDF8',
                          background: 'rgba(56, 189, 248, 0.16)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        {task.status}
                      </span>
                      <button
                        onClick={() => multitaskAgent.removeTask(task.id)}
                        className="companion-icon-btn"
                        style={{ width: '20px', height: '20px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#BAE6FD' }}>{task.stepText}</div>
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      marginTop: '2px',
                    }}
                  >
                    <div
                      style={{
                        width: `${task.progress}%`,
                        height: '100%',
                        background: '#38BDF8',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TODAY COMPLETED SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, width: '100%' }}>
            <div className="companion-section-header" style={{ margin: 0 }}>
              TODAY {completedTasks.length > 0 ? `(${completedTasks.length})` : ''}
            </div>

            {completedTasks.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  background: '#141518',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#71717A',
                  fontSize: '12px',
                  fontWeight: 600,
                  minHeight: '120px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                Nothing yet
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: 'linear-gradient(180deg, rgba(12, 42, 68, 0.45) 0%, rgba(10, 22, 38, 0.75) 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.24)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '132px',
                      minWidth: 0,
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ minWidth: 0, overflow: 'hidden', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em' }}>
                          {task.kind === 'BUILD_PAGE' || task.kind === 'CLONE_PAGE' || task.kind === 'EDIT_PAGE'
                            ? 'WEBPAGE ARTIFACT'
                            : task.kind === 'SAVE_INSPO'
                            ? 'INSPIRATION SAVED'
                            : 'AGENT TASK'}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: '#34D399',
                            background: 'rgba(16, 185, 129, 0.16)',
                            padding: '2px 7px',
                            borderRadius: '999px',
                            flexShrink: 0,
                          }}
                        >
                          DONE
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                        }}
                        title={task.prompt}
                      >
                        {task.prompt}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#94A3B8',
                          marginTop: '4px',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.resultText || task.stepText}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                      {task.generatedHtml ? (
                        <button
                          onClick={() => {
                            if (onOpenGeneratedPage) {
                              onOpenGeneratedPage(task.generatedHtml!, task.artifactFile);
                            } else if (typeof window !== 'undefined' && (window as any).hitodamaAPI?.openGeneratedPage) {
                              (window as any).hitodamaAPI.openGeneratedPage(task.generatedHtml!, task.artifactFile);
                            } else {
                              const blob = new Blob([task.generatedHtml!], { type: 'text/html' });
                              window.open(URL.createObjectURL(blob), '_blank');
                            }
                          }}
                          className="companion-primary-btn"
                          style={{ padding: '4px 11px', fontSize: '11px' }}
                        >
                          Open in Browser
                        </button>
                      ) : (
                        <button
                          onClick={() => navigator.clipboard?.writeText(task.resultText || task.stepText)}
                          className="companion-secondary-btn"
                          style={{ padding: '4px 11px', fontSize: '11px' }}
                        >
                          Copy Result
                        </button>
                      )}

                      <button
                        onClick={() => multitaskAgent.removeTask(task.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748B',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* INSPIRATION DB GRID */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
          {inspirations.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#141518',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
                minWidth: 0,
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                {item.screenshot && (
                  <div
                    style={{
                      width: '72px',
                      height: '48px',
                      borderRadius: '6px',
                      backgroundImage: `url(${item.screenshot})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="companion-truncate" style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#38BDF8', marginTop: '2px' }}>
                    {item.archetype}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                    {item.colors.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          width: '11px',
                          height: '11px',
                          borderRadius: '3px',
                          background: c,
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    multitaskAgent.spawnTask(`Replicate the layout of ${item.title}`, undefined, {
                      kind: 'CLONE_PAGE',
                      screenshot: item.screenshot,
                    });
                    setViewMode('TASKS');
                  }}
                  className="companion-primary-btn"
                  style={{ padding: '4px 10px', fontSize: '10.5px' }}
                >
                  Replicate Layout
                </button>
                <button
                  onClick={() => multitaskAgent.deleteInspiration(item.id)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '11px' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
