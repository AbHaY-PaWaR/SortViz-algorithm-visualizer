# SortViz — Sorting Algorithm Visualizer

An interactive, production-ready web application that visualizes 6 classic sorting algorithms in real time. Built as an educational tool to help developers and students deeply understand how sorting algorithms work through step-by-step animations, live complexity analysis, and accurate CPU timing.

---

## 🌐 Live Demo

> https://sortviz-algorithm.netlify.app/

---

## ✨ Features

- **6 Sorting Algorithms** — Bubble, Selection, Insertion, Merge, Quick, and Heap Sort
- **Real-time Animation** — every comparison, swap, and sorted element is color-coded and animated step by step
- **Complexity Analysis** — Best, Average, and Worst case theoretical operations displayed as visual bars alongside your actual run
- **Case Classification** — automatically detects whether your array triggered a Best, Average, or Worst case scenario
- **Pure Algorithm Timer** — measures raw CPU execution time using `performance.now()`, completely separate from animation delays
- **Visual Timer** — tracks total wall-clock time of the animation for comparison
- **Efficiency Score** — shows how much better your actual run was compared to the theoretical worst case
- **Array Controls** — slider + numeric input to set array size from 5 to 100 elements
- **Speed Control** — adjustable animation speed from very slow to near-instant
- **Pause / Resume / Reset** — full playback control without breaking animation state
- **Dark / Light Mode** — toggle theme anytime, even during a live sort
- **Responsive Design** — works on mobile, tablet, and desktop

---

## 🧠 Algorithms Implemented

| Algorithm      | Best Case    | Average Case | Worst Case   | Space    |
|----------------|-------------|--------------|--------------|----------|
| Bubble Sort    | O(n)        | O(n²)        | O(n²)        | O(1)     |
| Selection Sort | O(n²)       | O(n²)        | O(n²)        | O(1)     |
| Insertion Sort | O(n)        | O(n²)        | O(n²)        | O(1)     |
| Merge Sort     | O(n log n)  | O(n log n)   | O(n log n)   | O(n)     |
| Quick Sort     | O(n log n)  | O(n log n)   | O(n²)        | O(log n) |
| Heap Sort      | O(n log n)  | O(n log n)   | O(n log n)   | O(1)     |

---

## 🏗️ Tech Stack

- **React** — component-based UI and state management
- **React Router v6** — client-side routing between Home and Visualizer pages
- **JavaScript Generators** — pure algorithm logic separated from animation engine
- **performance.now()** — high-resolution CPU timing
- **CSS-in-JS** — inline styles with a shared design token system
- **Google Fonts** — JetBrains Mono + Space Grotesk
- **Vite** — fast development build tool

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/AbHaY-PaWaR/sorting-visualizer.git

# Navigate into the project
cd sorting-visualizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
```

---

## 📁 Project Structure
```
src/
├── App.jsx                 # React Router setup
├── HomePage.jsx            # Landing page with algorithm cards
├── SortingVisualizer.jsx   # Main visualizer with animation engine
└── main.jsx                # App entry point
```

---

## 🎨 Color System

| Color  | Meaning             |
|--------|---------------------|
| 🟡 Amber  | Comparing two elements  |
| 🔴 Red    | Swapping two elements   |
| 🟢 Green  | Element in final sorted position |
| 🟣 Purple | Pivot element (Quick Sort) |

---

## 🔑 Key Technical Decisions

**Generator Functions for Algorithm Logic**
Each sorting algorithm is implemented as a JavaScript Generator (`function*`) that yields structured animation steps — `{ type, indices, array }`. This completely decouples the algorithm logic from the rendering layer. The visualizer simply replays these steps at a controlled rate.

**Refs for Animation Control**
Pause, resume, and stop are controlled via `useRef` rather than `useState` because the animation runs inside an async loop. Refs always hold the latest value without causing stale closure issues.

**Pure Algorithm Timing**
Before the animation starts, the generator is fully consumed into an array in one synchronous pass using `[...gen(array)]`. The time for this pass (measured with `performance.now()`) reflects true CPU execution time — no timeouts, no React re-renders, no artificial delays.

---


## 👤 Author

**Abhay Pawar**

- GitHub: [@AbHaY-PaWaR](https://github.com/AbHaY-PaWaR)
- Instagram: [@x___abhay](https://www.instagram.com/x___abhay/)
```

---

## Topics / Tags 
```
react, sorting-algorithms, visualizer, algorithm, bubble-sort, merge-sort,
quick-sort, heap-sort, data-structures, educational, javascript, vite,
react-router, animation, complexity-analysis
