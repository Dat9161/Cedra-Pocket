'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore, useUser, useIsLoading, useError, NavigationTab } from '../store/useAppStore';
import { HeroSection } from '../components/home';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { LoadingSpinner } from '../components/shared';
import { QuestScreen } from '../components/quest';
import { SpinModal } from '../components/spin';
import { WalletScreen } from '../components/wallet';
import { GameScreen } from '../components/game';
import { PetScreen } from '../components/pet/PetScreen';
import { useTelegram } from '../components/providers';
import { useSpinsLeft } from '../store/useAppStore';

// Rank tiers based on points
const RANK_TIERS = [
  { name: 'Shrimp', icon: '/icons/Shrimp-Bronze.png', minPoints: 0, bonus: 0, color: '#CD7F32' },
  { name: 'Fish', icon: '/icons/Fish-Silver.png', minPoints: 1000, bonus: 0.1, color: '#C0C0C0' },
  { name: 'Dolphin', icon: '/icons/Dolphin-Gold.png', minPoints: 5000, bonus: 0.3, color: '#FFD700' },
  { name: 'Shark', icon: '/icons/Shark-Emerald.png', minPoints: 20000, bonus: 0.5, color: '#50C878' },
  { name: 'Whale', icon: '/icons/Whale-Diamond.png', minPoints: 100000, bonus: 1, color: '#B9F2FF' },
  { name: 'Leviathan', icon: '/icons/Leviathan-Obsidian.png', minPoints: 500000, bonus: 2, color: '#3D3D3D' },
];

// Get user rank tier based on points
function getUserRankTier(points: number) {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (points >= RANK_TIERS[i].minPoints) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export default function HomePage() {
  const user = useUser();
  const isLoading = useIsLoading();
  const error = useError();
  const { activeTab, setActiveTab, setUser, setError } = useAppStore();
  const { isInitialized, isAvailable } = useTelegram();
  const [isAppReady, setIsAppReady] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const spinsLeft = useSpinsLeft();

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs: NavigationTab[] = ['home', 'quest', 'pet', 'wallet', 'game'];
      if (validTabs.includes(hash as NavigationTab)) {
        setActiveTab(hash as NavigationTab);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveTab]);

  const handleTabChange = useCallback((tab: NavigationTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  }, [setActiveTab]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user && !isAvailable) {
      console.log('⚠️ Telegram not available, waiting for authentication...');
    }
    setIsAppReady(true);
  }, [isInitialized, isAvailable, user, setUser]);

  if (isLoading || !isInitialized || !isAppReady) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center p-4">
        <div className="glass-card p-6 text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="btn-gradient-primary px-6 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex-1 flex flex-col px-3" style={{ paddingTop: 'clamp(6px, 2vw, 10px)' }}>
            {/* Page Title - WHALE */}
            <div 
              className="text-center"
              style={{ 
                height: 'clamp(50px, 14vw, 70px)', 
                marginBottom: 'clamp(2px, 1vw, 4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src="/whale.png" 
                alt="Whale" 
                style={{ 
                  height: 'clamp(50px, 14vw, 70px)',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(56,189,248,0.4))',
                  animation: 'waveLeftRight 2s ease-in-out infinite'
                }}
              />
            </div>

            {/* Top Bar - Glass Container with top notch */}
            <div className="relative mb-2" style={{ marginLeft: 'clamp(2px, 1vw, 4px)', marginRight: 'clamp(2px, 1vw, 4px)' }}>
              {/* SVG for clip-path definition - top center notch like inverted trapezoid */}
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <clipPath id="notchClipTop" clipPathUnits="objectBoundingBox">
                    <path d="M 0 0.3 Q 0 0, 0.05 0 L 0.25 0 Q 0.28 0, 0.3 0.1 L 0.35 0.4 Q 0.37 0.45, 0.4 0.45 L 0.6 0.45 Q 0.63 0.45, 0.65 0.4 L 0.7 0.1 Q 0.72 0, 0.75 0 L 0.95 0 Q 1 0, 1 0.3 L 1 1 L 0 1 Z"/>
                  </clipPath>
                </defs>
              </svg>

              {/* Avatar - top left */}
              <div className="absolute z-20" style={{ top: 'clamp(14px, 4vw, 20px)', left: 'clamp(8px, 2.5vw, 12px)' }}>
                <button 
                  className="relative flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    width: 'clamp(36px, 10vw, 46px)',
                    height: 'clamp(28px, 7.5vw, 36px)',
                    borderRadius: '8px 20px 8px 8px',
                    background: 'linear-gradient(135deg, rgba(0,180,220,0.6) 0%, rgba(100,200,230,0.4) 50%, rgba(255,255,255,0.3) 100%)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 10px rgba(0,180,220,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
                  }}
                >
                  <span style={{ fontSize: 'clamp(14px, 4vw, 18px)' }}>👤</span>
                </button>
              </div>

              {/* Username - center */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: 'clamp(12px, 3.5vw, 18px)' }}>
                <span style={{ fontSize: 'clamp(12px, 3.5vw, 15px)' }} className="font-bold text-gray-800">{user.username}</span>
              </div>

              {/* Notification bell button - top right */}
              <div className="absolute z-20" style={{ top: 'clamp(14px, 4vw, 20px)', right: 'clamp(8px, 2.5vw, 12px)' }}>
                <button 
                  className="relative flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    width: 'clamp(36px, 10vw, 46px)',
                    height: 'clamp(28px, 7.5vw, 36px)',
                    borderRadius: '20px 8px 8px 8px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,220,100,0.4) 50%, rgba(255,180,50,0.6) 100%)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 10px rgba(255,180,50,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
                  }}
                >
                  <img 
                    src="/icons/thongbao.PNG" 
                    alt="Notification" 
                    style={{ width: 'clamp(18px, 5vw, 24px)', height: 'clamp(18px, 5vw, 24px)', objectFit: 'contain' }}
                  />
                  {/* Notification badge */}
                  <div 
                    className="absolute flex items-center justify-center"
                    style={{
                      bottom: '1px',
                      right: '1px',
                      width: 'clamp(12px, 3.2vw, 15px)',
                      height: 'clamp(12px, 3.2vw, 15px)',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                      border: '1.5px solid white',
                      fontSize: 'clamp(7px, 2vw, 9px)',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                  >
                    3
                  </div>
                </button>
              </div>

              {/* Glass background */}
              <div 
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 'clamp(10px, 3vw, 14px)',
                  clipPath: 'url(#notchClipTop)',
                  padding: 'clamp(8px, 2vw, 10px)',
                  minHeight: 'clamp(56px, 15vw, 72px)',
                  marginTop: 'clamp(8px, 2.5vw, 12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.5)'
                }}
              >
                {/* Empty top row - space for notch */}
                <div style={{ height: 'clamp(14px, 4vw, 20px)' }} />

                {/* LVL + EXP Bar - Inside glass at bottom */}
                <div className="px-2">
                  <div className="text-center mb-1">
                    <span style={{ fontSize: 'clamp(10px, 2.8vw, 12px)' }} className="text-gray-600 font-semibold">LVL {user.level}/10</span>
                  </div>
                  <div 
                    className="w-full rounded-full overflow-hidden"
                    style={{ 
                      height: 'clamp(3px, 1vw, 5px)',
                      background: 'rgba(100,150,200,0.3)'
                    }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(user.currentXP / user.requiredXP) * 100}%`,
                        background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Big Coin Display */}
            <div className="flex justify-center items-center" style={{ marginTop: 'clamp(4px, 1vw, 6px)', marginBottom: 'clamp(4px, 1vw, 6px)' }}>
              <div className="flex items-center" style={{ gap: 'clamp(6px, 1.5vw, 8px)' }}>
                <span style={{ fontSize: 'clamp(22px, 6vw, 28px)' }}>🪙</span>
                <span 
                  style={{ 
                    fontSize: 'clamp(22px, 6vw, 28px)', 
                    fontWeight: '800',
                    color: '#1a1a2e',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {user.tokenBalance.toLocaleString('fr-FR').replace(/\s/g, ' ')}
                </span>
              </div>
            </div>

            {/* Left Side Buttons - Vertical below coin */}
            <div className="flex flex-col" style={{ marginLeft: 'clamp(2px, 1vw, 4px)', zIndex: 10, gap: 'clamp(4px, 1vw, 6px)' }}>
              <button 
                onClick={() => setShowRankModal(true)}
                className="flex items-center transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #7DD3FC, #38BDF8)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 2px 8px rgba(56,189,248,0.3)',
                  width: 'clamp(72px, 20vw, 90px)',
                  height: 'clamp(26px, 7vw, 32px)',
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  paddingLeft: 'clamp(6px, 1.5vw, 8px)',
                  gap: 'clamp(4px, 1vw, 6px)'
                }}
              >
                <img src={getUserRankTier(user.tokenBalance).icon} alt="Rank" style={{ width: 'clamp(16px, 4.5vw, 20px)', height: 'clamp(16px, 4.5vw, 20px)', objectFit: 'contain' }} />
                <span className="text-gray-700 font-bold" style={{ fontSize: 'clamp(10px, 2.8vw, 12px)' }}>
                  {getUserRankTier(user.tokenBalance).name}
                </span>
              </button>

              {/* Spin Button */}
              <button 
                onClick={() => setShowSpinModal(true)}
                className="flex items-center transition-all hover:scale-105 relative"
                style={{
                  background: 'linear-gradient(135deg, #FECACA, #FCA5A5)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 2px 8px rgba(252,165,165,0.3)',
                  width: 'clamp(72px, 20vw, 90px)',
                  height: 'clamp(26px, 7vw, 32px)',
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  paddingLeft: 'clamp(6px, 1.5vw, 8px)',
                  gap: 'clamp(4px, 1vw, 6px)'
                }}
              >
                <img src="/icons/spin.PNG" alt="Spin" style={{ width: 'clamp(16px, 4.5vw, 20px)', height: 'clamp(16px, 4.5vw, 20px)', objectFit: 'contain' }} />
                <span className="text-gray-700 font-bold" style={{ fontSize: 'clamp(10px, 2.8vw, 12px)' }}>Spin</span>
                {spinsLeft > 0 && (
                  <div 
                    className="absolute -top-1 -right-1 flex items-center justify-center"
                    style={{
                      width: 'clamp(14px, 3.5vw, 18px)',
                      height: 'clamp(14px, 3.5vw, 18px)',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F87171, #EF4444)',
                      border: '1.5px solid white',
                      fontSize: 'clamp(8px, 2.2vw, 10px)',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                  >
                    {spinsLeft}
                  </div>
                )}
              </button>

              {/* Quest Button */}
              <button 
                onClick={() => handleTabChange('quest')}
                className="flex items-center transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #D9F99D, #BEF264)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 2px 8px rgba(190,242,100,0.3)',
                  width: 'clamp(72px, 20vw, 90px)',
                  height: 'clamp(26px, 7vw, 32px)',
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  paddingLeft: 'clamp(6px, 1.5vw, 8px)',
                  gap: 'clamp(4px, 1vw, 6px)'
                }}
              >
                <span style={{ fontSize: 'clamp(14px, 4vw, 18px)', lineHeight: 1, width: 'clamp(16px, 4.5vw, 20px)', textAlign: 'center' }}>🎁</span>
                <span className="text-gray-700 font-bold" style={{ fontSize: 'clamp(10px, 2.8vw, 12px)' }}>Quest</span>
              </button>
            </div>            {/* Hero Section */}
            <div className="flex-1 flex items-center justify-center">
              <HeroSection mascotImageUrl="/mascot.png" showAnimation={true} />
            </div>
          </div>
        );

      case 'quest':
        return <QuestScreen />;
      case 'pet':
        return <PetScreen />;
      case 'wallet':
        return <WalletScreen />;
      case 'game':
        return <GameScreen />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-secondary">Screen not found</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen-safe flex flex-col pb-24 safe-area-inset-top relative">
      <main className="flex-1 flex flex-col px-6" style={{ zIndex: 2 }}>{renderActiveScreen()}</main>
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Rank Progress Modal */}
      {showRankModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowRankModal(false)}
        >
          <div 
            className="w-full max-w-sm overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #2d4a6f 0%, #1e3a5f 100%)',
              borderRadius: '28px',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 text-center">
              {/* Close button */}
              <button
                onClick={() => setShowRankModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <span className="text-white/60 text-lg">✕</span>
              </button>

              <div className="text-cyan-400 text-xs font-semibold tracking-widest mb-4">YOUR RANK</div>
              
              {/* Current Rank Display */}
              <div className="flex justify-center">
                <img 
                  src={getUserRankTier(user?.tokenBalance || 0).icon} 
                  alt="Rank" 
                  style={{ width: '80px', height: '80px', objectFit: 'contain' }} 
                />
              </div>
              
              <div className="text-white font-bold text-2xl mt-2">
                {getUserRankTier(user?.tokenBalance || 0).name}
              </div>
              <div className="text-cyan-400 text-base mt-1">
                {(user?.tokenBalance || 0).toLocaleString()} points
              </div>
            </div>

            {/* Progress Section */}
            {(() => {
              const currentPoints = user?.tokenBalance || 0;
              const currentTier = getUserRankTier(currentPoints);
              const currentTierIndex = RANK_TIERS.findIndex(t => t.name === currentTier.name);
              const nextTier = RANK_TIERS[currentTierIndex + 1];
              
              if (!nextTier) {
                return (
                  <div className="mx-5 mb-4 p-4 rounded-2xl text-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                    <span className="text-2xl">👑</span>
                    <span className="text-yellow-400 font-bold ml-2">MAX RANK ACHIEVED!</span>
                  </div>
                );
              }
              
              const progressPercent = ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100;
              
              return (
                <div className="mb-4 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', marginLeft: '14px', marginRight: '14px' }}>
                  {/* From -> To with progress bar in middle */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center" style={{ marginRight: '12px' }}>
                      <img src={currentTier.icon} alt={currentTier.name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                      <span className="text-white/60 text-xs mt-1">{currentTier.name}</span>
                    </div>
                    
                    {/* Progress Bar with percentage inside */}
                    <div className="flex-1">
                      <div 
                        className="w-full h-6 rounded-full overflow-hidden relative"
                        style={{ background: 'rgba(0,0,0,0.4)' }}
                      >
                        <div 
                          className="h-full rounded-full transition-all duration-700"
                          style={{ 
                            width: `${Math.min(progressPercent, 100)}%`,
                            background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                          }}
                        />
                        <span 
                          className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                        >
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center opacity-60" style={{ marginLeft: '12px' }}>
                      <img src={nextTier.icon} alt={nextTier.name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                      <span className="text-white/60 text-xs mt-1">{nextTier.name}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* All Ranks Grid */}
            <div className="mx-6 mb-6" style={{ marginTop: '24px' }}>
              <div className="text-white/40 text-xs font-semibold tracking-wider mb-3">ALL RANKS</div>
              <div className="grid grid-cols-3 gap-3">
                {RANK_TIERS.map((tier) => {
                  const currentTier = getUserRankTier(user?.tokenBalance || 0);
                  const isCurrentTier = tier.name === currentTier.name;
                  const isUnlocked = (user?.tokenBalance || 0) >= tier.minPoints;
                  
                  return (
                    <div 
                      key={tier.name}
                      className="flex flex-col items-center p-3 rounded-2xl"
                      style={{ 
                        background: isCurrentTier 
                          ? `linear-gradient(135deg, ${tier.color}40, ${tier.color}20)`
                          : 'rgba(255,255,255,0.03)',
                        border: isCurrentTier 
                          ? `2px solid ${tier.color}` 
                          : '1px solid rgba(255,255,255,0.08)',
                        opacity: isUnlocked ? 1 : 0.35,
                      }}
                    >
                      <img src={tier.icon} alt={tier.name} style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                      <span className="text-white text-xs font-semibold mt-1">{tier.name}</span>
                      <span className="text-white/40 text-[10px]">
                        {tier.minPoints >= 1000 ? `${tier.minPoints/1000}K` : tier.minPoints}
                      </span>
                      {tier.bonus > 0 && (
                        <span className="text-green-400 text-[10px] font-medium">
                          +{tier.bonus}% bonus
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spin Modal */}
      <SpinModal isOpen={showSpinModal} onClose={() => setShowSpinModal(false)} />
    </div>
  );
}
