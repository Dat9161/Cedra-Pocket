'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore, useUser, useIsLoading, useError, NavigationTab, usePet, useGameSystemActions, useEnergy } from '../store/useAppStore';
import { HeroSection } from '../components/home';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { LoadingScreen } from '../components/shared';
import { QuestScreen } from '../components/quest';
import { SpinModal } from '../components/spin';
import { AppScreen } from '../components/app';
import GameScreenNew from '../components/game/GameScreenNew';
import { PetScreen } from '../components/pet/PetScreen';
import { useTelegram } from '../components/providers';
import { useSpinsLeft } from '../store/useAppStore';
import { RankUpModal } from '../components/shared/RankUpModal';

// Rank tiers based on points - Updated system
const RANK_TIERS = [
  { name: 'Rank 1', icon: '/icons/Shrimp-Bronze.png', minPoints: 0, reward: 0, color: '#CD7F32' },
  { name: 'Rank 2', icon: '/icons/Fish-Silver.png', minPoints: 10000, reward: 1000, color: '#C0C0C0' },
  { name: 'Rank 3', icon: '/icons/Dolphin-Gold.png', minPoints: 25000, reward: 2000, color: '#FFD700' },
  { name: 'Rank 4', icon: '/icons/Shark-Emerald.png', minPoints: 45000, reward: 3000, color: '#50C878' },
  { name: 'Rank 5', icon: '/icons/Whale-Diamond.png', minPoints: 60000, reward: 4000, color: '#B9F2FF' },
  { name: 'Rank 6', icon: '/icons/Leviathan-Obsidian.png', minPoints: 75000, reward: 5000, color: '#3D3D3D' },
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
  const pet = usePet();
  const energy = useEnergy();
  const isLoading = useIsLoading();
  const error = useError();
  const { activeTab, setActiveTab, setError, setEnergy, rankUpNotification, hideRankUpNotification } = useAppStore();
  const { loadGameDashboard } = useGameSystemActions();
  const { isInitialized, isAvailable } = useTelegram();
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [showRankModal, setShowRankModal] = useState(false);
  const [displayRankIndex, setDisplayRankIndex] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gameDataLoaded, setGameDataLoaded] = useState(false);
  const [isPlayingGame, setIsPlayingGame] = useState(false);

  // Force reset energy if it's showing wrong values
  useEffect(() => {
    if (energy.maxEnergy === 100 || energy.currentEnergy > 10) {
      console.log('🔄 Resetting energy from', energy, 'to correct values');
      setEnergy({
        currentEnergy: 10,
        maxEnergy: 10,
        lastUpdate: Date.now(),
      });
    }
  }, [energy, setEnergy]);

  // Refresh balance function
  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Refresh game dashboard which includes user data
      await loadGameDashboard();
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Minimum animation time
    }
  };
  const [showSpinModal, setShowSpinModal] = useState(false);
  const spinsLeft = useSpinsLeft();

  // Set initial rank index when modal opens
  useEffect(() => {
    if (showRankModal && user) {
      const currentTier = getUserRankTier(user.tokenBalance);
      const currentIndex = RANK_TIERS.findIndex(tier => tier.name === currentTier.name);
      setDisplayRankIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [showRankModal, user]);

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
  }, []); // Empty dependency - setActiveTab is stable

  const handleTabChange = useCallback((tab: NavigationTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  }, []); // Empty dependency - setActiveTab is stable

  useEffect(() => {
    if (!isInitialized) return;
    if (!user && !isAvailable) {
      console.log('⚠️ Telegram not available, waiting for authentication...');
    }
    setIsAppReady(true);
  }, [isInitialized, isAvailable, user]); // Removed setUser dependency

  // Load game dashboard when user is authenticated
  useEffect(() => {
    const initializeGameData = async () => {
      if (!user || gameDataLoaded) return;
      
      try {
        console.log('🎮 Initializing game data on app startup...');
        await loadGameDashboard();
        setGameDataLoaded(true);
        console.log('✅ Game data initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize game data:', error);
        // Don't block the app if game data fails to load
      }
    };

    initializeGameData();
  }, [user, gameDataLoaded]); // Removed loadGameDashboard dependency

  // Hide loading screen when user data is ready
  useEffect(() => {
    if (user && isAppReady && showLoadingScreen) {
      // Add small delay for smooth transition
      const timer = setTimeout(() => {
        setShowLoadingScreen(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [user, isAppReady, showLoadingScreen]);

  // Show loading screen while app is initializing or user not ready
  if (isLoading || !isInitialized || !isAppReady || showLoadingScreen) {
    return <LoadingScreen />;
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
    return <LoadingScreen />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex-1 flex flex-col h-full" style={{ paddingTop: 'clamp(4px, 1vw, 6px)', position: 'relative', zIndex: 1 }}>
            {/* Top Bar - Glass Container with top notch */}
            <div className="relative mb-2" style={{ marginLeft: 'clamp(24px, 6vw, 32px)', marginRight: 'clamp(24px, 6vw, 32px)', zIndex: 10 }}>
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
                  className="relative flex items-center justify-center transition-all hover:scale-105 overflow-hidden"
                  style={{
                    width: 'clamp(36px, 10vw, 46px)',
                    height: 'clamp(28px, 7.5vw, 36px)',
                    borderRadius: '8px 20px 8px 8px',
                    background: 'linear-gradient(135deg, rgba(0,180,220,0.6) 0%, rgba(100,200,230,0.4) 50%, rgba(255,255,255,0.3) 100%)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 10px rgba(0,180,220,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
                  }}
                >
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Avatar"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 'clamp(14px, 4vw, 18px)' }}>👤</span>
                  )}
                </button>
              </div>

              {/* Rank - next to avatar */}
              <div className="absolute z-20" style={{ top: 'clamp(14px, 4vw, 20px)', left: 'clamp(52px, 13vw, 66px)' }}>
                <button 
                  onClick={() => setShowRankModal(true)}
                  className="flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    width: 'clamp(28px, 7vw, 36px)',
                    height: 'clamp(28px, 7vw, 36px)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <img 
                    src={getUserRankTier(user.tokenBalance).icon} 
                    alt="Rank" 
                    style={{ 
                      width: 'clamp(24px, 6vw, 32px)', 
                      height: 'clamp(24px, 6vw, 32px)', 
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }} 
                  />
                </button>
              </div>

              {/* Points display - top right */}
              <div className="absolute z-20" style={{ top: 'clamp(14px, 4vw, 20px)', right: 'clamp(8px, 2.5vw, 12px)' }}>
                {/* Points Display */}
                <div 
                  className="flex items-center transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,220,100,0.4) 50%, rgba(255,180,50,0.6) 100%)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 10px rgba(255,180,50,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                    borderRadius: '20px 8px 8px 8px',
                    padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)',
                    gap: 'clamp(4px, 1vw, 6px)'
                  }}
                >
                  <span style={{ fontSize: 'var(--fs-sm)' }}>🪙</span>
                  <span 
                    style={{ 
                      fontSize: 'var(--fs-sm)', 
                      fontWeight: '700',
                      color: '#1a1a2e'
                    }}
                  >
                    {user.tokenBalance.toLocaleString('fr-FR').replace(/\s/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Username - center */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: 'clamp(12px, 3.5vw, 18px)' }}>
                <span style={{ fontSize: 'var(--fs-sm)' }} className="font-bold text-gray-800">{user.username}</span>
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

                {/* Rank Progress Bar - Inside glass at bottom */}
                <div className="px-2">
                  <div className="text-center mb-1">
                    <span style={{ fontSize: 'var(--fs-sm)' }} className="text-gray-600 font-semibold">
                      RANK {(() => {
                        const currentRank = getUserRankTier(user.tokenBalance);
                        const currentIndex = RANK_TIERS.findIndex(tier => tier.name === currentRank.name);
                        return `${currentIndex + 1}/${RANK_TIERS.length}`;
                      })()}
                    </span>
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
                        width: `${(() => {
                          const currentRank = getUserRankTier(user.tokenBalance);
                          const currentIndex = RANK_TIERS.findIndex(tier => tier.name === currentRank.name);
                          const nextRank = RANK_TIERS[currentIndex + 1];
                          
                          if (!nextRank) return 100; // Max rank reached
                          
                          const progress = ((user.tokenBalance - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100;
                          return Math.min(Math.max(progress, 0), 100);
                        })()}%`,
                        background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Balance Section */}
            <div 
              className="flex justify-center mb-4"
              style={{ 
                marginTop: 'clamp(8px, 2vw, 12px)',
                paddingLeft: '24px',
                paddingRight: '24px',
              }}
            >
              {/* Total Balance Card */}
              <div 
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.25) 100%)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.5)',
                  width: '100%',
                  maxWidth: 'clamp(280px, 75vw, 360px)',
                  padding: 'clamp(12px, 3vw, 20px)',
                }}
              >
                {/* Header with eye icon */}
<div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium" style={{ fontSize: 'var(--fs-sm)' }}>
                    Total Balance
                  </span>
                  <button 
                    className="p-1 transition-all hover:scale-110"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? (
                      // Open eye icon
                      <svg width="clamp(16px, 4vw, 24px)" height="clamp(16px, 4vw, 24px)" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                    ) : (
                      // Closed eye icon (eye with slash)
                      <svg width="clamp(16px, 4vw, 24px)" height="clamp(16px, 4vw, 24px)" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Balance Amount */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-gray-800 font-bold" style={{ fontSize: 'var(--fs-xl)' }}>
                    {showBalance 
                      ? `$${(user?.walletBalance || 0).toLocaleString()}` 
                      : '****'
                    }
                  </span>
                  <button 
                    className="p-1 transition-all hover:scale-110"
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                  >
                    <svg 
                      width="clamp(16px, 4vw, 24px)" 
                      height="clamp(16px, 4vw, 24px)" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      className={`text-gray-400 transition-transform duration-500 ${isRefreshing ? 'animate-reverse-spin' : ''}`}
                    >
                      <path 
                        d="M1 4v6h6M23 20v-6h-6" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button className="flex flex-col items-center p-2 rounded-xl transition-all hover:scale-105">
                    <div className="rounded-xl flex items-center justify-center mb-1" style={{ 
                      background: 'rgba(255, 193, 7, 0.3)',
                      width: 'clamp(24px, 6vw, 32px)',
                      height: 'clamp(24px, 6vw, 32px)'
                    }}>
                      <svg width="clamp(12px, 3vw, 16px)" height="clamp(12px, 3vw, 16px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium" style={{ fontSize: 'var(--fs-xs)' }}>Deposit</span>
                  </button>

                  <button className="flex flex-col items-center p-2 rounded-xl transition-all hover:scale-105">
                    <div className="rounded-xl flex items-center justify-center mb-1" style={{ 
                      background: 'rgba(108, 117, 125, 0.2)',
                      width: 'clamp(24px, 6vw, 32px)',
                      height: 'clamp(24px, 6vw, 32px)'
                    }}>
                      <svg width="clamp(12px, 3vw, 16px)" height="clamp(12px, 3vw, 16px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium" style={{ fontSize: 'var(--fs-xs)' }}>Bridge</span>
                  </button>

                  <button className="flex flex-col items-center p-2 rounded-xl transition-all hover:scale-105">
                    <div className="rounded-xl flex items-center justify-center mb-1" style={{ 
                      background: 'rgba(40, 167, 69, 0.2)',
                      width: 'clamp(24px, 6vw, 32px)',
                      height: 'clamp(24px, 6vw, 32px)'
                    }}>
                      <svg width="clamp(12px, 3vw, 16px)" height="clamp(12px, 3vw, 16px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium" style={{ fontSize: 'var(--fs-xs)' }}>Earn</span>
                  </button>

                  <button className="flex flex-col items-center p-2 rounded-xl transition-all hover:scale-105">
                    <div className="rounded-xl flex items-center justify-center mb-1" style={{ 
                      background: 'rgba(108, 117, 125, 0.2)',
                      width: 'clamp(24px, 6vw, 32px)',
                      height: 'clamp(24px, 6vw, 32px)'
                    }}>
                      <svg width="clamp(12px, 3vw, 16px)" height="clamp(12px, 3vw, 16px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7,7 17,7 17,17"></polyline>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium" style={{ fontSize: 'var(--fs-xs)' }}>Transfer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Widget Grid - 3 Widgets */}
            <div 
              className="flex justify-center gap-3"
              style={{ 
                marginTop: 'clamp(16px, 4vw, 24px)',
                zIndex: 10,
                paddingLeft: 'clamp(16px, 4vw, 24px)',
                paddingRight: 'clamp(16px, 4vw, 24px)',
              }}
            >
              {/* Game Energy Widget - For Gaming */}
              <button
                onClick={() => handleTabChange('game')}
                className="flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ 
                  width: 'clamp(90px, 25vw, 135px)',
                  height: 'clamp(90px, 25vw, 135px)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.25) 100%)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 'clamp(12px, 3vw, 20px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  animation: 'bubble-float-slow 4s ease-in-out infinite',
                  padding: 'clamp(8px, 2vw, 12px)',
                }}
              >
                {/* Circular Progress */}
                <div className="relative flex items-center justify-center" style={{ width: 'clamp(40px, 12vw, 60px)', height: 'clamp(40px, 12vw, 60px)' }}>
                  {/* Background Circle */}
                  <svg width="100%" height="100%" className="absolute" viewBox="0 0 50 50">
                    <circle
                      cx="25"
                      cy="25"
                      r="18"
                      fill="none"
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="2"
                    />
                  </svg>
                  
                  {/* Progress Circle */}
                  <svg width="100%" height="100%" className="absolute" viewBox="0 0 50 50" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="25"
                      cy="25"
                      r="18"
                      fill="none"
                      stroke="url(#gameEnergyGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - Math.min(energy.currentEnergy, 10) / 10)}`}
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                    <defs>
                      <linearGradient id="gameEnergyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="25%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="75%" stopColor="#84cc16" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center Content */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="text-gray-800 font-bold" style={{ fontSize: 'var(--fs-sm)' }}>
                      {Math.min(energy.currentEnergy, 10)}/{Math.min(energy.maxEnergy, 10)}
                    </div>
                  </div>
                </div>
                
                {/* Status Text */}
                <div className="text-gray-600 font-medium mt-1" style={{ fontSize: 'var(--fs-xs)' }}>
                  {Math.min(energy.currentEnergy, 10) >= 5 ? 'Ready' : 
                   Math.min(energy.currentEnergy, 10) >= 3 ? 'Low' : 
                   Math.min(energy.currentEnergy, 10) >= 1 ? 'Very Low' : 'Empty'}
                </div>
              </button>

              {/* Spin Widget */}
              <button
                onClick={() => setShowSpinModal(true)}
                className="flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ 
                  width: 'clamp(90px, 25vw, 135px)',
                  height: 'clamp(90px, 25vw, 135px)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.25) 100%)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 'clamp(12px, 3vw, 20px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  animation: 'bubble-float 3.5s ease-in-out infinite',
                  padding: 'clamp(8px, 2vw, 12px)',
                }}
              >
                {/* Spin Icon */}
                <div className="relative flex items-center justify-center mb-1">
                  <img 
                    src="/icons/spin.PNG" 
                    alt="Spin" 
                    style={{ 
                      width: 'clamp(32px, 8vw, 48px)', 
                      height: 'clamp(32px, 8vw, 48px)', 
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }} 
                  />
                  {spinsLeft > 0 && (
                    <div 
                      className="absolute flex items-center justify-center"
                      style={{
                        top: 'clamp(-3px, -0.8vw, -5px)',
                        right: 'clamp(-3px, -0.8vw, -5px)',
                        width: 'clamp(14px, 4vw, 20px)',
                        height: 'clamp(14px, 4vw, 20px)',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                        border: '2px solid white',
                        fontSize: 'clamp(7px, 2vw, 10px)',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}
                    >
                      {spinsLeft}
                    </div>
                  )}
                </div>
                
                {/* Spin Title */}
                <div className="text-gray-800 font-bold mb-1" style={{ fontSize: 'var(--fs-sm)' }}>
                  Lucky Spin
                </div>
                
                {/* Status Text */}
                <div className="text-gray-600 font-medium" style={{ fontSize: 'var(--fs-xs)' }}>
                  {spinsLeft > 0 ? `${spinsLeft} spins left` : 'No spins'}
                </div>
              </button>

              {/* Pet Storage Widget - Shows pending coins from pet */}
              <button
                onClick={() => handleTabChange('pet')}
                className="flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ 
                  width: 'clamp(90px, 25vw, 135px)',
                  height: 'clamp(90px, 25vw, 135px)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.25) 100%)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 'clamp(12px, 3vw, 20px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  animation: 'bubble-float 3.2s ease-in-out infinite',
                  padding: 'clamp(6px, 1.5vw, 10px)',
                }}
              >
                {/* Pet Coin Icon */}
                <div className="flex items-center justify-center mb-1" style={{ 
                  width: 'clamp(24px, 6vw, 32px)', 
                  height: 'clamp(24px, 6vw, 32px)',
                  borderRadius: '50%',
                  background: pet.pendingCoins > 0 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0,0,0,0.1)'
                }}>
                  <span style={{ fontSize: 'clamp(12px, 3vw, 16px)' }}>🪙</span>
                </div>
                
                {/* Pet Storage Title */}
                <div className="text-gray-800 font-bold mb-1" style={{ fontSize: 'var(--fs-xs)' }}>
                  Pet Coins
                </div>
                
                {/* Pending Coins Amount */}
                <div className="text-center w-full px-1">
                  <div className="text-gray-800 font-bold" style={{ 
                    fontSize: 'var(--fs-sm)',
                    lineHeight: '1.1',
                    wordBreak: 'break-all',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {pet.pendingCoins.toLocaleString()}
                  </div>
                  <div className="text-gray-500" style={{ fontSize: 'var(--fs-xs)' }}>
                    {pet.pendingCoins > 0 ? 'Ready' : 'Empty'}
                  </div>
                </div>
              </button>
            </div>

            {/* Hero Section */}
            <div className="flex-1 flex items-center justify-center" style={{ marginTop: 'clamp(20px, 5vw, 40px)', transform: 'scale(0.7)' }}>
              <HeroSection mascotImageUrl="/mascot.png" showAnimation={true} />
            </div>
          </div>
        );

      case 'quest':
        return <div className="px-6"><QuestScreen /></div>;
      case 'pet':
        return <div className="px-6"><PetScreen /></div>;
      case 'wallet':
        return <AppScreen />;
      case 'game':
        return <GameScreenNew onGameStateChange={setIsPlayingGame} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-secondary">Screen not found</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen-safe flex flex-col safe-area-inset-top relative">
      <main 
        className="flex-1 flex flex-col" 
        style={{ 
          zIndex: 2, 
          paddingBottom: activeTab === 'game' ? '80px' : '120px',
          overflowY: activeTab === 'home' ? 'hidden' : 'auto', // Tắt scroll cho trang Home
          height: '100vh',
          maxHeight: '100vh'
        }}
      >
        {renderActiveScreen()}
      </main>
      {!isPlayingGame && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Rank Progress Modal */}
      {showRankModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowRankModal(false)}
        >
          <div 
            className="w-full overflow-hidden"
            style={{
              maxWidth: '320px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 text-center">
              {/* Close button */}
              <button
                onClick={() => setShowRankModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 z-10"
                style={{ background: 'rgba(0,0,0,0.1)' }}
              >
                <span className="text-gray-600 text-lg font-bold">✕</span>
              </button>

              <div className="text-gray-600 font-semibold tracking-widest mb-4" style={{ fontSize: 'var(--fs-xs)' }}>YOUR RANK</div>
              
              {/* Current Rank Display with Navigation */}
              <div className="relative flex items-center justify-center mb-4">
                {/* Left Arrow */}
                <button
                  onClick={() => setDisplayRankIndex(Math.max(0, displayRankIndex - 1))}
                  disabled={displayRankIndex === 0}
                  className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <span className="text-gray-700 text-lg">‹</span>
                </button>

                {/* Rank Display */}
                <div className="flex flex-col items-center relative">
                  {/* Current User Indicator */}
                  {displayRankIndex === RANK_TIERS.findIndex(tier => tier.name === getUserRankTier(user?.tokenBalance || 0).name) && (
                    <div 
                      className="absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: RANK_TIERS[displayRankIndex].color }}
                    >
                      <span style={{ fontSize: '12px' }}>👑</span>
                    </div>
                  )}
                  
                  <img 
                    src={RANK_TIERS[displayRankIndex].icon} 
                    alt="Rank" 
                    style={{ width: '80px', height: '80px', objectFit: 'contain' }} 
                  />
                  <div className="text-gray-800 font-bold" style={{ fontSize: 'var(--fs-lg)', marginTop: '8px' }}>
                    {RANK_TIERS[displayRankIndex].name}
                  </div>
                  <div className="text-gray-600" style={{ fontSize: 'var(--fs-sm)', marginTop: '4px' }}>
                    {RANK_TIERS[displayRankIndex].minPoints >= 1000 
                      ? `${RANK_TIERS[displayRankIndex].minPoints/1000}K` 
                      : RANK_TIERS[displayRankIndex].minPoints}
                    {displayRankIndex < RANK_TIERS.length - 1 && (
                      <> - {RANK_TIERS[displayRankIndex + 1].minPoints >= 1000 
                        ? `${RANK_TIERS[displayRankIndex + 1].minPoints/1000}K` 
                        : RANK_TIERS[displayRankIndex + 1].minPoints}</>
                    )}
                    {displayRankIndex === RANK_TIERS.length - 1 && '+'} points
                  </div>
                  {RANK_TIERS[displayRankIndex].reward > 0 && (
                    <div className="text-green-400 font-medium" style={{ fontSize: 'var(--fs-xs)', marginTop: '2px' }}>
                      +{RANK_TIERS[displayRankIndex].reward.toLocaleString()} coins reward
                    </div>
                  )}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => setDisplayRankIndex(Math.min(RANK_TIERS.length - 1, displayRankIndex + 1))}
                  disabled={displayRankIndex === RANK_TIERS.length - 1}
                  className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <span className="text-gray-700 text-lg">›</span>
                </button>
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
                      <span className="text-white/60" style={{ fontSize: 'var(--fs-xs)', marginTop: '4px' }}>{currentTier.name}</span>
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
                          className="absolute inset-0 flex items-center justify-center text-white font-semibold"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)', fontSize: 'var(--fs-xs)' }}
                        >
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center opacity-60" style={{ marginLeft: '12px' }}>
                      <img src={nextTier.icon} alt={nextTier.name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                      <span className="text-white/60" style={{ fontSize: 'var(--fs-xs)', marginTop: '4px' }}>{nextTier.name}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Spin Modal */}
      <SpinModal isOpen={showSpinModal} onClose={() => setShowSpinModal(false)} />

      {/* Rank Up Modal */}
      {rankUpNotification?.show && (
        <RankUpModal
          isOpen={true}
          onClose={hideRankUpNotification}
          newRank={rankUpNotification.newRank}
          coinsAwarded={rankUpNotification.coinsAwarded}
        />
      )}

      {/* Custom CSS for reverse spin animation */}
      <style jsx global>{`
        @keyframes reverse-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        
        .animate-reverse-spin {
          animation: reverse-spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
