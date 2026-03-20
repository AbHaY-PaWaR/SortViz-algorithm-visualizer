import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import SortingVisualizer from "./SortingVisualizer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<HomePage />} />
        <Route path="/visualizer" element={<SortingVisualizer />} />
      </Routes>
    </BrowserRouter>
  );
}