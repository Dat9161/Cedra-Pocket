'use client';

import { telegramService } from '../../services/telegram.service';
import type { NavigationTab } from '../../store/useAppStore';

export interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

/**
 * Icon component for Home tab
 */
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const handleTabClick = (tab: NavigationTab) => {
    if (tab !== activeTab) {
      telegramService.triggerHapticFeedback('light');
      onTabChange(tab);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[360px] px-4 safe-area-inset-bottom"
      style={{ paddingBottom: '12px' }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Home button floating above */}
      <button
        onClick={() => handleTabClick('home')}
        className="absolute left-1/2 -translate-x-1/2 -top-5 z-20"
        aria-label="Home"
      >
        <div className={`
          rounded-full flex items-center justify-center
          bg-gradient-to-br from-accent-cyan via-cyan-400 to-accent-neon
          shadow-[0_8px_30px_rgba(0,212,255,0.6),0_4px_15px_rgba(0,191,255,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)]
          transition-all duration-300
          ${activeTab === 'home' ? 'scale-110' : 'hover:scale-105'}
        `}
        style={{ width: '64px', height: '64px' }}
        >
          <div className="text-white drop-shadow-lg">
            <HomeIcon active={activeTab === 'home'} />
          </div>
        </div>
      </button>

      {/* Split nav bars */}
      <div className="flex items-center justify-center gap-2">
        {/* Left nav section */}
        <div 
          className="flex-1 flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(24px)',
            borderRadius: '24px 45px 24px 24px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            height: '60px',
            padding: '0 8px'
          }}
        >
          <div className="flex items-center justify-evenly w-full">
            {/* Quest */}
            <button
              onClick={() => handleTabClick('quest')}
              className={`
                flex flex-col items-center justify-center px-4 py-2
                transition-all duration-300 rounded-xl flex-1 relative overflow-hidden
                hover:scale-105 hover:bg-white/30
                ${activeTab === 'quest' ? 'text-cyan-500' : 'text-gray-700 hover:text-cyan-500'}
              `}
              style={{ gap: '2px', ...(activeTab === 'quest' ? { textShadow: '0 0 10px rgba(0,212,255,0.8)' } : {}) }}
              aria-label="Quest"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/icons/quest1.PNG" alt="Quest" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              </div>
              <span className="text-sm font-semibold">Quest</span>
              {activeTab === 'quest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-500 rounded-full" />}
            </button>

            {/* Spin */}
            <button
              onClick={() => handleTabClick('spin')}
              className={`
                flex flex-col items-center justify-center px-4 py-2
                transition-all duration-300 rounded-xl flex-1 relative overflow-hidden
                hover:scale-105 hover:bg-white/30
                ${activeTab === 'spin' ? 'text-cyan-500' : 'text-gray-700 hover:text-cyan-500'}
              `}
              style={{ gap: '2px', ...(activeTab === 'spin' ? { textShadow: '0 0 10px rgba(0,212,255,0.8)' } : {}) }}
              aria-label="Spin"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/icons/spin.PNG" alt="Spin" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              </div>
              <span className="text-sm font-semibold">Spin</span>
              {activeTab === 'spin' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-500 rounded-full" />}
            </button>
          </div>
        </div>

        {/* Center spacer for Home button */}
        <div style={{ width: '60px', flexShrink: 0 }} />

        {/* Right nav section */}
        <div 
          className="flex-1 flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(24px)',
            borderRadius: '45px 24px 24px 24px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            height: '60px',
            padding: '0 8px'
          }}
        >
          <div className="flex items-center justify-evenly w-full">
            {/* Wallet */}
            <button
              onClick={() => handleTabClick('wallet')}
              className={`
                flex flex-col items-center justify-center px-4 py-2
                transition-all duration-300 rounded-xl flex-1 relative overflow-hidden
                hover:scale-105 hover:bg-white/30
                ${activeTab === 'wallet' ? 'text-cyan-500' : 'text-gray-700 hover:text-cyan-500'}
              `}
              style={{ gap: '2px', ...(activeTab === 'wallet' ? { textShadow: '0 0 10px rgba(0,212,255,0.8)' } : {}) }}
              aria-label="Wallet"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/icons/wallet.PNG" alt="Wallet" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              </div>
              <span className="text-sm font-semibold">Wallet</span>
              {activeTab === 'wallet' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-500 rounded-full" />}
            </button>

            {/* Game */}
            <button
              onClick={() => handleTabClick('game')}
              className={`
                flex flex-col items-center justify-center px-4 py-2
                transition-all duration-300 rounded-xl flex-1 relative overflow-hidden
                hover:scale-105 hover:bg-white/30
                ${activeTab === 'game' ? 'text-cyan-500' : 'text-gray-700 hover:text-cyan-500'}
              `}
              style={{ gap: '2px', ...(activeTab === 'game' ? { textShadow: '0 0 10px rgba(0,212,255,0.8)' } : {}) }}
              aria-label="Game"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/icons/game.png" alt="Game" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              </div>
              <span className="text-sm font-semibold">Game</span>
              {activeTab === 'game' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-500 rounded-full" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default BottomNavigation;
