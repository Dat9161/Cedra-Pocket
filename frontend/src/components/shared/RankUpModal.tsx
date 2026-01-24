'use client';

import { useEffect, useState } from 'react';

interface RankUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newRank: string;
  coinsAwarded: number;
}

/**
 * Rank names mapping
 */
const RANK_NAMES = {
  RANK1: 'Rank 1',
  RANK2: 'Rank 2', 
  RANK3: 'Rank 3',
  RANK4: 'Rank 4',
  RANK5: 'Rank 5',
  RANK6: 'Rank 6',
};

/**
 * Rank icons mapping
 */
const RANK_ICONS = {
  RANK1: '/icons/Shrimp-Bronze.png',
  RANK2: '/icons/Fish-Silver.png',
  RANK3: '/icons/Dolphin-Gold.png', 
  RANK4: '/icons/Shark-Emerald.png',
  RANK5: '/icons/Whale-Diamond.png',
  RANK6: '/icons/Leviathan-Obsidian.png',
};

/**
 * RankUpModal component - Shows when user ranks up
 */
export function RankUpModal({ isOpen, onClose, newRank, coinsAwarded }: RankUpModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rankName = RANK_NAMES[newRank as keyof typeof RANK_NAMES] || newRank;
  const rankIcon = RANK_ICONS[newRank as keyof typeof RANK_ICONS] || '/icons/Shrimp-Bronze.png';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={onClose}
    >
      <div 
        className={`relative transition-all duration-500 ${showAnimation ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
        style={{
          background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF6B35)',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '320px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(255, 215, 0, 0.4)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Title */}
          <h2 
            className="font-extrabold mb-4 text-white drop-shadow-lg"
            style={{ fontSize: 'clamp(24px, 6vw, 32px)' }}
          >
            🎉 RANK UP! 🎉
          </h2>

          {/* Rank Icon */}
          <div className="mb-6 flex justify-center">
            <div 
              className="rounded-full bg-white/20 p-4 backdrop-blur-sm"
              style={{ 
                width: 'clamp(80px, 20vw, 120px)', 
                height: 'clamp(80px, 20vw, 120px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src={rankIcon} 
                alt={rankName}
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
              />
            </div>
          </div>

          {/* New Rank */}
          <h3 
            className="font-bold mb-4 text-white"
            style={{ fontSize: 'clamp(18px, 4.5vw, 24px)' }}
          >
            Welcome to {rankName}!
          </h3>

          {/* Coins Awarded */}
          <div 
            className="mb-6 p-4 rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span style={{ fontSize: 'clamp(20px, 5vw, 28px)' }}>🪙</span>
              <span 
                className="font-extrabold text-white"
                style={{ fontSize: 'clamp(20px, 5vw, 28px)' }}
              >
                +{coinsAwarded.toLocaleString()}
              </span>
            </div>
            <p 
              className="text-white/90 font-medium"
              style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}
            >
              Rank Reward Coins!
            </p>
          </div>

          {/* Close hint */}
          <p 
            className="text-white/70 font-medium"
            style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}
          >
            Tap anywhere to continue
          </p>
        </div>
      </div>
    </div>
  );
}

export default RankUpModal;