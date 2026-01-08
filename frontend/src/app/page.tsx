'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore, useUser, useIsLoading, useError, NavigationTab } from '../store/useAppStore';
import { HeroSection } from '../components/home';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { LoadingSpinner } from '../components/shared';
import { QuestScreen } from '../components/quest';
import { SpinScreen } from '../components/spin';
import { WalletScreen } from '../components/wallet';
import { GameScreen } from '../components/game';
import { useTelegram } from '../components/providers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cedra-quest-backend.onrender.com';

export default function HomePage() {
  const user = useUser();
  const isLoading = useIsLoading();
  const error = useError();
  const { activeTab, setActiveTab, setUser, setError } = useAppStore();
  const { isInitialized, isAvailable } = useTelegram();
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<Array<{rank: number; name: string; score: number}>>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs: NavigationTab[] = ['home', 'quest', 'spin', 'wallet', 'game'];
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
      // No guest user - require Telegram authentication
      console.log('⚠️ Telegram not available, waiting for authentication...');
    }
    setIsAppReady(true);
  }, [isInitialized, isAvailable, user, setUser]);

  // Load leaderboard from backend when modal opens
  useEffect(() => {
    if (showLeaderboard && leaderboardData.length === 0) {
      loadLeaderboard();
    }
  }, [showLeaderboard]);

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      // TODO: Add leaderboard endpoint to backend
      // For now, fetch users and sort by points
      const response = await fetch(`${API_URL}/users`);
      if (response.ok) {
        const users = await response.json();
        const sorted = users
          .sort((a: { total_points: number }, b: { total_points: number }) => Number(b.total_points) - Number(a.total_points))
          .slice(0, 20)
          .map((u: { username: string; total_points: number }, i: number) => ({
            rank: i + 1,
            name: u.username || `Player${i + 1}`,
            score: Number(u.total_points)
          }));
        setLeaderboardData(sorted);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

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
          <div className="flex-1 flex flex-col px-2" style={{ paddingTop: '20px' }}>
            {/* Page Title - placeholder for future name */}
            <div style={{ height: '44px', marginBottom: '16px' }} />

            {/* Top Bar - Glass Container with top notch */}
            <div className="relative mb-4" style={{ marginLeft: '10px', marginRight: '10px' }}>
              {/* SVG for clip-path definition - top center notch like inverted trapezoid */}
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <clipPath id="notchClipTop" clipPathUnits="objectBoundingBox">
                    <path d="M 0 0.3 Q 0 0, 0.05 0 L 0.25 0 Q 0.28 0, 0.3 0.1 L 0.35 0.4 Q 0.37 0.45, 0.4 0.45 L 0.6 0.45 Q 0.63 0.45, 0.65 0.4 L 0.7 0.1 Q 0.72 0, 0.75 0 L 0.95 0 Q 1 0, 1 0.3 L 1 1 L 0 1 Z"/>
                  </clipPath>
                </defs>
              </svg>

              {/* Avatar - top left */}
              <div className="absolute z-20" style={{ top: '35px', left: '25px' }}>
                <button 
                  className="relative flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    width: '70px',
                    height: '55px',
                    borderRadius: '16px 50px 16px 16px',
                    background: 'linear-gradient(135deg, rgba(0,180,220,0.6) 0%, rgba(100,200,230,0.4) 50%, rgba(255,255,255,0.3) 100%)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 4px 15px rgba(0,180,220,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
                  }}
                >
                  <span className="text-3xl">👤</span>
                </button>
              </div>

              {/* Username - center */}
              <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: '30px' }}>
                <span className="text-base font-bold text-gray-800">{user.username}</span>
              </div>

              {/* Notification bell button - top right */}
              <div className="absolute z-20" style={{ top: '35px', right: '25px' }}>
                <button 
                  className="relative flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    width: '70px',
                    height: '55px',
                    borderRadius: '50px 16px 16px 16px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,220,100,0.4) 50%, rgba(255,180,50,0.6) 100%)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 4px 15px rgba(255,180,50,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
                  }}
                >
                  <img 
                    src="/icons/thongbao.PNG" 
                    alt="Thông báo" 
                    style={{ width: '45px', height: '45px', objectFit: 'contain' }}
                  />
                  {/* Notification badge */}
                  <div 
                    className="absolute flex items-center justify-center"
                    style={{
                      bottom: '2px',
                      right: '2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                      border: '2px solid white',
                      fontSize: '11px',
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
                  borderRadius: '24px',
                  clipPath: 'url(#notchClipTop)',
                  padding: '16px 16px 12px 16px',
                  minHeight: '120px',
                  marginTop: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.5)'
                }}
              >
                {/* Empty top row - space for notch */}
                <div style={{ height: '30px' }} />

                {/* LVL + EXP Bar - Inside glass at bottom */}
                <div className="px-2">
                  <div className="text-center mb-1">
                    <span className="text-sm text-gray-600 font-semibold">LVL {user.level}/10</span>
                  </div>
                  <div 
                    className="w-full rounded-full overflow-hidden"
                    style={{ 
                      height: '6px',
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

            {/* Leaderboard Button and Quest Suggestion - Side by side */}
            <div className="flex justify-center gap-4" style={{ marginTop: '10px' }}>
              <button 
                onClick={() => setShowLeaderboard(true)}
                className="flex items-center justify-center gap-2 py-4 transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,200,255,0.3), rgba(0,150,255,0.3))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,200,255,0.4)',
                  boxShadow: '0 4px 15px rgba(0,200,255,0.2)',
                  width: '160px',
                  borderRadius: '12px'
                }}
              >
                <span style={{ fontSize: '28px' }}>🏆</span>
                <span className="text-white font-bold" style={{ fontSize: '18px' }}>#42 Rank</span>
              </button>

              {/* Quest Suggestion Button */}
              <button 
                onClick={() => handleTabChange('quest')}
                className="flex items-center justify-center gap-2 py-4 transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,200,0,0.3), rgba(255,150,0,0.3))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,200,0,0.4)',
                  boxShadow: '0 4px 15px rgba(255,200,0,0.2)',
                  width: '160px',
                  borderRadius: '12px',
                  paddingRight: '10px'
                }}
              >
                <span style={{ fontSize: '28px' }}>🎁</span>
                <span className="text-white font-bold" style={{ fontSize: '18px' }}>Quest</span>
              </button>
            </div>

            {/* Big Coin Display - Below rank */}
            <div className="flex justify-center items-center" style={{ marginTop: '10px', marginBottom: '10px' }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '42px' }}>🪙</span>
                <span 
                  style={{ 
                    fontSize: '42px', 
                    fontWeight: '800',
                    color: '#1a1a2e',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {user.tokenBalance.toLocaleString('fr-FR').replace(/\s/g, ' ')}
                </span>
              </div>
            </div>

            {/* Hero Section */}
            <div className="flex-1 flex items-center justify-center">
              <HeroSection mascotImageUrl="/mascot.png" showAnimation={true} />
            </div>
          </div>
        );

      case 'quest':
        return <QuestScreen />;
      case 'spin':
        return <SpinScreen />;
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

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowLeaderboard(false)}
        >
          <div 
            className="w-11/12 max-w-sm overflow-hidden flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '60vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 text-center">
              <h2 className="text-2xl font-bold text-white tracking-wider">
                LEADERBOARD
              </h2>
            </div>

            {/* Leaderboard List */}
            <div 
              className="flex flex-col gap-2 overflow-y-auto flex-1"
              style={{ padding: '0 24px 16px 24px' }}
            >
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-white">Loading...</div>
                </div>
              ) : leaderboardData.map((player) => (
                <div 
                  key={player.rank}
                  className="flex items-center gap-3"
                >
                  {/* Rank Number */}
                  <div 
                    className="flex items-center justify-center font-bold text-lg"
                    style={{
                      width: '40px',
                      height: '40px',
                      background: player.rank === 1 
                        ? 'linear-gradient(135deg, rgba(255,215,0,0.5), rgba(255,180,0,0.4))'
                        : player.rank === 2 
                        ? 'linear-gradient(135deg, rgba(180,210,255,0.6), rgba(140,180,220,0.5))'
                        : player.rank === 3 
                        ? 'linear-gradient(135deg, rgba(205,127,50,0.5), rgba(180,100,40,0.4))'
                        : 'rgba(255,255,255,0.2)',
                      border: player.rank === 1 
                        ? '1px solid rgba(255,215,0,0.6)'
                        : player.rank === 2 
                        ? '1px solid rgba(180,210,255,0.7)'
                        : player.rank === 3 
                        ? '1px solid rgba(205,127,50,0.6)'
                        : '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      color: player.rank === 1 
                        ? '#ffd700'
                        : player.rank === 2 
                        ? '#b0d4ff'
                        : player.rank === 3 
                        ? '#cd7f32'
                        : '#ffffff',
                    }}
                  >
                    {player.rank}
                  </div>

                  {/* Player Info */}
                  <div 
                    className="flex-1 flex items-center justify-between"
                    style={{
                      height: '40px',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      background: player.rank === 1 
                        ? 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,180,0,0.2))'
                        : player.rank === 2 
                        ? 'linear-gradient(135deg, rgba(180,210,255,0.4), rgba(140,180,220,0.3))'
                        : player.rank === 3 
                        ? 'linear-gradient(135deg, rgba(205,127,50,0.3), rgba(180,100,40,0.2))'
                        : 'rgba(255,255,255,0.15)',
                      border: player.rank === 1 
                        ? '1px solid rgba(255,215,0,0.4)'
                        : player.rank === 2 
                        ? '1px solid rgba(180,210,255,0.5)'
                        : player.rank === 3 
                        ? '1px solid rgba(205,127,50,0.4)'
                        : '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '8px',
                    }}
                  >
                    <span className="font-semibold text-white text-sm">
                      {player.name}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {player.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <div className="p-4 pt-2">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full py-3 rounded-full font-bold text-white transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
