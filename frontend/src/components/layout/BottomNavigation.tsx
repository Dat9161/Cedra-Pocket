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
    style={{ width: 'clamp(18px, 5vw, 24px)', height: 'clamp(18px, 5vw, 24px)' }}
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
      className="fixed z-50"
      style={{ 
        bottom: 'clamp(10px, 3vw, 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - clamp(12px, 3vw, 18px))',
        maxWidth: 'clamp(300px, 85vw, 360px)'
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Home button floating above */}
      <button
        onClick={() => handleTabClick('home')}
        className="absolute left-1/2 -translate-x-1/2 z-20"
        style={{ top: 'clamp(-12px, -3.5vw, -16px)' }}
        aria-label="Home"
      >
        <div className={`
          rounded-full flex items-center justify-center
          bg-gradient-to-br from-accent-cyan via-cyan-400 to-accent-neon
          shadow-[0_4px_15px_rgba(0,212,255,0.5)]
          transition-all duration-300
          ${activeTab === 'home' ? 'scale-110' : 'hover:scale-105'}
        `}
        style={{ width: 'clamp(40px, 11vw, 52px)', height: 'clamp(40px, 11vw, 52px)' }}
        >
          <div className="text-white drop-shadow-lg">
            <HomeIcon active={activeTab === 'home'} />
          </div>
        </div>
      </button>

      {/* Split nav bars */}
      <div className="flex items-center justify-center" style={{ gap: 'clamp(42px, 12vw, 56px)' }}>
        {/* Left nav section - Quest + Pet */}
        <div 
          className="flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(24px)',
            borderRadius: 'clamp(10px, 3vw, 14px) clamp(18px, 5vw, 24px) clamp(10px, 3vw, 14px) clamp(10px, 3vw, 14px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            height: 'clamp(46px, 12vw, 58px)',
            padding: '0 clamp(4px, 1.5vw, 8px)',
            flex: 1,
          }}
        >
          <div className="flex items-center justify-evenly w-full">
            {/* Quest */}
            <button
              onClick={() => handleTabClick('quest')}
              className={`
                flex flex-col items-center justify-center
                transition-all duration-300 rounded-xl flex-1 relative overflow-hidden
                hover:scale-105 hover:bg-white/30
                ${activeTab === 'quest' ? 'text-cyan-500' : 'text-gray-700 hover:text-cyan-500'}
              `}
              style={{ 
                gap: 'clamp(1px, 0.3vw, 2px)', 
                padding: 'clamp(3px, 0.8vw, 5px) clamp(4px, 1vw, 8px)',
                ...(activeTab === 'quest' ? { textShadow: '0 0 10px rgba(0,212,255,0.8)' } : {}) 
              }}
              aria-label="Quest"
            >
              <div className="flex items-center justify-center" style={{ width: 'clamp(20px, 5.5vw, 26px)', height: 'clamp(20px, 5.5vw, 26px)' }}>
                <img src="/icons/quest1.PNG" alt="Quest" style={{ width: 'clamp(20px, 5.5vw, 26px)', height: 'clamp(20px, 5.5vw, 26px)', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: 'clamp(9px, 2.5vw, 11px)' }} className="font-semibold">Quest</span>
              {activeTab === 'quest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-cyan-500 rounded-full" style={{ width: 'clamp(14px, 4vw, 18px)', height: 'clamp(2px, 0.6vw, 3px)' }} />}
            </button>

            {/* Pet */}
            <button
              onClick={() => handleTabClick('pet')}
              className={`
                flex flex-col items-center justify-center
                transition-all duration-300 rounded-xl flex-1 relative overflow-hidden
                hover:scale-105 hover:bg-white/30
                ${activeTab === 'pet' ? 'text-cyan-500' : 'text-gray-700 hover:text-cyan-500'}
              `}
              style={{ 
                gap: 'clamp(1px, 0.3vw, 2px)', 
                padding: 'clamp(3px, 0.8vw, 5px) clamp(4px, 1vw, 8px)',
                ...(activeTab === 'pet' ? { textShadow: '0 0 10px rgba(0,212,255,0.8)' } : {}) 
              }}
              aria-label="Pet"
            >
              <div className="flex items-center justify-center" style={{ width: 'clamp(20px, 5.5vw, 26px)', height: 'clamp(20px, 5.5vw, 26px)' }}>
                <img src="/icons/pet.png" alt="Pet" style={{ width: 'clamp(20px, 5.5vw, 26px)', height: 'clamp(20px, 5.5vw, 26px)', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: 'clamp(9px, 2.5vw, 11px)' }} className="font-semibold">Pet</span>
              {activeTab === 'pet' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-cyan-500 rounded-full" style={{ width: 'clamp(14px, 4vw, 18px)', height: 'clamp(2px, 0.6vw, 3px)' }} />}
            </button>
          </div>
        </div>

        {/* Right nav section - Wallet + Game */}
        <div 
          className="flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(24px)',
            borderRadius: 'clamp(18px, 5vw, 24px) clamp(10px, 3vw, 14px) clamp(10px, 3vw, 14px) clamp(10px, 3vw, 14px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            height: 'clamp(46px, 12vw, 58px)',
            padding: '0 clamp(4px, 1.5vw, 8px)',
            flex: 1,
          }}
        >
          <div className="flex items-center justify-evenly w-full">
            {/* Wallet */}
            <button
              onClick={() => handleTabClick('wallet')}
              className={`
                flex flex-col items-center justify-center
                transition-all duration-300 rounded-xl flex-1 relative overflow-hidden
                hover:scale-105 hover:bg-white/30
                ${activeTab === 'wallet' ? 'text-cyan-500' : 'text-gray-700 hover:text-cyan-500'}
              `}
              style={{ 
                gap: 'clamp(1px, 0.3vw, 2px)', 
                padding: 'clamp(3px, 0.8vw, 5px) clamp(4px, 1vw, 8px)',
                ...(activeTab === 'wallet' ? { textShadow: '0 0 10px rgba(0,212,255,0.8)' } : {}) 
              }}
              aria-label="Wallet"
            >
              <div className="flex items-center justify-center" style={{ width: 'clamp(20px, 5.5vw, 26px)', height: 'clamp(20px, 5.5vw, 26px)' }}>
                <img src="/icons/wallet.PNG" alt="Wallet" style={{ width: 'clamp(20px, 5.5vw, 26px)', height: 'clamp(20px, 5.5vw, 26px)', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: 'clamp(9px, 2.5vw, 11px)' }} className="font-semibold">Wallet</span>
              {activeTab === 'wallet' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-cyan-500 rounded-full" style={{ width: 'clamp(14px, 4vw, 18px)', height: 'clamp(2px, 0.6vw, 3px)' }} />}
            </button>

            {/* Game */}
            <button
              onClick={() => handleTabClick('game')}
              className={`
                flex flex-col items-center justify-center
                transition-all duration-300 rounded-xl flex-1 relative overflow-hidden
                hover:scale-105 hover:bg-white/30
                ${activeTab === 'game' ? 'text-cyan-500' : 'text-gray-700 hover:text-cyan-500'}
              `}
              style={{ 
                gap: 'clamp(1px, 0.3vw, 2px)', 
                padding: 'clamp(3px, 0.8vw, 5px) clamp(4px, 1vw, 8px)',
                ...(activeTab === 'game' ? { textShadow: '0 0 10px rgba(0,212,255,0.8)' } : {}) 
              }}
              aria-label="Game"
            >
              <div className="flex items-center justify-center" style={{ width: 'clamp(20px, 5.5vw, 26px)', height: 'clamp(20px, 5.5vw, 26px)' }}>
                <img src="/icons/game.png" alt="Game" style={{ width: 'clamp(20px, 5.5vw, 26px)', height: 'clamp(20px, 5.5vw, 26px)', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: 'clamp(9px, 2.5vw, 11px)' }} className="font-semibold">Game</span>
              {activeTab === 'game' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-cyan-500 rounded-full" style={{ width: 'clamp(14px, 4vw, 18px)', height: 'clamp(2px, 0.6vw, 3px)' }} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default BottomNavigation;
