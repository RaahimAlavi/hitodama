// src/components/HitodamaOnboardingExperience.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { SoulConfig } from '../lib/soulMath';
import { SoulCanvas } from './SoulCanvas';
import { soundFX } from '../lib/soundFX';

export interface HitodamaOnboardingExperienceProps {
  soul: SoulConfig;
  customShortcuts: { ask: string; circle: string; dictate: string };
  lastTriggeredHotkey?: string | null;
  liveSpeechText?: string;
  isIslandExpanded?: boolean;
  geminiDraftKey: string;
  tavilyDraftKey: string;
  onChangeGeminiKey: (val: string) => void;
  onChangeTavilyKey: (val: string) => void;
  onAwardEmbers: (amount: number) => void;
  onSpeak: (text: string) => void;
  onPreviewExpandIsland: (expand: boolean) => void;
  onComplete: () => void;
}

export type ExperienceAct =
  | 'SLEEPING'
  | 'AWAKENING'
  | 'QUEST_SCROLL'
  | 'QUEST_ASK_KEY'
  | 'QUEST_LASSO'
  | 'QUEST_DICTATE'
  | 'QUEST_KEYS'
  | 'ASCENDING';

export const HitodamaOnboardingExperience: React.FC<HitodamaOnboardingExperienceProps> = ({
  soul,
  customShortcuts,
  lastTriggeredHotkey,
  liveSpeechText = '',
  isIslandExpanded = false,
  geminiDraftKey,
  tavilyDraftKey,
  onChangeGeminiKey,
  onChangeTavilyKey,
  onAwardEmbers,
  onSpeak,
  onPreviewExpandIsland,
  onComplete,
}) => {
  const [act, setAct] = useState<ExperienceAct>('SLEEPING');
  const [soulMode, setSoulMode] = useState<'MUTED' | 'YAWNING' | 'TALKING' | 'LISTENING' | 'THINKING'>('MUTED');
  const [soulExpr, setSoulExpr] = useState<'NORMAL' | 'PEEKING' | 'EXCITED' | 'HAPPY' | 'YAWNING'>('NORMAL');
  const [dialogueTitle, setDialogueTitle] = useState<string>('A Soul Slumbers in Your Bezel...');
  const [dialogueSub, setDialogueSub] = useState<string>('Click the sleeping spirit or press Space to wake Hitodama.');
  const [emberToast, setEmberToast] = useState<string | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [questCompletedFlash, setQuestCompletedFlash] = useState<boolean>(false);

  // Quest tracking states so the user is never rushed or skipped
  const [islandOpened, setIslandOpened] = useState<boolean>(false);
  const [voiceHeard, setVoiceHeard] = useState<string | null>(null);
  const [lassoDone, setLassoDone] = useState<boolean>(false);
  const [dictateHeard, setDictateHeard] = useState<string | null>(null);

  // Mini Lasso Orb interactive state during QUEST_LASSO
  const [lassoTrail, setLassoTrail] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawingDemoLasso, setIsDrawingDemoLasso] = useState<boolean>(false);

  const soulStageRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const actLockRef = useRef<boolean>(false);

  const flySoulTo = useCallback((xVw: number, yVh: number, scale = 1, duration = 0.75) => {
    if (!soulStageRef.current) return;
    const targetX = (window.innerWidth * xVw) / 100;
    const targetY = (window.innerHeight * yVh) / 100;
    gsap.to(soulStageRef.current, {
      left: `${targetX}px`,
      top: `${targetY}px`,
      scale,
      duration,
      ease: 'power3.inOut',
    });
  }, []);

  const flashEmberReward = useCallback(
    (amount: number) => {
      soundFX.playQuestComplete();
      onAwardEmbers(amount);
      setEmberToast(`+${amount} Embers`);
      setQuestCompletedFlash(true);
      setSoulExpr('HAPPY');
      setTimeout(() => setQuestCompletedFlash(false), 750);
      setTimeout(() => setEmberToast(null), 1800);
    },
    [onAwardEmbers]
  );

  // Position Hitodama near top bezel on initial mount
  useEffect(() => {
    if (soulStageRef.current) {
      gsap.set(soulStageRef.current, {
        left: `${window.innerWidth / 2}px`,
        top: '120px',
        scale: 0.9,
      });
    }
  }, []);

  // Animate dialogue text whenever it changes
  useEffect(() => {
    if (!subtitleRef.current) return;
    gsap.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }
    );
  }, [dialogueTitle, dialogueSub]);

  // Sync external Dynamic Island expansion during QUEST_SCROLL
  useEffect(() => {
    if (act === 'QUEST_SCROLL' && isIslandExpanded && !islandOpened) {
      setIslandOpened(true);
      flashEmberReward(10);
      setDialogueTitle('Dynamic Island Opened!');
      setDialogueSub('There it is! All 8 tabs are one flick away.');
      onSpeak('Look up top! All eight of your tabs are one flick away.');
    }
  }, [act, isIslandExpanded, islandOpened, flashEmberReward, onSpeak]);

  // Sync real-time spoken text during QUEST_ASK_KEY
  useEffect(() => {
    if (act === 'QUEST_ASK_KEY' && liveSpeechText.trim() && !voiceHeard) {
      const heard = liveSpeechText.trim();
      setVoiceHeard(heard);
      flashEmberReward(10);
      setSoulMode('TALKING');
      setSoulExpr('HAPPY');
      setDialogueTitle('Voice Command Detected!');
      setDialogueSub(`Heard: "${heard}" — Hitodama can answer, search YouTube, or control apps!`);
      onSpeak(`Searching for "${heard}"! That's how easy it is to summon my voice.`);
    }
  }, [act, liveSpeechText, voiceHeard, flashEmberReward, onSpeak]);

  // ==========================================================================
  // ACT TRANSITIONS WITH PATIENT, COMPLETE VOICE NARRATION (NO AUTO-SKIPPING)
  // ==========================================================================

  const advanceToScrollQuest = useCallback(() => {
    actLockRef.current = false;
    setAct('QUEST_SCROLL');
    setSoulMode('TALKING');
    setSoulExpr('PEEKING');
    flySoulTo(50, 22, 0.95, 0.7);
    const line = 'Scroll your mouse wheel down on the top bezel right now to flick open your Dynamic Island.';
    setDialogueTitle('Quest 1 · Flick Open the Island');
    setDialogueSub('Scroll down on the top notch, or press Down Arrow to inspect your 8 tabs.');
    onSpeak(line);
  }, [flySoulTo, onSpeak]);

  const advanceToAskKeyQuest = useCallback(() => {
    actLockRef.current = false;
    onPreviewExpandIsland(false);
    setAct('QUEST_ASK_KEY');
    setSoulMode('TALKING');
    setSoulExpr('NORMAL');
    flySoulTo(50, 30, 1.05, 0.75);
    const line = `Hold ${customShortcuts.ask} on your keyboard and say: 'Search how to cook spaghetti on youtube'.`;
    setDialogueTitle(`Quest 2 · Voice Summon (${customShortcuts.ask})`);
    setDialogueSub(`Hold your shortcut, say the phrase below, and Hitodama will instantly wake up.`);
    onSpeak(line);
  }, [customShortcuts.ask, flySoulTo, onPreviewExpandIsland, onSpeak]);

  const advanceToLassoQuest = useCallback(() => {
    actLockRef.current = false;
    setAct('QUEST_LASSO');
    setSoulMode('TALKING');
    setSoulExpr('EXCITED');
    flySoulTo(64, 32, 1.0, 0.75);
    const line = `Hold ${customShortcuts.circle} or drag a circle around the glowing orb on the left.`;
    setDialogueTitle('Quest 3 · Circle Anything on Screen');
    setDialogueSub(`Hold ${customShortcuts.circle} or draw a loop around any error, image, or text.`);
    onSpeak(line);
  }, [customShortcuts.circle, flySoulTo, onSpeak]);

  const advanceToDictateQuest = useCallback(() => {
    actLockRef.current = false;
    setAct('QUEST_DICTATE');
    setSoulMode('TALKING');
    setSoulExpr('NORMAL');
    flySoulTo(50, 30, 1.05, 0.75);
    const line = `Last power! Hold ${customShortcuts.dictate} to test Clean Dictation in any document or chat.`;
    setDialogueTitle(`Quest 4 · Clean Dictation (${customShortcuts.dictate})`);
    setDialogueSub('Talk messy in any app—Hitodama removes filler words and types clean prose.');
    onSpeak(line);
  }, [customShortcuts.dictate, flySoulTo, onSpeak]);

  const advanceToKeysStage = useCallback(() => {
    actLockRef.current = false;
    setAct('QUEST_KEYS');
    setSoulMode('TALKING');
    setSoulExpr('HAPPY');
    flySoulTo(50, 24, 0.98, 0.7);
    const line = 'Awesome job! Connect your free Gemini and Tavily keys below so my mind is fully powered.';
    setDialogueTitle('Final Step · Link Your AI Keys');
    setDialogueSub(line);
    onSpeak(line);
  }, [flySoulTo, onSpeak]);

  const finishAndAscendToNotch = useCallback(() => {
    if (actLockRef.current) return;
    actLockRef.current = true;
    flashEmberReward(20);
    setAct('ASCENDING');
    setSoulMode('TALKING');
    setSoulExpr('HAPPY');
    const line = "We're bonded! I'll be resting right up in your top bezel whenever you need me.";
    setDialogueTitle('Soul Bond Complete!');
    setDialogueSub(line);
    onSpeak(line);

    if (soulStageRef.current) {
      gsap.to(soulStageRef.current, {
        left: `${window.innerWidth / 2}px`,
        top: '26px',
        scale: 0.35,
        opacity: 0,
        duration: 0.85,
        delay: 1.6,
        ease: 'back.in(1.6)',
        onComplete: () => {
          onComplete();
        },
      });
    } else {
      setTimeout(onComplete, 2000);
    }
  }, [flashEmberReward, onComplete, onSpeak]);

  // Act 0 -> Act 1: Wake Hitodama with a Yawn & Stretch
  const triggerWakeSequence = useCallback(() => {
    if (act !== 'SLEEPING' || actLockRef.current) return;
    actLockRef.current = true;
    setAct('AWAKENING');
    setSoulMode('YAWNING');
    setSoulExpr('YAWNING');
    soundFX.playYawnWake();
    setDialogueTitle('*Yaaawn*... Stretching awake...');
    setDialogueSub('Waking up your desktop companion...');

    // Float down from top bezel to center of screen while stretching
    flySoulTo(50, 32, 1.15, 1.35);

    setTimeout(() => {
      flashEmberReward(5);
      setSoulMode('TALKING');
      setSoulExpr('HAPPY');
      const greeting =
        "Good morning! I'm Hitodama. I float freely above your desktop without blocking your work. Let's try your powers together!";
      setDialogueTitle('"Good morning! I am Hitodama."');
      setDialogueSub(greeting);
      onSpeak(greeting);
      actLockRef.current = false;
    }, 1800);
  }, [act, flashEmberReward, flySoulTo, onSpeak]);

  // Handle hotkey actions coming from Electron OS global shortcuts
  useEffect(() => {
    if (!lastTriggeredHotkey) return;

    if (act === 'QUEST_ASK_KEY' && lastTriggeredHotkey === 'ASK_DOWN' && !voiceHeard) {
      setSoulMode('LISTENING');
      setSoulExpr('EXCITED');
      setDialogueTitle('Listening to your voice...');
      setDialogueSub('Say: "Search how to cook spaghetti on youtube"');
    } else if (act === 'QUEST_LASSO' && lastTriggeredHotkey === 'LASSO_DOWN' && !lassoDone) {
      setIsDrawingDemoLasso(true);
    } else if (act === 'QUEST_DICTATE' && lastTriggeredHotkey === 'DICTATE_DOWN' && !dictateHeard) {
      setSoulMode('LISTENING');
      setSoulExpr('EXCITED');
    }
  }, [lastTriggeredHotkey, act, voiceHeard, lassoDone, dictateHeard]);

  // Test phrases helpers for voice and dictation
  const handleSimulateVoice = (phrase: string) => {
    setVoiceHeard(phrase);
    flashEmberReward(10);
    setSoulMode('TALKING');
    setSoulExpr('HAPPY');
    setDialogueTitle('Voice Command Tested!');
    setDialogueSub(`Heard: "${phrase}" — Hitodama searches YouTube and opens the result!`);
    onSpeak(`Searching YouTube for "${phrase}"! That's how quick it is.`);
  };

  const handleSimulateDictate = (phrase: string) => {
    setDictateHeard(phrase);
    flashEmberReward(10);
    setSoulMode('TALKING');
    setSoulExpr('HAPPY');
    setDialogueTitle('Clean Dictation Verified!');
    setDialogueSub(`Cleaned: "${phrase}" — Ready to type 5x faster than typing.`);
    onSpeak('Clean Dictation verified! Ready to type five times faster than typing.');
  };

  // Keyboard and Wheel events (No auto-skipping on modifier taps!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      setPressedKeys((prev) => {
        const next = new Set(prev);
        if (e.metaKey || k === 'meta' || k === 'os') next.add('win');
        if (e.altKey || k === 'alt') next.add('alt');
        if (e.ctrlKey || k === 'control') next.add('ctrl');
        if (e.shiftKey || k === 'shift') next.add('shift');
        next.add(k);
        return next;
      });

      if (act === 'SLEEPING' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        triggerWakeSequence();
        return;
      }

      if (act === 'AWAKENING' && !actLockRef.current && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        advanceToScrollQuest();
        return;
      }

      if (act === 'QUEST_SCROLL' && !islandOpened && (e.key === 'ArrowDown' || e.key === 'PageDown')) {
        e.preventDefault();
        onPreviewExpandIsland(true);
        setIslandOpened(true);
        flashEmberReward(10);
        setDialogueTitle('Dynamic Island Opened!');
        setDialogueSub('Look at the top of your screen—all 8 tabs are right here.');
        onSpeak('Look up top! All eight of your tabs are one flick away.');
        return;
      }

      // Drawing lasso when Ctrl+Shift is held during lasso quest
      if (act === 'QUEST_LASSO' && e.ctrlKey && e.shiftKey) {
        setIsDrawingDemoLasso(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      setPressedKeys((prev) => {
        const next = new Set(prev);
        if (!e.metaKey) next.delete('win');
        if (!e.altKey) next.delete('alt');
        if (!e.ctrlKey) next.delete('ctrl');
        if (!e.shiftKey) next.delete('shift');
        next.delete(k);
        return next;
      });
    };

    const handleWheel = (e: WheelEvent) => {
      if (act === 'QUEST_SCROLL' && !islandOpened && e.deltaY > 3) {
        onPreviewExpandIsland(true);
        setIslandOpened(true);
        flashEmberReward(10);
        setDialogueTitle('Dynamic Island Opened!');
        setDialogueSub('Look at the top of your screen—all 8 tabs are right here.');
        onSpeak('Look up top! All eight of your tabs are one flick away.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [
    act,
    islandOpened,
    triggerWakeSequence,
    advanceToScrollQuest,
    flashEmberReward,
    onPreviewExpandIsland,
    onSpeak,
  ]);

  // Parse shortcut tokens so each 3D keycap lights up individually when pressed
  const renderInteractiveKeycaps = (shortcutStr: string) => {
    const tokens = shortcutStr.split('+').map((s) => s.trim());
    return (
      <div className="spatial-keycap-cluster">
        {tokens.map((tok, i) => {
          const lowerTok = tok.toLowerCase();
          const isDown =
            pressedKeys.has(lowerTok) ||
            (lowerTok === 'win' && pressedKeys.has('meta')) ||
            (lowerTok === 'ctrl' && pressedKeys.has('control')) ||
            (lowerTok === 'space' && pressedKeys.has(' '));
          return (
            <React.Fragment key={tok}>
              {i > 0 && <span className="spatial-keycap-plus">+</span>}
              <div className={`spatial-3d-keycap ${isDown || questCompletedFlash ? 'is-pressed' : ''}`}>
                <span>{tok}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const lassoSvgPath =
    lassoTrail.length > 1
      ? lassoTrail.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')
      : '';

  return (
    <div
      className="hitodama-spatial-onboarding-overlay"
      onPointerDown={(e) => {
        if (act === 'QUEST_LASSO') {
          setIsDrawingDemoLasso(true);
          setLassoTrail([{ x: e.clientX, y: e.clientY }]);
        }
      }}
      onPointerMove={(e) => {
        if (act === 'QUEST_LASSO' && isDrawingDemoLasso) {
          setLassoTrail((prev) => {
            const next = [...prev, { x: e.clientX, y: e.clientY }];
            if (next.length > 16 && !lassoDone) {
              setLassoDone(true);
              setIsDrawingDemoLasso(false);
              flashEmberReward(15);
              setSoulMode('TALKING');
              setSoulExpr('EXCITED');
              setDialogueTitle('Target Acquired & Lasso Mastered!');
              setDialogueSub('Any region you circle gets sent straight to Hitodama vision engine.');
              onSpeak('Target acquired! Any region you lasso gets sent straight to my vision.');
            }
            return next;
          });
        }
      }}
      onPointerUp={() => {
        setIsDrawingDemoLasso(false);
      }}
    >
      {/* Top HUD: Progress Pills & Skip */}
      <div className="spatial-onboarding-hud-top">
        <div className="spatial-act-pills">
          {(['SLEEPING', 'AWAKENING', 'QUEST_SCROLL', 'QUEST_ASK_KEY', 'QUEST_LASSO', 'QUEST_DICTATE', 'QUEST_KEYS'] as const).map(
            (s) => (
              <span
                key={s}
                className={`spatial-act-dot ${act === s ? 'active' : ''}`}
              />
            )
          )}
        </div>
        <button onClick={onComplete} className="spatial-skip-pill">
          Skip Experience ✕
        </button>
      </div>

      {/* Upward Pulsing Pointer Arrow during QUEST_SCROLL */}
      {act === 'QUEST_SCROLL' && !islandOpened && (
        <div className="spatial-notch-beacon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5CB8FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          <span>SCROLL DOWN HERE</span>
        </div>
      )}

      {/* Glowing Target Spirit Orb + Laser Trail during QUEST_LASSO */}
      {act === 'QUEST_LASSO' && (
        <>
          <div
            className="spatial-lasso-target-orb"
            onClick={() => {
              if (!lassoDone) {
                setLassoDone(true);
                flashEmberReward(15);
                setSoulMode('TALKING');
                setSoulExpr('EXCITED');
                setDialogueTitle('Target Acquired & Lasso Mastered!');
                setDialogueSub('Any region you circle gets sent straight to Hitodama vision engine.');
                onSpeak('Target acquired! Any region you lasso gets sent straight to my vision.');
              }
            }}
          >
            <div className="orb-dashed-guide" />
            <div className="orb-core" />
            <span className="orb-label">DRAW A CIRCLE AROUND ME</span>
          </div>

          {lassoSvgPath && (
            <svg className="hitodama-lasso-svg" style={{ zIndex: 100 }}>
              <path
                d={lassoSvgPath}
                fill="rgba(92, 184, 255, 0.12)"
                stroke="#5CB8FF"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 12px #5CB8FF)' }}
              />
            </svg>
          )}
        </>
      )}

      {/* FREE-ROAMING HITODAMA SPIRIT STAGE (UNCLIPPED 300x260 CANVAS WITH HEADROOM) */}
      <div
        ref={soulStageRef}
        onClick={act === 'SLEEPING' ? triggerWakeSequence : () => soundFX.playSoulPulse()}
        className={`spatial-free-soul-stage ${questCompletedFlash ? 'quest-flash' : ''}`}
      >
        <div className="spatial-soul-ambient-halo" />
        <SoulCanvas
          soul={soul}
          width={300}
          height={260}
          scale={1.05}
          mode={soulMode}
          expression={soulExpr}
          interactive={true}
        />
        {emberToast && (
          <div key={emberToast} className="spatial-ember-burst-badge">
            {emberToast}
          </div>
        )}
      </div>

      {/* CINEMA DIALOGUE & INTERACTIVE GUIDED PROMPT CARDS */}
      <div ref={subtitleRef} className="spatial-cinema-dialogue-wrap">
        <h1 className="spatial-cinema-title">{dialogueTitle}</h1>
        <p className="spatial-cinema-sub">{dialogueSub}</p>

        {/* QUEST 1: DYNAMIC ISLAND OPEN CONTROLS */}
        {act === 'QUEST_SCROLL' && (
          <div className="spatial-action-row" style={{ gap: '12px' }}>
            {!islandOpened ? (
              <button
                onClick={() => {
                  onPreviewExpandIsland(true);
                  setIslandOpened(true);
                  flashEmberReward(10);
                  setDialogueTitle('Dynamic Island Opened!');
                  setDialogueSub('Look at the top of your screen—all 8 tabs are right here.');
                  onSpeak('Look up top! All eight of your tabs are one flick away.');
                }}
                className="spatial-glow-cta"
              >
                Flick Open Island →
              </button>
            ) : (
              <button onClick={advanceToAskKeyQuest} className="spatial-glow-cta">
                Next Quest: Voice Summon →
              </button>
            )}
          </div>
        )}

        {/* QUEST 2: VOICE SUMMON KEYCAPS & SPEECH PROMPT CARD */}
        {act === 'QUEST_ASK_KEY' && (
          <>
            {renderInteractiveKeycaps(customShortcuts.ask)}
            <div className="spatial-prompt-speech-card">
              <div className="spatial-prompt-pill-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Hold {customShortcuts.ask} & Say:
              </div>
              <div className="spatial-speech-quote">
                "Search how to cook spaghetti on youtube"
              </div>
              {voiceHeard ? (
                <div className="spatial-live-heard-box">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Heard: "{voiceHeard}"
                </div>
              ) : (
                <button
                  className="spatial-prompt-test-btn"
                  onClick={() => handleSimulateVoice("Search how to cook spaghetti on youtube")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Test with this phrase
                </button>
              )}
            </div>

            <div className="spatial-action-row" style={{ marginTop: '12px' }}>
              <button onClick={advanceToLassoQuest} className="spatial-glow-cta">
                {voiceHeard ? 'Next Quest: Circle to Ask →' : 'Next Quest: Circle to Ask →'}
              </button>
            </div>
          </>
        )}

        {/* QUEST 3: CIRCLE TO ASK GUIDANCE */}
        {act === 'QUEST_LASSO' && (
          <div className="spatial-action-row" style={{ marginTop: '14px', gap: '12px' }}>
            {lassoDone ? (
              <button onClick={advanceToDictateQuest} className="spatial-glow-cta">
                Next Quest: Clean Dictation →
              </button>
            ) : (
              <button
                onClick={() => {
                  setLassoDone(true);
                  flashEmberReward(15);
                  setSoulMode('TALKING');
                  setSoulExpr('EXCITED');
                  setDialogueTitle('Target Acquired & Lasso Mastered!');
                  setDialogueSub('Any region you circle gets sent straight to Hitodama vision engine.');
                  onSpeak('Target acquired! Any region you lasso gets sent straight to my vision.');
                }}
                className="spatial-glow-cta"
              >
                Complete Lasso Quest →
              </button>
            )}
          </div>
        )}

        {/* QUEST 4: CLEAN DICTATION PROMPT CARD */}
        {act === 'QUEST_DICTATE' && (
          <>
            {renderInteractiveKeycaps(customShortcuts.dictate)}
            <div className="spatial-prompt-speech-card">
              <div className="spatial-prompt-pill-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Hold {customShortcuts.dictate} & Dictate:
              </div>
              <div className="spatial-speech-quote">
                "Send the project report to the team by 3pm please"
              </div>
              {dictateHeard ? (
                <div className="spatial-live-heard-box">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Heard: "{dictateHeard}"
                </div>
              ) : (
                <button
                  className="spatial-prompt-test-btn"
                  onClick={() => handleSimulateDictate("Send the project report to the team by 3pm please")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Test Clean Dictation
                </button>
              )}
            </div>

            <div className="spatial-action-row" style={{ marginTop: '12px' }}>
              <button onClick={advanceToKeysStage} className="spatial-glow-cta">
                Final Step: Link AI Keys →
              </button>
            </div>
          </>
        )}

        {/* QUEST 5: AI API KEYS CONNECT */}
        {act === 'QUEST_KEYS' && (
          <div className="spatial-action-row" style={{ flexDirection: 'column', gap: '12px' }}>
            <div className="spatial-keys-floating-bar">
              <input
                type="password"
                placeholder="Paste Gemini API Key..."
                value={geminiDraftKey}
                onChange={(e) => onChangeGeminiKey(e.target.value)}
                className="spatial-key-pill-input"
              />
              <input
                type="password"
                placeholder="Paste Tavily Key (Optional)..."
                value={tavilyDraftKey}
                onChange={(e) => onChangeTavilyKey(e.target.value)}
                className="spatial-key-pill-input"
              />
              <button onClick={finishAndAscendToNotch} className="spatial-glow-cta">
                Bond Soul (+20 Embers) →
              </button>
            </div>
          </div>
        )}

        {/* WAKE BUTTONS */}
        {act === 'SLEEPING' && (
          <div className="spatial-action-row">
            <button onClick={triggerWakeSequence} className="spatial-glow-cta">
              Wake Hitodama (Space)
            </button>
          </div>
        )}

        {act === 'AWAKENING' && (
          <div className="spatial-action-row">
            <button onClick={advanceToScrollQuest} className="spatial-glow-cta">
              Begin Interactive Tour →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
