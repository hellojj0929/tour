import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourApp from './pages/TourApp';
import GameIntro from './components/GameIntro';
import BreakoutGame from './components/BreakoutGame';
import MemoryGame from './components/MemoryGame';
import RunnerGame from './components/RunnerGame';
import ColorMatchGame from './components/ColorMatchGame';
import ConstellationGame from './components/ConstellationGame';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Main Tour Application */}
          <Route path="/" element={<TourApp />} />

          {/* Game Section */}
          <Route path="/game" element={<GameIntro />} />
          <Route path="/game/breakout" element={<BreakoutGame />} />
          <Route path="/game/memory" element={<MemoryGame />} />
          <Route path="/game/runner" element={<RunnerGame />} />
          <Route path="/game/colormatch" element={<ColorMatchGame />} />
          <Route path="/game/constellation" element={<ConstellationGame />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;