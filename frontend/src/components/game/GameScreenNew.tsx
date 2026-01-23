'use client';

import { useState } from 'react';
import { PocketFlyGame } from '../../../features/game/PocketFlyGame';
import { useAppStore } from '../../store/useAppStore';

// Game categories
const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🎮' },
  { id: 'arcade', name: 'Arcade', icon: '👾' },
  { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
  { id: 'sport', name: 'Sport', icon: '⚽' },
  { id: 'action', name: 'Action', icon: '💥' },
  { id: 'casual', name: 'Casual', icon: '🎯' },
];

// Available games
const AVAILABLE_GAMES = [
  { 
    id: 'pocket-fly', 
    name: 'Pocket Fly', 
    icon: '🐦', 
    description: 'Flappy Bird style game - Fly through pipes!', 
    category: 'arcade',
    component: PocketFlyGame
  },
  // Trending games (coming soon)
  { id: 'coral-match', name: 'Coral Match', icon: '🪸', description: 'Match corals to win big rewards!', category: 'puzzle' },
  { id: 'shark-run', name: 'Shark Run', icon: '🦈', description: 'Escape from hungry sharks!', category: 'action' },
  { id: 'treasure-dive', name: 'Treasure Dive', icon: '🏴‍☠️', description: 'Dive deep for hidden treasures', category: 'arcade' },
  { id: 'shell-collector', name: 'Shell Collector', icon: '🐚', description: 'Collect rare shells on the beach', category: 'casual' },
  { id: 'wave-rider', name: 'Wave Rider', icon: '🏄', description: 'Surf the biggest waves!', category: 'sport' },
  { id: 'jellyfish-pop', name: 'Jellyfish Pop', icon: '🎐', description: 'Pop jellyfish bubbles fast!', category: 'puzzle' },
  { id: 'crab-race', name: 'Crab Race', icon: '🦀', description: 'Race crabs on the sandy beach', category: 'sport' },
  { id: 'pearl-hunter', name: 'Pearl Hunter', icon: '🦪', description: 'Find precious pearls underwater', category: 'arcade' },
  { id: 'dolphin-jump', name: 'Dolphin Jump', icon: '🐬', description: 'Jump through hoops with dolphins!', category: 'action' },
  { id: 'starfish-puzzle', name: 'Starfish Puzzle', icon: '⭐', description: 'Solve starfish puzzles', category: 'puzzle' },
  { id: 'whale-watch', name: 'Whale Watch', icon: '🐋', description: 'Spot whales in the ocean', category: 'casual' },
  { id: 'octopus-escape', name: 'Octopus Escape', icon: '🐙', description: 'Help octopus escape the maze', category: 'arcade' },
  { id: 'turtle-race', name: 'Turtle Race', icon: '🐢', description: 'Race sea turtles to the finish', category: 'sport' },
  { id: 'seahorse-sprint', name: 'Seahorse Sprint', icon: '🦑', description: 'Sprint through underwater caves', category: 'action' },
  { id: 'anchor-drop', name: 'Anchor Drop', icon: '⚓', description: 'Drop anchors to catch fish', category: 'casual' },
];

interface GameScreenProps {
  onGameStateChange?: (isPlaying: boolean) => void;
}

function GameScreenNew({ onGameStateChange }: GameScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const filteredGames = selectedCategory === 'all' 
    ? AVAILABLE_GAMES 
    : AVAILABLE_GAMES.filter(game => game.category === selectedCategory);

  const handlePlayGame = (gameId: string) => {
    const game = AVAILABLE_GAMES.find(g => g.id === gameId);
    if (game?.component) {
      setActiveGame(gameId);
      onGameStateChange?.(true);
    } else {
      alert(`${game?.name || 'Game'} is coming soon...`);
    }
  };

  const handleGameEnd = async (score: number, points: number) => {
    try {
      console.log(`🎮 Game ended: Score ${score}, Points ${points}`);
      
      // Import store actions
      const { completeGameSession, addXP } = useAppStore.getState();
      
      // Try to complete game session via backend
      await completeGameSession(score, 60); // 60 seconds default duration
      
      // Add XP locally (backend doesn't handle XP yet)
      const xpGained = Math.floor(score / 2);
      if (xpGained > 0) {
        addXP(xpGained);
      }
      
      console.log(`✅ Game session completed: Score ${score}, Points ${points}, XP ${xpGained}`);
    } catch (error) {
      console.error('❌ Failed to complete game session:', error);
      
      // Fallback to local update
      const { addXP } = useAppStore.getState();
      const xpGained = Math.floor(score / 2);
      if (xpGained > 0) {
        addXP(xpGained);
      }
      console.log(`⚠️ Game completed locally: Score ${score}, Points ${points}, XP ${xpGained}`);
    }
  };

  const handleBackToGameList = () => {
    setActiveGame(null);
    onGameStateChange?.(false);
  };

  // If a game is active, render the game component
  if (activeGame) {
    const game = AVAILABLE_GAMES.find(g => g.id === activeGame);
    if (game?.component) {
      const GameComponent = game.component;
      return (
        <div className="fixed inset-0 w-full h-full bg-black" style={{ zIndex: 9999 }}>
          <GameComponent 
            onGameEnd={handleGameEnd} 
            onBackToMenu={handleBackToGameList}
          />
          
          <style jsx global>{`
            .bottom-navigation-bar,
            nav[role="navigation"],
            .bottom-navigation,
            [data-testid="bottom-nav"],
            footer,
            .navigation-bar {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              z-index: -1 !important;
            }
            
            body {
              overflow: hidden !important;
            }
            
            #__next {
              overflow: hidden !important;
            }
            
            .fixed[style*="bottom"] {
              display: none !important;
            }
          `}</style>
        </div>
      );
    }
  }

  return (
    <div 
      className="flex flex-col hide-scrollbar"
      style={{ 
        paddingTop: 'clamp(16px, 4vw, 24px)', 
        paddingLeft: 'clamp(16px, 4vw, 24px)',
        paddingRight: 'clamp(16px, 4vw, 24px)',
        backgroundColor: 'transparent',
        height: 'calc(100vh - clamp(56px, 14vw, 72px))',
        overflowY: 'auto',
        paddingBottom: 'clamp(80px, 20vw, 120px)'
      }}
    >

      {/* Categories Filter */}
      <section style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }} className="flex-shrink-0">
        <div 
          className="flex hide-scrollbar"
          style={{ 
            overflowX: 'auto', 
            paddingBottom: 'clamp(8px, 2vw, 12px)',
            WebkitOverflowScrolling: 'touch',
            gap: 'clamp(8px, 2vw, 12px)',
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-center whitespace-nowrap transition-all"
              style={{
                background: selectedCategory === cat.id 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#1a1a2e',
                fontSize: 'var(--fs-sm)',
                fontWeight: selectedCategory === cat.id ? '600' : '400',
                padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                borderRadius: 'clamp(16px, 4vw, 24px)',
                boxShadow: selectedCategory === cat.id 
                  ? '0 4px 20px rgba(0, 0, 0, 0.1)' 
                  : '0 2px 10px rgba(0, 0, 0, 0.05)',
              }}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Games Section */}
      <section style={{ marginBottom: 'clamp(24px, 6vw, 32px)' }} className="flex-shrink-0">
        <h2 style={{ color: '#1a1a2e', marginBottom: 'clamp(12px, 3vw, 16px)', fontSize: 'var(--fs-lg)', margin: '0 0 clamp(12px, 3vw, 16px) 0' }} className="font-bold">
          Featured Games
        </h2>
        
        {/* Horizontal Scroll Container */}
        <div 
          className="flex hide-scrollbar"
          style={{ 
            overflowX: 'auto', 
            overflowY: 'hidden',
            paddingBottom: 'clamp(8px, 2vw, 12px)',
            WebkitOverflowScrolling: 'touch',
            gap: 'clamp(12px, 3vw, 16px)',
            scrollBehavior: 'smooth',
            cursor: 'grab',
          }}
          onMouseDown={(e) => {
            const container = e.currentTarget;
            container.style.cursor = 'grabbing';
            let isDown = true;
            let startX = e.pageX - container.offsetLeft;
            let scrollLeft = container.scrollLeft;

            const handleMouseMove = (e: MouseEvent) => {
              if (!isDown) return;
              e.preventDefault();
              const x = e.pageX - container.offsetLeft;
              const walk = (x - startX) * 2;
              container.scrollLeft = scrollLeft - walk;
            };

            const handleMouseUp = () => {
              isDown = false;
              container.style.cursor = 'grab';
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          onWheel={(e) => {
            e.preventDefault();
            const container = e.currentTarget;
            container.scrollLeft += e.deltaY;
          }}
        >
          {AVAILABLE_GAMES.slice(0, 6).map((game, index) => (
            <div
              key={game.id}
              className="flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, 
                  ${index % 4 === 0 ? 'rgba(59, 130, 246, 0.8), rgba(147, 197, 253, 0.6)' : 
                    index % 4 === 1 ? 'rgba(16, 185, 129, 0.8), rgba(110, 231, 183, 0.6)' :
                    index % 4 === 2 ? 'rgba(245, 101, 101, 0.8), rgba(252, 165, 165, 0.6)' :
                    'rgba(168, 85, 247, 0.8), rgba(196, 181, 253, 0.6)'})`,
                backdropFilter: 'blur(20px)',
                borderRadius: 'clamp(16px, 4vw, 20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                width: 'clamp(280px, 70vw, 350px)',
                height: 'clamp(160px, 40vw, 200px)',
                position: 'relative',
              }}
            >
              {/* Background Pattern/Wave */}
              <div 
                style={{
                  position: 'absolute',
                  top: '20%',
                  right: '-10%',
                  width: '60%',
                  height: '60%',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  filter: 'blur(40px)',
                }}
              />
              
              {/* Game Icon - Bottom Left */}
              <div 
                className="absolute"
                style={{
                  bottom: 'clamp(16px, 4vw, 20px)',
                  left: 'clamp(16px, 4vw, 20px)',
                  width: 'clamp(40px, 10vw, 50px)',
                  height: 'clamp(40px, 10vw, 50px)',
                  borderRadius: 'clamp(8px, 2vw, 12px)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(20px, 5vw, 28px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                {game.icon}
              </div>

              {/* Game Title - Center (chỉ tên game, không có mô tả) */}
              <div 
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: 'white',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              >
                <h3 
                  className="font-bold"
                  style={{ 
                    fontSize: 'clamp(24px, 6vw, 32px)', 
                    lineHeight: '1.2',
                  }}
                >
                  {game.name}
                </h3>
              </div>

              {/* Play Button - Bottom Right */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Ngăn event bubble up
                  handlePlayGame(game.id);
                }}
                className="absolute font-bold transition-all hover:scale-105 active:scale-95"
                style={{
                  bottom: 'clamp(16px, 4vw, 20px)',
                  right: 'clamp(16px, 4vw, 20px)',
                  background: game.component 
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                    : 'rgba(156, 163, 175, 0.8)',
                  backdropFilter: 'blur(10px)',
                  color: game.component ? '#1a1a2e' : 'rgba(26, 26, 46, 0.6)',
                  fontSize: 'clamp(14px, 3.5vw, 18px)',
                  boxShadow: game.component 
                    ? '0 4px 16px rgba(255, 200, 0, 0.4)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  padding: 'clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 28px)',
                  borderRadius: 'clamp(12px, 3vw, 16px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  fontWeight: '700',
                }}
              >
                {game.component ? 'PLAY' : 'SOON'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Games Section */}
      <section className="flex-shrink-0">
        <h2 style={{ color: '#1a1a2e', marginBottom: 'clamp(16px, 4vw, 20px)', fontSize: 'var(--fs-lg)', margin: '0 0 clamp(16px, 4vw, 20px) 0' }} className="font-bold">
          {selectedCategory === 'all' ? 'All Games' : `${CATEGORIES.find(c => c.id === selectedCategory)?.name} Games`}
        </h2>

        {/* Games List Container */}
        <div>
          <div className="flex flex-col" style={{ gap: 'clamp(12px, 3vw, 16px)' }}>
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 'clamp(20px, 5vw, 28px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  padding: 'clamp(16px, 4vw, 20px)',
                  gap: 'clamp(12px, 3vw, 16px)',
                  minHeight: 'clamp(80px, 20vw, 100px)',
                }}
              >
                {/* Game Icon */}
                <div 
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 'clamp(48px, 12vw, 64px)',
                    height: 'clamp(48px, 12vw, 64px)',
                    borderRadius: 'clamp(16px, 4vw, 20px)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    fontSize: 'clamp(24px, 6vw, 32px)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {game.icon}
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-0" style={{ paddingRight: 'clamp(8px, 2vw, 12px)' }}>
                  <h3 className="font-bold" style={{ fontSize: 'var(--fs-md)', marginBottom: 'clamp(4px, 1vw, 6px)', color: '#1a1a2e', lineHeight: '1.2' }}>
                    {game.name}
                  </h3>
                  <p 
                    className="truncate"
                    style={{ fontSize: 'var(--fs-sm)', color: 'rgba(26, 26, 46, 0.7)', lineHeight: '1.3' }}
                  >
                    {game.description}
                  </p>
                </div>

                {/* Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn event bubble up
                    handlePlayGame(game.id);
                  }}
                  className="font-bold transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                  style={{
                    background: game.component 
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                      : 'rgba(156, 163, 175, 0.8)',
                    backdropFilter: 'blur(10px)',
                    color: game.component ? '#1a1a2e' : 'rgba(26, 26, 46, 0.6)',
                    fontSize: 'var(--fs-sm)',
                    boxShadow: game.component 
                      ? '0 6px 20px rgba(255, 200, 0, 0.3)'
                      : '0 4px 16px rgba(0, 0, 0, 0.1)',
                    padding: 'clamp(10px, 2.5vw, 14px) clamp(18px, 4.5vw, 24px)',
                    borderRadius: 'clamp(16px, 4vw, 20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {game.component ? 'PLAY' : 'SOON'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default GameScreenNew;