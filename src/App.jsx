import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourApp from './pages/TourApp';
import GameIntro from './components/GameIntro';
import BreakoutGame from './components/BreakoutGame';
import MemoryGame from './components/MemoryGame';
import RunnerGame from './components/RunnerGame';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Tour Application */}
        <Route path="/" element={<TourApp />} />

        {/* Game Section */}
        <Route path="/game" element={<GameIntro />} />
        <Route path="/game/breakout" element={<BreakoutGame />} />
        <Route path="/game/memory" element={<MemoryGame />} />
        <Route path="/game/runner" element={<RunnerGame />} />
      </Routes>
    </Router>
  );
}

export default App;