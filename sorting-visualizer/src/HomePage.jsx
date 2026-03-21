import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./components/Navbar";

// --- Shared design tokens ---
const COLORS = {
  accent:     "#6366f1",
  compare:    "#f59e0b",
  swap:       "#ef4444",
  sorted:     "#10b981",
  pivot:      "#a855f7",
  barDefault: "#3b4a6b",
};

const THEMES = {
  dark: {
    bg: "#0d1117",
    surface: "#161b22",
    surfaceAlt: "#1c2333",
    border: "#30363d",
    text: "#e6edf3",
    textMuted: "#8b949e",
  },
  light: {
    bg: "#f0f4f8",
    surface: "#ffffff",
    surfaceAlt: "#f8fafc",
    border: "#e2e8f0",
    text: "#1a202c",
    textMuted: "#718096",
  },
};

// --- Mini animated bar preview ---
function AnimatedBars() {
  const COUNT = 32;
  const [bars, setBars] = useState(() =>
    Array.from({ length: COUNT }, () => ({
      height: Math.random() * 80 + 15,
      color: COLORS.barDefault,
    }))
  );
  const timerRef = useRef(null);
  const stepRef  = useRef(0);

  useEffect(() => {
    const tick = () => {
      setBars(prev => {
        const next = prev.map(b => ({ ...b }));
        const i = stepRef.current % COUNT;
        const j = (stepRef.current + 5) % COUNT;
        if (stepRef.current > 1) {
          next[(stepRef.current - 2 + COUNT) % COUNT].color = COLORS.barDefault;
        }
        next[i].color = COLORS.compare;
        if (next[i].height > next[j].height) {
          const tmp = next[i].height;
          next[i].height = next[j].height;
          next[j].height = tmp;
          next[j].color = COLORS.swap;
        } else {
          next[j].color = COLORS.sorted;
        }
        stepRef.current++;
        return next;
      });
      timerRef.current = setTimeout(tick, 110);
    };
    tick();
    return () => clearTimeout(timerRef.current);
  }, []);

  const maxH = Math.max(...bars.map(b => b.height));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 90, padding: "0 2px" }}>
      {bars.map((bar, i) => (
        <div key={i} style={{
          flex: 1, minWidth: 1,
          height: `${(bar.height / maxH) * 100}%`,
          background: bar.color,
          borderRadius: "2px 2px 0 0",
          transition: "background 0.1s ease, height 0.25s ease",
        }} />
      ))}
    </div>
  );
}

// --- Algorithm cards data ---
const ALGOS = [
  { key: "bubble",    name: "Bubble Sort",    time: "O(n\u00b2)",      best: "O(n)",       space: "O(1)",     color: COLORS.compare },
  { key: "selection", name: "Selection Sort", time: "O(n\u00b2)",      best: "O(n\u00b2)",      space: "O(1)",     color: COLORS.swap    },
  { key: "insertion", name: "Insertion Sort", time: "O(n\u00b2)",      best: "O(n)",       space: "O(1)",     color: "#3b82f6" },
  { key: "merge",     name: "Merge Sort",     time: "O(n log n)", best: "O(n log n)", space: "O(n)",     color: COLORS.sorted  },
  { key: "quick",     name: "Quick Sort",     time: "O(n log n)", best: "O(n log n)", space: "O(log n)", color: COLORS.accent  },
  { key: "heap",      name: "Heap Sort",      time: "O(n log n)", best: "O(n log n)", space: "O(1)",     color: COLORS.pivot   },
];

const FEATURES = [
  { icon: "\u26a1", label: "PURE ALGO TIME",      desc: "Measures raw CPU time via performance.now() \u2014 no animation overhead." },
  { icon: "\ud83d\udcca", label: "COMPLEXITY ANALYSIS", desc: "Best, Average & Worst case ops vs your actual run, as live bars." },
  { icon: "\ud83c\udfac", label: "STEP ANIMATION",       desc: "Yellow = comparing, red = swapping, green = sorted, purple = pivot." },
  { icon: "\ud83c\udf9b", label: "FULL CONTROLS",        desc: "Array size 5-100, speed slider, pause mid-sort, reset anytime." },
  { icon: "\ud83c\udf17", label: "DARK / LIGHT MODE",    desc: "Toggle theme without interrupting a live visualization." },
  { icon: "\ud83d\udcf1", label: "RESPONSIVE",           desc: "Scales beautifully on mobile, tablet, and desktop." },
];

// --- Main HomePage ---
export default function HomePage() {
  const navigate = useNavigate();
  const onStart = () => navigate("/visualizer");
  const [darkMode, setDarkMode] = useState(true);
  const [hoveredAlgo, setHoveredAlgo] = useState(null);
  const [tick, setTick] = useState(0);
  const theme = darkMode ? { ...THEMES.dark, ...COLORS } : { ...THEMES.light, ...COLORS };

  const algosSectionRef = useRef(null);
  const scrollToAlgos = useCallback(() => {
    algosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      color: theme.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      "--bg": theme.bg,
      "--surface": theme.surface,
      "--surface-alt": theme.surfaceAlt,
      "--border": theme.border,
      "--text": theme.text,
      "--text-muted": theme.textMuted,
      "--accent": theme.accent,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0.2; }
        }
        @keyframes statusPulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }

        .fu1 { animation: fadeUp 0.5s 0.05s both; }
        .fu2 { animation: fadeUp 0.5s 0.15s both; }
        .fu3 { animation: fadeUp 0.5s 0.25s both; }
        .fu4 { animation: fadeUp 0.5s 0.35s both; }
        .fu5 { animation: fadeUp 0.5s 0.45s both; }

        .hp-algo-card {
          border-radius: 12px;
          padding: 16px;
          border: 1px solid var(--border);
          background: var(--surface);
          cursor: pointer;
          transition: all 0.18s;
        }
        .hp-algo-card:hover { transform: translateY(-2px); }

        .hp-feat-card {
          border-radius: 12px;
          padding: 18px;
          border: 1px solid var(--border);
          background: var(--surface);
          transition: all 0.18s;
        }
        .hp-feat-card:hover {
          border-color: var(--accent);
          background: var(--surface-alt);
        }

        .hp-cta {
          padding: 10px 24px;
          border-radius: 10px;
          border: none;
          font-size: 13px;
          font-family: inherit;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.18s;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
        }
        .hp-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(99,102,241,0.35);
        }

        .hp-ghost {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--border);
          font-size: 13px;
          font-family: inherit;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.18s;
          background: transparent;
          color: var(--text-muted);
        }
        .hp-ghost:hover {
          border-color: var(--accent);
          color: var(--text);
          background: var(--surface-alt);
        }

        .social-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 16px;
          border-radius: 8px;
          border: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          font-family: inherit;
          text-decoration: none;
          letter-spacing: 0.03em;
          transition: all 0.18s;
        }
        .social-link:hover {
          border-color: var(--accent);
          color: var(--text);
          background: var(--surface-alt);
          transform: translateY(-1px);
        }

        .tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .hp-cta { width: 100%; justify-content: center; }
          .hp-container { padding: 0 16px !important; }
          .hero-grid { display: flex !important; flex-direction: column !important; }
          .hero-copy { order: 1; }
          .hero-preview { order: 2; }
          .hp-stats > div { flex: 1 1 120px; }
          .hp-mini-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .algo-grid  { grid-template-columns: 1fr 1fr !important; }
          .feat-grid  { grid-template-columns: 1fr !important; }
          .hp-cta-strip { flex-direction: column; align-items: flex-start; }
          .hp-footer-main { height: auto; padding: 14px 20px; flex-direction: column; align-items: flex-start; }
          .hp-footer-bottom { flex-direction: column; align-items: flex-start; }
          .hp-socials { flex-wrap: wrap; }
        }
        @media (max-width: 560px) {
          .algo-grid { grid-template-columns: 1fr !important; }
          .hp-mini-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>


     
    
      <Navbar
        theme={theme}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        showAction
        actionLabel={`${"\u25b6"} Launch App`}
        onAction={onStart}
        hideActionOnMobile
      />

      <div className="hp-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>

        {/* HERO */}
        <section className="hero-grid" style={{
          padding: "72px 0 60px",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 40, alignItems: "center",
        }}>
          {/* Left */}
          <div className="hero-copy">
            <div className="fu1" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: `${theme.accent}18`, border: `1px solid ${theme.accent}44`,
              borderRadius: 6, padding: "4px 12px", marginBottom: 22,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.sorted, animation: "blink 1.4s infinite" }} />
              <span style={{ fontSize: 10, color: theme.accent, fontWeight: 700, letterSpacing: "0.1em" }}>
                INTERACTIVE {"\u00b7"} EDUCATIONAL {"\u00b7"} FREE
              </span>
            </div>

            <h1 className="fu2" style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(30px, 4vw, 50px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}>
              Watch Sorting<br />
              <span style={{
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Algorithms Live.
              </span>
            </h1>

            <p className="fu3" style={{
              fontSize: 13, color: theme.textMuted, lineHeight: 1.8,
              maxWidth: 400, marginBottom: 28,
            }}>
              Visualize 6 classic sorting algorithms step-by-step.
              Every comparison highlighted, every swap animated {"\u2014"}
              with real-time complexity analysis and pure CPU timing.
            </p>

            <div className="fu4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="hp-cta" onClick={onStart}>{"\u25b6"} Start Visualizing</button>
              <button className="hp-ghost" onClick={scrollToAlgos}>View Algorithms {"\u2193"}</button>
            </div>

            {/* Stat cards */}
            <div className="fu5 hp-stats" style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap" }}>
              {[
                { label: "ALGORITHMS",  val: "6",    color: theme.accent  },
                { label: "MAX ARRAY",   val: "100",  color: theme.compare },
                { label: "OPEN SOURCE", val: "YES",  color: theme.sorted  },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: "10px 16px",
                  display: "flex", flexDirection: "column", gap: 3,
                }}>
                  <span style={{ fontSize: 9, color: theme.textMuted, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="fu3 hero-preview" style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            padding: "20px 16px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 9, color: theme.textMuted, letterSpacing: "0.08em", fontWeight: 600 }}>LIVE PREVIEW</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: theme.sorted, animation: "statusPulse 1s infinite" }} />
                <span style={{ fontSize: 10, color: theme.sorted, fontWeight: 600 }}>RUNNING...</span>
              </div>
            </div>

            <AnimatedBars />

            {/* axis line */}
            <div style={{ height: 1, background: theme.border, margin: "12px 4px" }} />

            {/* Stat cards row */}
            <div className="hp-mini-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { label: "COMPARISONS", val: (tick * 23 + 108).toLocaleString(), color: theme.compare },
                { label: "SWAPS",       val: (tick * 9  + 44).toLocaleString(),  color: theme.swap    },
                { label: "SORTED",      val: `${Math.min(tick * 5 + 8, 100)}%`,  color: theme.sorted  },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  background: theme.surfaceAlt,
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex", flexDirection: "column", gap: 3,
                }}>
                  <span style={{ fontSize: 9, color: theme.textMuted, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Legend (from visualizer) */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[["Comparing", theme.compare], ["Swapping", theme.swap], ["Sorted", theme.sorted], ["Pivot", theme.pivot]].map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: theme.textMuted }}>
                  <div style={{ width: 10, height: 10, background: color, borderRadius: 3 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ALGORITHMS */}
        <section ref={algosSectionRef} style={{ paddingBottom: 56, scrollMarginTop: 72 }} >
          <span style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.08em", fontWeight: 700, display: "block", marginBottom: 16 }}>
            ALGORITHMS
          </span>
          <div className="algo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {ALGOS.map((a, i) => (
              <div key={a.name}
                className="hp-algo-card"
                onMouseEnter={() => setHoveredAlgo(i)}
                onMouseLeave={() => setHoveredAlgo(null)}
                onClick={() => navigate("/visualizer", { state: { algo: a.key } })}
                style={{ borderColor: hoveredAlgo === i ? a.color : theme.border }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{a.name}</span>
                  <span className="tag" style={{
                    background: hoveredAlgo === i ? `${a.color}22` : theme.surfaceAlt,
                    color: hoveredAlgo === i ? a.color : theme.textMuted,
                    transition: "all 0.18s",
                  }}>{a.time}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { k: "BEST CASE",  v: a.best,  c: theme.sorted  },
                    { k: "WORST CASE", v: a.time,  c: theme.swap    },
                    { k: "SPACE",      v: a.space, c: theme.accent  },
                  ].map(({ k, v, c }) => (
                    <div key={k} style={{
                      background: theme.surfaceAlt, borderRadius: 6,
                      padding: "5px 10px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <span style={{ fontSize: 9, color: theme.textMuted, letterSpacing: "0.06em", fontWeight: 600 }}>{k}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ paddingBottom: 56 }}>
          <span style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.08em", fontWeight: 700, display: "block", marginBottom: 16 }}>
            FEATURES
          </span>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {FEATURES.map(f => (
              <div key={f.label} className="hp-feat-card">
                <div style={{ fontSize: 20, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 9, color: theme.textMuted, letterSpacing: "0.08em", fontWeight: 700, marginBottom: 6 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA STRIP */}
        <section style={{ paddingBottom: 60 }}>
          <div className="hp-cta-strip" style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            padding: "32px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 20,
          }}>
            <div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", marginBottom: 6,
              }}>
                Ready to see it in action?
              </div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>
                Pick an algorithm, set your array size, and hit Start.
              </div>
            </div>
            <button className="hp-cta" onClick={onStart} style={{ fontSize: 14, padding: "12px 32px" }}>
              {"\u25b6"} Start Visualizing
            </button>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${theme.border}`, background: theme.surface }}>
        <div className="hp-footer-main" style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 20, minHeight: 64,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>{"\u2b06"}</div>
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", cursor: "pointer" }}>SortViz</span>
          </Link>
            <span style={{ color: theme.textMuted, fontSize: 12 }}>{"\u2014"} algorithm visualizer</span>
          </div>

          {/* Built by */}
          <div>
            <span style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.06em" }}>BUILT BY </span>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Abhay </span> 
             <span style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.06em" }}>(UID: 1253394105)</span>
          </div>

          {/* Social links */}
          <div className="hp-socials" style={{ display: "flex", gap: 8 }}>
            <a href="https://github.com/AbHaY-PaWaR" target="_blank" rel="noopener noreferrer" className="social-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </a>
            <a href="https://www.instagram.com/x___abhay/" target="_blank" rel="noopener noreferrer" className="social-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </a>
          </div>
        </div>

        {/* Bottom copyright strip */}
        <div className="hp-footer-bottom" style={{
          maxWidth: 1200, margin: "0 auto", padding: "12px 20px",
          borderTop: `1px solid ${theme.border}`,
          display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.06em" }}>
            {"\u00a9"} {new Date().getFullYear()} SORTVIZ {"\u2014"} BUILT WITH REACT + VITE
          </span>
          <span style={{ fontSize: 10, color: theme.textMuted, letterSpacing: "0.06em" }}>
            6 ALGORITHMS {"\u00b7"} REAL-TIME VISUALIZATION {"\u00b7"} OPEN SOURCE
          </span>
        </div>
      </footer>
    </div>
  );
}
