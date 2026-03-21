import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";

// ─── Color Tokens ───────────────────────────────────────────────────────────
const COLORS = {
  default:   "#3b4a6b",
  compare:   "#f59e0b",
  swap:      "#ef4444",
  sorted:    "#10b981",
  pivot:     "#a855f7",
  selected:  "#3b82f6",
};

// ─── Algorithm Generators (pure logic → animation steps) ────────────────────
function* bubbleSortGen(arr) {
  const a = [...arr]; const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { type: "compare", indices: [j, j + 1], array: [...a] };
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        yield { type: "swap", indices: [j, j + 1], array: [...a] };
      }
    }
    yield { type: "sorted", indices: [n - 1 - i], array: [...a] };
  }
  yield { type: "sorted", indices: [0], array: [...a] };
}

function* selectionSortGen(arr) {
  const a = [...arr]; const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: "compare", indices: [minIdx, j], array: [...a] };
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      yield { type: "swap", indices: [i, minIdx], array: [...a] };
    }
    yield { type: "sorted", indices: [i], array: [...a] };
  }
  yield { type: "sorted", indices: [n - 1], array: [...a] };
}

function* insertionSortGen(arr) {
  const a = [...arr]; const n = a.length;
  yield { type: "sorted", indices: [0], array: [...a] };
  for (let i = 1; i < n; i++) {
    let j = i;
    yield { type: "compare", indices: [j - 1, j], array: [...a] };
    while (j > 0 && a[j - 1] > a[j]) {
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      yield { type: "swap", indices: [j - 1, j], array: [...a] };
      j--;
      if (j > 0) yield { type: "compare", indices: [j - 1, j], array: [...a] };
    }
    yield { type: "sorted", indices: [i], array: [...a] };
  }
}

function* mergeSortGen(arr) {
  const a = [...arr];
  function* mergeSort(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* mergeSort(lo, mid);
    yield* mergeSort(mid, hi);
    // merge
    const left = a.slice(lo, mid), right = a.slice(mid, hi);
    let i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
      yield { type: "compare", indices: [lo + i, mid + j], array: [...a] };
      if (left[i] <= right[j]) { a[k++] = left[i++]; }
      else { a[k++] = right[j++]; }
      yield { type: "swap", indices: [k - 1], array: [...a] };
    }
    while (i < left.length) { a[k++] = left[i++]; yield { type: "swap", indices: [k - 1], array: [...a] }; }
    while (j < right.length) { a[k++] = right[j++]; yield { type: "swap", indices: [k - 1], array: [...a] }; }
    for (let x = lo; x < hi; x++) yield { type: "sorted", indices: [x], array: [...a] };
  }
  yield* mergeSort(0, a.length);
}

function* quickSortGen(arr) {
  const a = [...arr];
  function* quickSort(lo, hi) {
    if (lo >= hi) return;
    const pivot = a[hi];
    yield { type: "pivot", indices: [hi], array: [...a] };
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      yield { type: "compare", indices: [j, hi], array: [...a] };
      if (a[j] <= pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        yield { type: "swap", indices: [i, j], array: [...a] };
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    yield { type: "sorted", indices: [i + 1], array: [...a] };
    yield* quickSort(lo, i);
    yield* quickSort(i + 2, hi);
  }
  yield* quickSort(0, a.length - 1);
}

function* heapSortGen(arr) {
  const a = [...arr]; const n = a.length;
  function* heapify(size, root) {
    let largest = root, l = 2 * root + 1, r = 2 * root + 2;
    if (l < size) { yield { type: "compare", indices: [l, largest], array: [...a] }; if (a[l] > a[largest]) largest = l; }
    if (r < size) { yield { type: "compare", indices: [r, largest], array: [...a] }; if (a[r] > a[largest]) largest = r; }
    if (largest !== root) {
      [a[root], a[largest]] = [a[largest], a[root]];
      yield { type: "swap", indices: [root, largest], array: [...a] };
      yield* heapify(size, largest);
    }
  }
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) yield* heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    yield { type: "swap", indices: [0, i], array: [...a] };
    yield { type: "sorted", indices: [i], array: [...a] };
    yield* heapify(i, 0);
  }
  yield { type: "sorted", indices: [0], array: [...a] };
}

const ALGORITHMS = {
  bubble:    { name: "Bubble Sort",    gen: bubbleSortGen,    time: "O(n²)",      space: "O(1)",    best: "O(n)", average: "O(n²)", worst: "O(n²)",      desc: "Repeatedly compares adjacent elements and swaps them if they're in the wrong order. Simple but slow for large datasets." },
  selection: { name: "Selection Sort", gen: selectionSortGen, time: "O(n²)",      space: "O(1)",    best: "O(n²)", average: "O(n²)", worst: "O(n²)",     desc: "Finds the minimum element from the unsorted portion and places it at the beginning. Makes fewer swaps than bubble sort." },
  insertion: { name: "Insertion Sort", gen: insertionSortGen, time: "O(n²)",      space: "O(1)",    best: "O(n)", average: "O(n²)", worst: "O(n²)",      desc: "Builds the sorted array one element at a time by inserting each element into its correct position. Efficient for small or nearly-sorted arrays." },
  merge:     { name: "Merge Sort",     gen: mergeSortGen,     time: "O(n log n)", space: "O(n)",    best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", desc: "Divides the array in half, recursively sorts each half, then merges them. Guaranteed O(n log n) performance." },
  quick:     { name: "Quick Sort",     gen: quickSortGen,     time: "O(n log n)", space: "O(log n)", best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", desc: "Picks a pivot element and partitions the array around it. Very fast in practice, though worst case is O(n²)." },
  heap:      { name: "Heap Sort",      gen: heapSortGen,      time: "O(n log n)", space: "O(1)",    best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", desc: "Uses a binary heap data structure. Guaranteed O(n log n) and in-place, but not cache-friendly." },
};

// ─── Utility ────────────────────────────────────────────────────────────────
function generateArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

function speedToDelay(speed) {
  // speed: 1–10 → delay: 500ms–5ms
  return Math.round(500 / Math.pow(speed, 1.6));
}

// ─── Actual Complexity Helpers ───────────────────────────────────────────────
function computeTheoreticalOps(algo, n) {
  switch (algo) {
    case "bubble":    return { best: n - 1, average: Math.round((n * (n - 1)) / 4), worst: Math.round((n * (n - 1)) / 2) };
    case "selection": return { best: Math.round((n * (n - 1)) / 2), average: Math.round((n * (n - 1)) / 2), worst: Math.round((n * (n - 1)) / 2) };
    case "insertion": return { best: n - 1, average: Math.round((n * (n - 1)) / 4), worst: Math.round((n * (n - 1)) / 2) };
    case "merge":     return { best: Math.round(n * Math.log2(n)), average: Math.round(n * Math.log2(n)), worst: Math.round(n * Math.log2(n)) };
    case "quick":     return { best: Math.round(n * Math.log2(n)), average: Math.round(n * Math.log2(n)), worst: Math.round((n * (n - 1)) / 2) };
    case "heap":      return { best: Math.round(2 * n * Math.log2(n)), average: Math.round(2 * n * Math.log2(n)), worst: Math.round(2 * n * Math.log2(n)) };
    default:          return { best: 0, average: 0, worst: 0 };
  }
}

function classifyCase(algo, n, actualComps) {
  const t = computeTheoreticalOps(algo, n);
  const range = t.worst - t.best || 1;
  const ratio = (actualComps - t.best) / range;
  if (ratio <= 0.15) return { label: "BEST CASE", color: "#10b981", emoji: "🟢" };
  if (ratio >= 0.80) return { label: "WORST CASE", color: "#ef4444", emoji: "🔴" };
  return { label: "AVERAGE CASE", color: "#f59e0b", emoji: "🟡" };
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function SortingVisualizer() {
  const location = useLocation();
  const [algo, setAlgo] = useState(() => location.state?.algo || "bubble");
  const [arraySize, setArraySize] = useState(40);
  const [speed, setSpeed] = useState(5);
  const [array, setArray] = useState(() => generateArray(40));
  const [barColors, setBarColors] = useState({});
  const [sortedSet, setSortedSet] = useState(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [arrayInputVal, setArrayInputVal] = useState("40");
  const [pureMs, setPureMs] = useState(null);
  const [visualMs, setVisualMs] = useState(null);
  const [showPureNote, setShowPureNote] = useState(false);
  const [showSortedToast, setShowSortedToast] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);
  const [showComplexityNote, setShowComplexityNote] = useState(false);
  const pureNoteRef = useRef(null);

  const pauseRef = useRef(false);
  const stopRef = useRef(false);
  const speedRef = useRef(speed);
  const animFrameRef = useRef(null);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handleChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handleChange);
    else mq.addListener(handleChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handleChange);
      else mq.removeListener(handleChange);
    };
  }, []);
  useEffect(() => {
    if (!showPureNote) return;
    const handleOutsideClick = (e) => {
      if (pureNoteRef.current && !pureNoteRef.current.contains(e.target)) {
        setShowPureNote(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showPureNote]);

  const algoInfo = ALGORITHMS[algo];

  const resetState = useCallback((newArr) => {
    stopRef.current = true;
    pauseRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setIsDone(false);
    setBarColors({});
    setSortedSet(new Set());
    setComparisons(0);
    setSwaps(0);
    setPureMs(null);
    setVisualMs(null);
    setShowSortedToast(false);
    if (newArr) setArray(newArr);
  }, []);

  const newArray = useCallback(() => {
    const arr = generateArray(arraySize);
    resetState(arr);
  }, [arraySize, resetState]);

  const sleep = useCallback((ms) => new Promise(res => {
    const id = setTimeout(res, ms);
    animFrameRef.current = id;
  }), []);

  const waitWhilePaused = useCallback(async () => {
    while (pauseRef.current && !stopRef.current) {
      await sleep(50);
    }
  }, [sleep]);

  const runSort = useCallback(async () => {
    stopRef.current = false;
    pauseRef.current = false;
    setIsRunning(true);
    setIsDone(false);
    setBarColors({});
    setSortedSet(new Set());
    setComparisons(0);
    setSwaps(0);

    // Measure pure algorithm time (no animation delays)
    const pureStart = performance.now();
    const stepsSnapshot = [...ALGORITHMS[algo].gen(array)];
    const pureEnd = performance.now();
    setPureMs(parseFloat((pureEnd - pureStart).toFixed(3)));

    const gen2 = stepsSnapshot[Symbol.iterator]();
    const localSorted = new Set();
    let cmp = 0, swp = 0;
    const visualStart = performance.now();

    for (const step of gen2) {
      if (stopRef.current) return;
      await waitWhilePaused();
      if (stopRef.current) return;

      if (step.type === "compare") {
        cmp++;
        setComparisons(cmp);
        setBarColors(Object.fromEntries(step.indices.map(i => [i, COLORS.compare])));
      } else if (step.type === "swap") {
        swp++;
        setSwaps(swp);
        setArray([...step.array]);
        setBarColors(Object.fromEntries(step.indices.map(i => [i, COLORS.swap])));
      } else if (step.type === "sorted") {
        step.indices.forEach(i => localSorted.add(i));
        setSortedSet(new Set(localSorted));
        setBarColors({});
      } else if (step.type === "pivot") {
        setBarColors(Object.fromEntries(step.indices.map(i => [i, COLORS.pivot])));
      }

      await sleep(speedToDelay(speedRef.current));
    }

    // Mark all sorted
    setSortedSet(new Set(Array.from({ length: array.length }, (_, i) => i)));
    setBarColors({});
    setVisualMs(parseFloat((performance.now() - visualStart).toFixed(0)));
    setIsRunning(false);
    setIsDone(true);
    setShowSortedToast(true);
    setTimeout(() => {
      setShowSortedToast(false);
    }, 2000);
  
    
  }, [algo, array, sleep, waitWhilePaused]);

  const handlePauseResume = () => {
    if (!isRunning) return;
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  };

  const handleReset = () => {
    stopRef.current = true;
    pauseRef.current = false;
    setTimeout(() => resetState(), 50);
  };
  

  

  // Theme
  const bg = darkMode ? "#0d1117" : "#f0f4f8";
  const surface = darkMode ? "#161b22" : "#ffffff";
  const surfaceAlt = darkMode ? "#1c2333" : "#f8fafc";
  const border = darkMode ? "#30363d" : "#e2e8f0";
  const text = darkMode ? "#e6edf3" : "#1a202c";
  const textMuted = darkMode ? "#8b949e" : "#718096";
  const accent = "#6366f1";

  const maxVal = Math.max(...array);
  const showBarLabels = arraySize <= (isMobile ? 26 : 50);

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", transition: "all 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        .algo-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid; font-size: 12px; font-family: inherit; cursor: pointer; transition: all 0.18s; font-weight: 600; letter-spacing: 0.02em; }
        .algo-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .ctrl-btn { padding: 10px 20px; border-radius: 10px; border: none; font-size: 13px; font-family: inherit; cursor: pointer; transition: all 0.18s; font-weight: 700; letter-spacing: 0.05em; }
        .ctrl-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
        .ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #6366f1; cursor: pointer; box-shadow: 0 0 0 3px rgba(99,102,241,0.25); transition: box-shadow 0.15s; }
        input[type=range]::-webkit-slider-thumb:hover { box-shadow: 0 0 0 6px rgba(99,102,241,0.25); }
        .bar { transition: background-color 0.1s ease; }
        .stat-card { border-radius: 10px; padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
        input[type=number] { background: transparent; border: 1px solid; border-radius: 6px; padding: 6px 10px; font-family: inherit; font-size: 13px; width: 64px; text-align: center; outline: none; }
        input[type=number]:focus { border-color: #6366f1; }
        .done-pulse { animation: donePulse 0.6s ease; }
        .bar-area { height: 280px; }
        .bar-labels { display: flex; align-items: flex-start; gap: 2px; padding: 6px 4px 0; height: 18px; }
        .bar-label { flex: 1; text-align: center; font-size: 10px; color: #8b949e; line-height: 1; }
        @keyframes donePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}</style>

      {/* Header */}
      <Navbar
        theme={{ surface, border, text, textMuted }}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        {/* Algorithm Selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {Object.entries(ALGORITHMS).map(([key, info]) => (
            <button key={key} disabled={isRunning} onClick={() => { setAlgo(key); resetState(); }}
              className="algo-btn"
              style={{ background: algo === key ? accent : "transparent", color: algo === key ? "#fff" : textMuted, borderColor: algo === key ? accent : border }}>
              {info.name}
            </button>
          ))}
        </div>

        {/* Main layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

            {showSortedToast && (
                <div className="done-pulse" style={{ position: "absolute", top: 42, right: 54, background: "#10b981", color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
                  ✓ SORTED
                </div>
              )}

          {/* Left: Visualization */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Bar chart */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 16px 12px", position: "relative" }}>
          
              <div className="bar-area" style={{ display: "flex", alignItems: "flex-end", gap: arraySize > 60 ? 1 : 2, padding: "0 4px" }}>
                {array.map((val, i) => {
                  const isSorted = sortedSet.has(i);
                  const color = isSorted ? COLORS.sorted : (barColors[i] || COLORS.default);
                  const heightPct = (val / maxVal) * 100;
                  return (
                    <div key={i} className="bar"
                      style={{
                        flex: 1, height: `${heightPct}%`, background: color,
                        borderRadius: arraySize < 40 ? "3px 3px 0 0" : "2px 2px 0 0",
                        minWidth: 1, position: "relative",
                      }}
                    /> 
                    
                  );
                  
                })}
              </div>
              {/* Axis */}
              <div style={{ height: 1,color:"#6366f1"  , background: border , margin: "0 4px" }} />
              {/* Values */}
              <div
                className="bar-labels"
                style={{ display: showBarLabels ? "flex" : "none", gap: arraySize > 60 ? 1 : 2 }}
              >
                {array.map((val, i) => (
                  <div key={`label-${i}`} className="bar-label" style={{ color: textMuted }}>
                    {val}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "COMPARISONS", val: comparisons.toLocaleString(), color: COLORS.compare },
                { label: "SWAPS", val: swaps.toLocaleString(), color: COLORS.swap },
                { label: "ACTUAL CMPS", val: comparisons.toLocaleString(), color: isDone ? classifyCase(algo, array.length, comparisons).color : COLORS.sorted },
              ].map(({ label, val, color }) => (
                <div key={label} className="stat-card" style={{ background: surface, border: `1px solid ${border}` }}>
                  <span style={{ fontSize: 9, color: textMuted, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
            {/* Timing cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="stat-card" style={{ background: surface, border: `1px solid ${border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, color: textMuted, letterSpacing: "0.08em", fontWeight: 600 }}>{"\u26a1"} PURE ALGO TIME</span>
                  <div ref={pureNoteRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setShowPureNote((prev) => !prev)}
                      style={{
                        border: `1px solid ${border}`,
                        background: showPureNote ? `${accent}22` : surfaceAlt,
                        color: showPureNote ? accent : textMuted,
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 6,
                        cursor: "pointer",
                        letterSpacing: "0.06em",
                        fontFamily: "inherit",
                      }}
                    >
                      WHY VARIES?
                    </button>
                    {showPureNote && (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 8px)",
                          width: 260,
                          maxWidth: "80vw",
                          background: surface,
                          border: `1px solid ${border}`,
                          borderRadius: 10,
                          padding: "10px 12px",
                          zIndex: 6,
                          boxShadow: darkMode
                            ? "0 10px 28px rgba(0,0,0,0.35)"
                            : "0 10px 28px rgba(15,23,42,0.15)",
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: text, marginBottom: 6 }}>
                          Why does it vary between runs?
                        </div>
                        <div style={{ fontSize: 10, color: textMuted, lineHeight: 1.5, marginBottom: 8 }}>
                          Even on the same array, you might see 0.3ms once and 0.8ms the next time. This is because:
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                          {[
                            { title: "CPU scheduling", text: "Other browser tasks may briefly interrupt your code." },
                            { title: "JIT compilation", text: "V8 (Chrome's JS engine) may or may not have compiled that code path yet." },
                            { title: "Memory pressure", text: "Garbage collection can pause execution briefly." },
                            { title: "Browser throttling", text: "Background tabs get less CPU time." },
                          ].map((item) => (
                            <div key={item.title} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent, marginTop: 6, flexShrink: 0 }} />
                              <div style={{ fontSize: 10, color: textMuted, lineHeight: 1.5 }}>
                                <span style={{ color: text, fontWeight: 600 }}>{item.title}</span> - {item.text}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 10, color: textMuted, lineHeight: 1.5 }}>
                          For a more stable measurement, run the algorithm hundreds of times and average the results.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>{pureMs !== null ? `${pureMs} ms` : "\u2014"}</span>
                <span style={{ fontSize: 9, color: textMuted }}>no animation delays</span>
              </div>
              <div className="stat-card" style={{ background: surface, border: `1px solid ${border}` }}>
                <span style={{ fontSize: 9, color: textMuted, letterSpacing: "0.08em", fontWeight: 600 }}>{"\ud83c\udfac"} VISUAL TIME</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#a855f7" }}>{isDone && visualMs !== null ? `${(visualMs/1000).toFixed(2)} s` : isRunning ? "running..." : "\u2014"}</span>
                <span style={{ fontSize: 9, color: textMuted }}>total animation duration</span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[["Comparing", COLORS.compare], ["Swapping", COLORS.swap], ["Sorted", COLORS.sorted], ["Pivot", COLORS.pivot]].map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: textMuted }}>
                  <div style={{ width: 12, height: 12, background: color, borderRadius: 3 }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Actual Complexity Analysis Panel */}
            {(isRunning || isDone) && (() => {
              const n = array.length;
              const totalOps = comparisons; // comparisons only — matches theoretical formula basis
              const theoretical = computeTheoreticalOps(algo, n);
              const caseInfo = classifyCase(algo, n, comparisons);
              const bestPct  = Math.min(100, Math.round((theoretical.best  / theoretical.worst) * 100));
              const avgPct   = Math.min(100, Math.round((theoretical.average / theoretical.worst) * 100));
              const actualPct = Math.min(100, Math.round((totalOps / (theoretical.worst || 1)) * 100));
              const worstPct  = 100;

              return (
                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: "0.08em" }}>
                        ACTUAL COMPLEXITY ANALYSIS <span style={{ fontWeight: 400, opacity: 0.6 }}>(comparisons)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowComplexityNote((prev) => !prev)}
                        style={{
                          border: `1px solid ${border}`,
                          background: showComplexityNote ? `${accent}22` : surfaceAlt,
                          color: showComplexityNote ? accent : textMuted,
                          fontSize: 9,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 6,
                          cursor: "pointer",
                          letterSpacing: "0.06em",
                          fontFamily: "inherit",
                        }}
                      >
                        WHAT IS THIS?
                      </button>
                    </div>
                    {isDone && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: caseInfo.color, background: `${caseInfo.color}18`, padding: "3px 10px", borderRadius: 6 }}>
                        {caseInfo.emoji} {caseInfo.label}
                      </span>
                    )}
                  </div>
                  {showComplexityNote && (
                    <div style={{ marginBottom: 12, padding: "10px 12px", border: `1px dashed ${border}`, borderRadius: 10, background: surfaceAlt }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: text, marginBottom: 6 }}>
                        What this panel shows
                      </div>
                      <div style={{ fontSize: 10, color: textMuted, lineHeight: 1.5, marginBottom: 8 }}>
                        It compares the number of comparisons(or operations) from your current run against the theoretical best, average, and worst cases for the selected algorithm.
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                        {[
                          { title: "Bars", text: "Each bar is a theoretical case (best/avg/worst). The highlighted bar is your actual run." },
                          { title: "Scale", text: "Percent width is normalized to the worst case, so you can see how close you are to the top bound." },
                          { title: "Case label", text: "The badge tags this run as best/average/worst based on where your comparisons land in that range." },
                        ].map((item) => (
                          <div key={item.title} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent, marginTop: 6, flexShrink: 0 }} />
                            <div style={{ fontSize: 10, color: textMuted, lineHeight: 1.5 }}>
                              <span style={{ color: text, fontWeight: 600 }}>{item.title}</span> - {item.text}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: textMuted, lineHeight: 1.5 }}>
                        Tip: If you re-run on the same array, the case label usually stays the same because comparisons depend on input order, not timing noise.  <span>(ops)--&gt;operation</span>
                      </div>
                    </div>
                  )}

                  {/* Comparison bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Best Case (theory)",    ops: theoretical.best,    pct: bestPct,   color: "#10b981" },
                      { label: "Average Case (theory)", ops: theoretical.average, pct: avgPct,    color: "#f59e0b" },
                      { label: "Worst Case (theory)",   ops: theoretical.worst,   pct: worstPct,  color: "#ef4444" },
                      { label: "This Run (actual comparisons) ↓", ops: totalOps, pct: actualPct, color: caseInfo.color, isActual: true },
                    ].map(({ label, ops, pct, color, isActual }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: isActual ? color : textMuted, fontWeight: isActual ? 700 : 400 }}>{label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color }}>{ops.toLocaleString()} ops</span>
                        </div>
                        <div style={{ height: isActual ? 8 : 5, background: `${color}20`, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${pct}%`, background: color, borderRadius: 4,
                            transition: "width 0.6s ease",
                            boxShadow: isActual ? `0 0 8px ${color}88` : "none",
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Efficiency score */}
                  {isDone && (() => {
                    const efficiency = Math.max(0, Math.min(100, Math.round(((theoretical.worst - totalOps) / (Math.max(theoretical.worst - theoretical.best, 1))) * 100)));
                    const effColor = efficiency > 66 ? "#10b981" : efficiency > 33 ? "#f59e0b" : "#ef4444";
                    return (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 9, color: textMuted, letterSpacing: "0.08em", fontWeight: 600, marginBottom: 2 }}>EFFICIENCY SCORE</div>
                            <div style={{ fontSize: 11, color: textMuted }}>
                              {totalOps.toLocaleString()} comparisons vs {theoretical.worst.toLocaleString()} worst-case
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 28, fontWeight: 700, color: effColor, lineHeight: 1 }}>{efficiency}%</div>
                            <div style={{ fontSize: 10, color: textMuted }}>better than worst</div>
                          </div>
                        </div>
                        {pureMs !== null && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{ background: "#6366f115", border: "1px solid #6366f133", borderRadius: 8, padding: "8px 12px" }}>
                              <div style={{ fontSize: 9, color: textMuted, letterSpacing: "0.08em", fontWeight: 600, marginBottom: 3 }}>⚡ PURE ALGO TIME</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: "#6366f1" }}>{pureMs} ms</div>
                              <div style={{ fontSize: 9, color: textMuted, marginTop: 2 }}>no animation delays</div>
                            </div>
                            <div style={{ background: "#a855f715", border: "1px solid #a855f733", borderRadius: 8, padding: "8px 12px" }}>
                              <div style={{ fontSize: 9, color: textMuted, letterSpacing: "0.08em", fontWeight: 600, marginBottom: 3 }}>🎬 VISUAL TIME</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: "#a855f7" }}>{visualMs !== null ? `${(visualMs/1000).toFixed(2)} s` : "—"}</div>
                              <div style={{ fontSize: 9, color: textMuted, marginTop: 2 }}>total animation duration</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>

          {/* Right: Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Controls panel */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: "0.08em" }}>CONTROLS</span>

              {/* Array size */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: textMuted }}>Array Size</span>
                  <input type="number" min={5} max={100} value={arrayInputVal} disabled={isRunning}
                    onChange={e => setArrayInputVal(e.target.value)}
                    onBlur={e => {
                      const v = Math.min(100, Math.max(5, parseInt(e.target.value) || 40));
                      setArraySize(v); setArrayInputVal(String(v));
                      const arr = generateArray(v); resetState(arr);
                    }}
                    style={{ color: text, borderColor: border }} />
                </div>
                <input type="range" min={5} max={100} value={arraySize} disabled={isRunning}
                  onChange={e => { const v = +e.target.value; setArraySize(v); setArrayInputVal(String(v)); const arr = generateArray(v); resetState(arr); }}
                  style={{ width: "100%", background: `linear-gradient(to right, ${accent} ${(arraySize - 5) / 95 * 100}%, ${border} 0)` }} />
              </div>

              {/* Speed */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: textMuted }}>Speed</span>
                  <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{"▶".repeat(Math.ceil(speed / 2))}</span>
                </div>
                <input type="range" min={1} max={10} value={speed}
                  onChange={e => setSpeed(+e.target.value)}
                  style={{ width: "100%", background: `linear-gradient(to right, ${accent} ${(speed - 1) / 9 * 100}%, ${border} 0)` }} />
              </div>

              {/* Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button className="ctrl-btn" disabled={isRunning} onClick={newArray}
                  style={{ background: surfaceAlt, color: text, gridColumn: "1/-1", border: `1px solid ${border}` }}>
                  ↺ New Array
                </button>
                <button className="ctrl-btn" disabled={isRunning} onClick={runSort}
                  style={{ background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, color: "#fff" }}>
                  {isDone ? "↺ Run" : "▶ Start"}
                </button>
                <button className="ctrl-btn" disabled={!isRunning} onClick={handlePauseResume}
                  style={{ background: isPaused ? "#f59e0b" : surfaceAlt, color: isPaused ? "#000" : text, border: `1px solid ${border}` }}>
                  {isPaused ? "▶ Resume" : "⏸ Pause"}
                </button>
                <button className="ctrl-btn" disabled={!isRunning && !isDone} onClick={handleReset}
                  style={{ background: surfaceAlt, color: text, border: `1px solid ${border}`, gridColumn: "1/-1" }}>
                  ⬛ Reset
                </button>
              </div>
            </div>

            {/* Algorithm info */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>{algoInfo.name}</span>
                <span className="tag" style={{ background: `${accent}22`, color: accent }}>{algoInfo.time}</span>
              </div>
              <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.6 }}>{algoInfo.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "BEST CASE",    val: algoInfo.best,    color: COLORS.sorted },
                  { label: "AVERAGE CASE", val: algoInfo.average, color: COLORS.compare },
                  { label: "WORST CASE",   val: algoInfo.worst,   color: COLORS.swap },
                  { label: "SPACE",        val: algoInfo.space,   color: "#6366f1" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: surfaceAlt, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 9, color: textMuted, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Status indicator */}
              {(isRunning || isDone) && (
                <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: isDone ? COLORS.sorted : isPaused ? COLORS.compare : accent,
                      animation: isRunning && !isPaused ? "statusPulse 1s infinite" : "none"
                    }} />
                    <span style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>
                      {isDone ? "COMPLETED" : isPaused ? "PAUSED" : "RUNNING..."}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* All algorithms comparison */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 14, padding: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: "0.08em", display: "block", marginBottom: 12 }}>COMPLEXITY CHART</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(ALGORITHMS).map(([key, info]) => {
                  const isSelected = key === algo;
                  const barWidth = { "O(n²)": "100%", "O(n log n)": "55%", "O(n)": "30%" }[info.time] || "60%";
                  return (
                    <div key={key} onClick={() => { if (!isRunning) { setAlgo(key); resetState(); } }}
                      style={{ cursor: isRunning ? "default" : "pointer", padding: "6px 8px", borderRadius: 8, background: isSelected ? `${accent}15` : "transparent", border: `1px solid ${isSelected ? accent : "transparent"}`, transition: "all 0.15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? accent : textMuted }}>{info.name}</span>
                        <span style={{ fontSize: 10, color: textMuted }}>{info.time}</span>
                      </div>
                      <div style={{ height: 4, background: border, borderRadius: 2 }}>
                        <div style={{ height: "100%", width: barWidth, background: isSelected ? accent : textMuted, borderRadius: 2, opacity: isSelected ? 1 : 0.5, transition: "all 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes statusPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 300px"] { display: flex !important; flex-direction: column !important; }
          .bar-area { height: 220px; }
          .bar-labels { height: 14px; }
          .bar-label { font-size: 8px; }
        }
        @media (max-width: 480px) {
          .bar-area { height: 190px; }
        }
      `}</style>
    </div>
  );
}
