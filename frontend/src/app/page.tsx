'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore, useUser, useIsLoading, useError, NavigationTab, usePet } from '../store/useAppStore';
import { HeroSection } from '../components/home';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { LoadingScreen } from '../components/shared';
import { QuestScreen } from '../components/quest';
import { SpinModal } from '../components/spin';
import { RewardScreen } from '../components/reward';
import { GameScreen } from '../components/game';
import { PetScreen } from '../components/pet/PetScreen';
import { useTelegram } from '../components/providers';
import { useSpinsLeft } from '../store/useAppStore';
import { backendAPI } from '../services/backend-api.service';

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
  const pet = usePet();
  const isLoading = useIsLoading();
  const error = useError();
  const { activeTab, setActiveTab, setUser, setError } = useAppStore();
  const { isInitialized, isAvailable } = useTelegram();
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [showRankModal, setShowRankModal] = useState(false);
  const [displayRankIndex, setDisplayRankIndex] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh balance function
  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      if (backendAPI?.isAuthenticated()) {
        // Refresh user data from backend
        const backendUser = await backendAPI.getUserProfile();
        const userData = backendAPI.backendUserToUserData(backendUser);
        setUser(userData);
      }
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
          <div className="flex-1 flex flex-col px-3" style={{ paddingTop: 'clamp(6px, 2vw, 10px)', position: 'relative', zIndex: 1 }}>
            {/* Top Bar - Glass Container with top notch */}
            <div className="relative mb-2" style={{ marginLeft: 'clamp(2px, 1vw, 4px)', marginRight: 'clamp(2px, 1vw, 4px)', zIndex: 10 }}>
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

              {/* Spin + Points display - top right */}
              <div className="absolute z-20" style={{ top: 'clamp(14px, 4vw, 20px)', right: 'clamp(8px, 2.5vw, 12px)' }}>
                <div className="flex items-center gap-2">
                  {/* Spin Button */}
                  <button 
                    onClick={() => setShowSpinModal(true)}
                    className="relative flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      width: 'clamp(28px, 7vw, 36px)',
                      height: 'clamp(28px, 7vw, 36px)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <img 
                      src="/icons/spin.PNG" 
                      alt="Spin" 
                      style={{ 
                        width: 'clamp(24px, 6vw, 32px)', 
                        height: 'clamp(24px, 6vw, 32px)', 
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }} 
                    />
                    {spinsLeft > 0 && (
                      <div 
                        className="absolute flex items-center justify-center"
                        style={{
                          top: '-4px',
                          right: '-4px',
                          width: 'clamp(16px, 4vw, 20px)',
                          height: 'clamp(16px, 4vw, 20px)',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                          border: '2px solid white',
                          fontSize: 'clamp(8px, 2vw, 10px)',
                          fontWeight: 'bold',
                          color: 'white',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        }}
                      >
                        {spinsLeft}
                      </div>
                    )}
                  </button>

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
              </div>

              {/* Username - center */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: 'clamp(12px, 3.5vw, 18px)' }}>
                <span style={{ fontSize: 'var(--fs-base)' }} className="font-bold text-gray-800">{user.username}</span>
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
                    <span style={{ fontSize: 'var(--fs-sm)' }} className="text-gray-600 font-semibold">LVL {user.level}/10</span>
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

            {/* Total Balance Section */}
            <div 
              className="flex justify-center mb-6"
              style={{ 
                marginTop: 'clamp(16px, 4vw, 24px)',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              {/* Total Balance Card */}
              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(20px)',
                  width: '100%',
                  maxWidth: '320px',
                }}
              >
                {/* Header with eye icon */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600 font-medium" style={{ fontSize: '14px' }}>
                    Total Balance
                  </span>
                  <button 
                    className="p-1 transition-all hover:scale-110"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? (
                      // Open eye icon
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                    ) : (
                      // Closed eye icon (eye with slash)
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Balance Amount */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-gray-800 font-bold" style={{ fontSize: '32px' }}>
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
                      width="20" 
                      height="20" 
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
                <div className="grid grid-cols-4 gap-3">
                  <button className="flex flex-col items-center p-3 rounded-2xl transition-all hover:scale-105">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: 'rgba(255, 193, 7, 0.3)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium" style={{ fontSize: '12px' }}>Deposit</span>
                  </button>

                  <button className="flex flex-col items-center p-3 rounded-2xl transition-all hover:scale-105">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: 'rgba(108, 117, 125, 0.2)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium" style={{ fontSize: '12px' }}>Bridge</span>
                  </button>

                  <button className="flex flex-col items-center p-3 rounded-2xl transition-all hover:scale-105">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: 'rgba(40, 167, 69, 0.2)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium" style={{ fontSize: '12px' }}>Earn</span>
                  </button>

                  <button className="flex flex-col items-center p-3 rounded-2xl transition-all hover:scale-105">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: 'rgba(108, 117, 125, 0.2)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7,7 17,7 17,17"></polyline>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium" style={{ fontSize: '12px' }}>Transfer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Widget Grid - 2 Large Empty Buttons */}
            <div 
              className="flex justify-center gap-6"
              style={{ 
                marginTop: 'clamp(32px, 8vw, 48px)',
                zIndex: 10,
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              {/* Energy Widget - For Gaming */}
              <button
                onClick={() => handleTabChange('game')}
                className="flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ 
                  width: '140px',
                  height: '140px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.25) 100%)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '24px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  animation: 'bubble-float-slow 4s ease-in-out infinite',
                  padding: '16px',
                }}
              >
                {/* Circular Progress */}
                <div className="relative flex items-center justify-center" style={{ width: '80px', height: '80px' }}>
                  {/* Background Circle */}
                  <svg width="80" height="80" className="absolute">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="6"
                    />
                  </svg>
                  
                  {/* Progress Circle */}
                  <svg width="80" height="80" className="absolute" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="url(#energyGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - (pet.hunger + pet.happiness) / 200)}`}
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                    <defs>
                      <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="25%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="75%" stopColor="#84cc16" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center Content */}
                  <div className="flex flex-col items-center">
                    <div className="text-gray-800 font-bold" style={{ fontSize: '24px' }}>
                      {Math.round((pet.hunger + pet.happiness) / 2)}
                    </div>
                  </div>
                </div>
                
                {/* Status Text */}
                <div className="text-gray-600 font-medium mt-2" style={{ fontSize: '12px' }}>
                  {Math.round((pet.hunger + pet.happiness) / 2) >= 75 ? 'Ready' : 
                   Math.round((pet.hunger + pet.happiness) / 2) >= 50 ? 'Neutral' : 
                   Math.round((pet.hunger + pet.happiness) / 2) >= 25 ? 'Low' : 'Empty'}
                </div>
              </button>

              {/* Storage Widget */}
              <button
                onClick={() => handleTabChange('pet')}
                className="flex flex-col items-start justify-start transition-all hover:scale-105 active:scale-95"
                style={{ 
                  width: '140px',
                  height: '140px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.25) 100%)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '24px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  animation: 'bubble-float 3.2s ease-in-out infinite',
                  padding: '16px',
                }}
              >
                {/* Storage Title */}
                <div className="text-gray-800 font-bold mb-3" style={{ fontSize: '16px' }}>
                  Storage
                </div>
                
                {/* Storage Bar */}
                <div className="w-full mb-3">
                  <div 
                    className="w-full h-8 rounded-lg overflow-hidden"
                    style={{ background: 'rgba(0,0,0,0.1)' }}
                  >
                    <div 
                      className="h-full rounded-lg"
                      style={{ 
                        width: pet.pendingCoins > 0 ? '100%' : '100%',
                        background: 'linear-gradient(90deg, #f59e0b, #eab308)',
                      }}
                    />
                  </div>
                </div>
                
                {/* Status */}
                <div className="flex items-center mb-2">
                  <span className="text-green-600 font-medium" style={{ fontSize: '14px' }}>
                    {pet.pendingCoins > 0 ? 'Ready' : 'Empty'}
                  </span>
                </div>
                
                {/* Collected Amount */}
                <div>
                  <div className="text-gray-500" style={{ fontSize: '11px' }}>Collected</div>
                  <div className="text-gray-800 font-bold" style={{ fontSize: '18px' }}>
                    {pet.pendingCoins.toLocaleString()}
                  </div>
                </div>
              </button>
            </div>

            {/* Hero Section */}
            <div className="flex-1 flex items-center justify-center" style={{ marginTop: 'clamp(-80px, -20vw, -40px)', transform: 'scale(0.8)' }}>
              <HeroSection mascotImageUrl="/mascot.png" showAnimation={true} />
            </div>
          </div>
        );

      case 'quest':
        return <QuestScreen />;
      case 'pet':
        return <PetScreen />;
      case 'wallet':
        return <RewardScreen />;
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
                  {RANK_TIERS[displayRankIndex].bonus > 0 && (
                    <div className="text-green-400 font-medium" style={{ fontSize: 'var(--fs-xs)', marginTop: '2px' }}>
                      +{Math.round(RANK_TIERS[displayRankIndex].bonus * 100)}% bonus
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
