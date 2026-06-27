import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { CHARACTER_DEFINITIONS } from './types';
import { socketService } from './services/socketService';
import { AnimatedBackground } from './components/ui/AnimatedBackground';
import { LandingPage } from './components/landing/LandingPage';
import { WordleGame } from './components/wordle/WordleGame';
import { Lobby } from './components/lobby/Lobby';
import { GameBoard } from './components/game/GameBoard';
import { AdminPanel } from './components/admin/AdminPanel';
import { GamesHub } from './components/hub/GamesHub';

function App() {
  useEffect(() => {
    // Fetch dynamic character configs (including custom art)
    fetch('/api/characters')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          Object.assign(CHARACTER_DEFINITIONS, data);
        }
      })
      .catch(() => {});

    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a1a]">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen">
          <Routes>
            <Route path="/" element={<GamesHub />} />
            <Route path="/coup" element={<LandingPage />} />
            <Route path="/coup/lobby" element={<Lobby />} />
            <Route path="/coup/game/:roomId" element={<GameBoard />} />
            <Route path="/wordle" element={<WordleGame />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
