import React, { useState, useEffect, useRef } from 'react';

export const Productivity: React.FC = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [todos, setTodos] = useState([
    { title: 'Subscribe to Otism', done: false },
    { title: 'Call Mom', done: false },
    { title: 'Gym', time: '6:00 PM', done: false },
  ]);

  const dictationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio wave canvas for dictation card
  useEffect(() => {
    const canvas = dictationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      time += 0.08;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bars = 10;
      const bw = 3;
      const gap = 4;
      const startX = (w - (bars * (bw + gap) - gap)) / 2;

      for (let i = 0; i < bars; i++) {
        const x = startX + i * (bw + gap);
        const barH = 4 + Math.abs(Math.sin(time + i * 0.6)) * (h - 8);
        const y = (h - barH) / 2;

        ctx.fillStyle = '#5CB8FF';
        ctx.beginPath();
        ctx.roundRect(x, y, bw, barH, 2);
        ctx.fill();
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const completedCount = todos.filter((t) => t.done).length;
  const progressRatio = completedCount / todos.length;
  const circumference = 2 * Math.PI * 11; // r = 11 => ~69.115

  const toggleTodo = (index: number) => {
    setTodos((prev) =>
      prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <section className="section Productivity_section__IBIQ1" id="productivity" data-reveal="true">
      <div className="Productivity_toolField__HRu_w" data-motion-item="true" data-motion-delay="1">
        <div className="Productivity_copy__ES7z2" data-motion-item="true">
          <h2 className="Productivity_headline__OTtks">
            <span>The Ultimate</span>
            <em>Productivity Tool</em>
          </h2>
          <p className="Productivity_description__yiNx2">
            Hito is a combination of tools built to increase your productivity by up to 10×. It lives on your computer, makes your job easier, simplifies your tasks, and saves you time.
          </p>
        </div>

        <div className="Productivity_toolRow__J4wk9" data-lenis-prevent-touch="true">
          {/* 1. Circle to Ask */}
          <div className="Productivity_circleSearchPosition__9Z8yx">
            <div className="Productivity_cardHitArea__ZAs_V">
              <button
                className="Productivity_toolCard__dJhLx"
                type="button"
                aria-label="Preview the Hito circle to ask tool: hold Ctrl and Shift, circle anything, ask about it"
                data-active={activeCard === 0 ? 'true' : 'false'}
                style={
                  {
                    '--tilt': '3deg',
                    '--lift-tilt': '1deg',
                    '--lift-scale': '1.06',
                    '--card-width': 'clamp(248px, 20vw, 280px)',
                  } as React.CSSProperties
                }
                onMouseEnter={() => setActiveCard(0)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <span className="Productivity_toolHead__SeBoO">
                  <span className="Productivity_toolIcon__vf2Nc">
                    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3.4 8.2V5.1a1.7 1.7 0 0 1 1.7-1.7h3.1M15.8 3.4h3.1a1.7 1.7 0 0 1 1.7 1.7v3.1M20.6 15.8v3.1a1.7 1.7 0 0 1-1.7 1.7h-3.1M8.2 20.6H5.1a1.7 1.7 0 0 1-1.7-1.7v-3.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13.9 8.3c2.1.9 2.9 2.9 1.9 4.5-1.1 1.8-4 2.5-6.3 1.5-2.1-.9-2.9-2.9-1.9-4.5 1.1-1.8 4-2.5 6.3-1.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="Productivity_toolName__t2yhF">CIRCLE TO ASK</span>
                  <span className="Productivity_toolKeys__SkFM1" aria-hidden="true">
                    <span className="Productivity_toolKey__KYKYf"><kbd>Ctrl</kbd></span>
                    <span className="Productivity_toolKey__KYKYf"><i>+</i><kbd>Shift</kbd></span>
                  </span>
                </span>

                <span className="Productivity_searchVisual__Y2fde" data-active="true">
                  <img src="/images/circle-search-tree.png" alt="Circle trace" aria-hidden="true" />
                  <svg className="Productivity_searchLoop__FlFzh" viewBox="0 0 280 180" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      className="Productivity_searchTrace__v42Th"
                      pathLength="1"
                      d="M201 133C225 118 240 89 225 61C206 28 153 20 104 25C57 30 31 56 41 88C51 123 97 146 145 151C168 154 188 147 201 133Z"
                      style={{ strokeDashoffset: activeCard === 0 ? 0 : 0.2, transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                    <path className="Productivity_searchTraceEcho__T0ePv" d="M199 136C224 121 238 91 223 63" />
                  </svg>
                  <span className="Productivity_searchCursor__NMRxk" aria-hidden="true" style={{ position: 'absolute', top: '70%', left: '72%' }}>
                    <svg viewBox="0 0 18 24" width="18" height="24">
                      <path d="M2 1v19l4.5-4.1 3.2 7 3.1-1.5-3.4-7h6.1L2 1Z" fill="#000" stroke="#fff" strokeWidth="1.2" />
                    </svg>
                  </span>
                </span>

                <span className="Productivity_toolTitles__Tds1i">
                  <span className="Productivity_searchCaption__zqfRZ">Circle anything.</span>
                  <span className="Productivity_searchSubcaption__naujV">Ask about it.</span>
                </span>
              </button>
            </div>
          </div>

          {/* 2. Dictation */}
          <div className="Productivity_dictationPosition__LlKxs">
            <div className="Productivity_cardHitArea__ZAs_V">
              <button
                className="Productivity_toolCard__dJhLx"
                type="button"
                aria-label="Preview the Hito dictation tool: hold Ctrl and Win and talk"
                data-active={activeCard === 1 ? 'true' : 'false'}
                style={
                  {
                    '--tilt': '-5deg',
                    '--lift-tilt': '2deg',
                    '--lift-scale': '1.06',
                    '--card-width': 'clamp(236px, 17vw, 244px)',
                  } as React.CSSProperties
                }
                onMouseEnter={() => setActiveCard(1)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <span className="Productivity_toolHead__SeBoO">
                  <span className="Productivity_toolIcon__vf2Nc">
                    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.7 10.1V7.6a3.3 3.3 0 1 1 6.6 0v2.5a3.3 3.3 0 1 1-6.6 0Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M6.2 10.6a5.8 5.8 0 0 0 11.6 0M12 16.4v3.6M9.1 20h5.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="Productivity_toolName__t2yhF">DICTATION</span>
                  <span className="Productivity_toolKeys__SkFM1" aria-hidden="true">
                    <span className="Productivity_toolKey__KYKYf"><kbd>Ctrl</kbd></span>
                    <span className="Productivity_toolKey__KYKYf"><i>+</i><kbd>Win</kbd></span>
                  </span>
                </span>

                <span className="Productivity_picDictationBody__pC_Dm">
                  <span className="Productivity_toolPicture__KqwJc Productivity_picDictation__sZwo4">
                    <canvas
                      ref={dictationCanvasRef}
                      className="Productivity_dictationCanvas__XAetO"
                      width={76}
                      height={36}
                      style={{ width: '98.8px', height: '46.8px' }}
                      aria-hidden="true"
                    />
                    <span className="Productivity_picTyped__3yrh3">
                      <span className="Shine_shine__TEe04">
                        <span className="Shine_text__3uvzA" style={{ color: '#111' }}>
                          <strong>Let’s meet at 10.</strong>
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="Productivity_toolCaption__X5RRC Productivity_toolCaptionSoft__WspiM">
                    “uh so meet at nine… no, ten?”
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* 3. To-Do List */}
          <div className="Productivity_todoPosition__xxzVq">
            <div className="Productivity_cardHitArea__ZAs_V">
              <button
                className="Productivity_toolCard__dJhLx"
                type="button"
                aria-label="Preview the Hito to-do list: three to-dos ticked off one by one"
                data-active={activeCard === 2 ? 'true' : 'false'}
                style={
                  {
                    '--tilt': '4deg',
                    '--lift-tilt': '1deg',
                    '--lift-scale': '1.05',
                    '--card-width': 'clamp(224px, 18vw, 250px)',
                  } as React.CSSProperties
                }
                onMouseEnter={() => setActiveCard(2)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <span className="Productivity_toolHead__SeBoO">
                  <span className="Productivity_toolIcon__vf2Nc">
                    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12.5l4.6 4.6L19 7.4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="Productivity_toolName__t2yhF">TO-DO LIST</span>
                  <span className="Productivity_todoCardRing__WokTf">
                    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                      <circle cx="13" cy="13" r="11" fill="none" stroke="rgba(58, 46, 14, .1)" strokeWidth="3.4" />
                      <circle
                        cx="13"
                        cy="13"
                        r="11"
                        fill="none"
                        stroke="#8ED92F"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeDasharray={`${circumference * progressRatio} ${circumference}`}
                        transform="rotate(-90 13 13)"
                        opacity={completedCount > 0 ? 1 : 0}
                        style={{ transition: 'stroke-dasharray .3s cubic-bezier(.33, 1, .68, 1)' }}
                      />
                    </svg>
                    <b>{completedCount}/3</b>
                  </span>
                </span>

                <span className="Productivity_todoCardRows__Z2rbs" style={{ gap: '6px' }}>
                  {todos.map((todo, idx) => (
                    <span
                      key={idx}
                      className="Productivity_todoCardRow__9PMYy"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTodo(idx);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                        <circle
                          cx="8"
                          cy="8"
                          r="7"
                          fill={todo.done ? '#8ED92F' : 'none'}
                          stroke={todo.done ? '#8ED92F' : 'rgba(58, 46, 14, .38)'}
                          strokeWidth="1.8"
                        />
                        {todo.done && (
                          <path d="M4.5 8.5L7 11L11.5 5.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                        )}
                      </svg>
                      <span
                        className="Productivity_todoCardTitle__5CFl1"
                        data-done={todo.done ? 'true' : 'false'}
                        style={{ textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.6 : 1 }}
                      >
                        {todo.title}
                      </span>
                      {todo.time && <span className="Productivity_todoCardTime__y__IX">{todo.time}</span>}
                    </span>
                  ))}
                </span>
              </button>
            </div>
          </div>

          {/* 4. Scheduled Search */}
          <div className="Productivity_amazonPosition__eQV_E">
            <div className="Productivity_cardHitArea__ZAs_V">
              <button
                className="Productivity_toolCard__dJhLx"
                type="button"
                data-active={activeCard === 3 ? 'true' : 'false'}
                style={
                  {
                    '--tilt': '-2deg',
                    '--lift-tilt': '1deg',
                    '--lift-scale': '1.06',
                    '--card-width': 'clamp(244px, 20vw, 290px)',
                  } as React.CSSProperties
                }
                onMouseEnter={() => setActiveCard(3)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <span className="Productivity_toolHead__SeBoO">
                  <span className="Productivity_toolIcon__vf2Nc">
                    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5.4 5.4h13.2a1.8 1.8 0 0 1 1.8 1.8v11.4a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8V7.2a1.8 1.8 0 0 1 1.8-1.8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      <path d="M3.6 10.1h16.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M8.2 3.4v3.6M15.8 3.4v3.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      <circle cx="8.4" cy="14" r="1.05" fill="currentColor" />
                      <circle cx="12" cy="14" r="1.05" fill="currentColor" />
                      <circle cx="15.6" cy="14" r="1.05" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="Productivity_toolName__t2yhF">SCHEDULED SEARCH</span>
                </span>

                <span className="Productivity_toolPicture__KqwJc Productivity_picSchedule__cYH0J">
                  <span className="Productivity_picDay__gukm_">
                    <b>NOV</b>
                    <strong>10</strong>
                  </span>
                  <span className="Productivity_picWhen__CItnh">
                    <strong>11:00 AM</strong>
                    <span>
                      <img src="/images/dates-mark.png" alt="" aria-hidden="true" />
                      opens amazon.in
                    </span>
                  </span>
                </span>

                <span className="Productivity_toolCaption__X5RRC">
                  “Search Amazon for gift wraps on 10th November at 11:00 a.m.”
                </span>
              </button>
            </div>
          </div>

          {/* 5. Routine */}
          <div className="Productivity_schedulePosition__XjAcO">
            <div className="Productivity_cardHitArea__ZAs_V">
              <button
                className="Productivity_toolCard__dJhLx"
                type="button"
                data-active={activeCard === 4 ? 'true' : 'false'}
                style={
                  {
                    '--tilt': '-6deg',
                    '--lift-tilt': '-3deg',
                    '--lift-scale': '1.05',
                    '--card-width': 'clamp(236px, 19vw, 270px)',
                  } as React.CSSProperties
                }
                onMouseEnter={() => setActiveCard(4)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <span className="Productivity_toolHead__SeBoO">
                  <span className="Productivity_toolIcon__vf2Nc">
                    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="13.7" r="6.9" fill="none" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M12 10v3.7l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.7 3.3h4.6M12 3.3v3.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="Productivity_toolName__t2yhF">ROUTINE</span>
                </span>

                <span className="Productivity_toolPicture__KqwJc Productivity_picRoutine__UV368">
                  <strong>9:00</strong>
                  <span className="Productivity_picApp__OSRv6" role="img" aria-label="Unity">
                    <img src="/images/unity-mark.png" alt="" aria-hidden="true" />
                  </span>
                  <span className="Productivity_picApp__OSRv6 Productivity_picAppLight__OABf_" role="img" aria-label="Spotify">
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                      <circle cx="12" cy="12" r="10.5" fill="#1ed760" />
                      <path d="M6.3 9.2c3.5-1 7.8-.7 11.4.9" fill="none" stroke="white" strokeLinecap="round" strokeWidth="1.6" />
                      <path d="M6.9 12.4c3-.8 6.6-.5 9.8.7" fill="none" stroke="white" strokeLinecap="round" strokeWidth="1.6" />
                      <path d="M7.7 15.4c2.3-.5 5-.3 7.4.6" fill="none" stroke="white" strokeLinecap="round" strokeWidth="1.5" />
                    </svg>
                  </span>
                </span>

                <span className="Productivity_toolCaption__X5RRC">
                  “Every morning at 9:00, open Unity and Spotify.”
                </span>
              </button>
            </div>
          </div>

          {/* 6. Search */}
          <div className="Productivity_youtubePosition__bysso">
            <div className="Productivity_cardHitArea__ZAs_V">
              <button
                className="Productivity_toolCard__dJhLx"
                type="button"
                data-active={activeCard === 5 ? 'true' : 'false'}
                style={
                  {
                    '--tilt': '1deg',
                    '--lift-tilt': '-1deg',
                    '--lift-scale': '1.06',
                    '--card-width': 'clamp(244px, 20vw, 290px)',
                  } as React.CSSProperties
                }
                onMouseEnter={() => setActiveCard(5)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <span className="Productivity_toolHead__SeBoO">
                  <span className="Productivity_toolIcon__vf2Nc">
                    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.9" />
                      <path d="M15.2 15.2 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="Productivity_toolName__t2yhF">SEARCH</span>
                </span>

                <span className="Productivity_toolPicture__KqwJc Productivity_picResults__KzMZq">
                  <span className="Productivity_picSearch__hUGHI">
                    how to cook spaghetti
                    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
                      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="Productivity_picThumb__agZZ_" style={{ background: 'linear-gradient(135deg, #e8b04a, #b8561d)' }}>
                    <svg viewBox="0 0 28 20" width="16" height="12" aria-hidden="true">
                      <path fill="#ff0033" d="M26.5 3.25a3.35 3.35 0 0 0-2.36-2.37C22.06.3 14 .3 14 .3s-8.06 0-10.14.58A3.35 3.35 0 0 0 1.5 3.25C.92 5.33.92 10 .92 10s0 4.67.58 6.75a3.35 3.35 0 0 0 2.36 2.37c2.08.58 10.14.58 10.14.58s8.06 0 10.14-.58a3.35 3.35 0 0 0 2.36-2.37c.58-2.08.58-6.75.58-6.75s0-4.67-.58-6.75Z" />
                      <path fill="#fff" d="m11.2 14.2 6.2-4.2-6.2-4.2v8.4Z" />
                    </svg>
                  </span>
                </span>

                <span className="Productivity_toolCaption__X5RRC">
                  “Search how to cook spaghetti on YouTube.”
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tool Dots */}
        <div className="Productivity_toolDots__g6uzK" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <i key={i} data-on={activeCard === i ? 'true' : 'false'} />
          ))}
        </div>
      </div>
    </section>
  );
};
