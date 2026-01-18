'use client';

import { useState } from 'react';
import type { Quest } from '../../models/quest';

export interface QuestCardProps {
  quest: Quest;
  onAction: () => void;
}

/**
 * Reward type icons
 */
const RewardIcon = ({ type }: { type: Quest['reward']['type'] }) => {
  switch (type) {
    case 'token':
      return <span>🪙</span>;
    case 'gem':
      return <span>🪙</span>;
    case 'xp':
      return <span>⭐</span>;
    case 'nft':
      return <span>🎁</span>;
  }
};

/**
 * Format reward amount for display
 */
function formatRewardAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

/**
 * Reward Badge component
 * Adjust size: change width/height in style prop
 */
const RewardBadge = ({ type, amount }: { type: Quest['reward']['type']; amount: number }) => (
  <div 
    style={{ 
      minWidth: 'clamp(44px, 12vw, 56px)',
      height: 'clamp(18px, 5vw, 24px)',
      paddingLeft: 'clamp(5px, 1.2vw, 8px)',
      paddingRight: 'clamp(5px, 1.2vw, 8px)',
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: 'clamp(6px, 1.5vw, 10px)',
      border: '1px solid rgba(0, 0, 0, 0.1)'
    }}
    className="flex items-center justify-center gap-1"
  >
    <span style={{ fontSize: 'var(--fs-sm)' }}>
      <RewardIcon type={type} />
    </span>
    <span style={{ color: '#1a1a2e', fontSize: 'var(--fs-sm)' }} className="font-extrabold">
      +{formatRewardAmount(amount)}
    </span>
  </div>
);

/**
 * Completed Badge component
 */
const CompletedBadge = () => (
  <div 
    style={{ 
      minWidth: 'clamp(54px, 14vw, 70px)',
      height: 'clamp(18px, 5vw, 24px)',
      paddingLeft: 'clamp(5px, 1.2vw, 8px)',
      paddingRight: 'clamp(5px, 1.2vw, 8px)',
      background: 'rgba(34, 197, 94, 0.2)',
      borderRadius: 'clamp(6px, 1.5vw, 10px)',
      border: '1px solid rgba(34, 197, 94, 0.3)'
    }}
    className="flex items-center justify-center"
  >
    <span style={{ color: '#16a34a', fontSize: 'var(--fs-sm)' }} className="font-extrabold">
      ✓ Completed
    </span>
  </div>
);

/**
 * Claim Button component
 */
const ClaimButton = ({ onClick }: { onClick?: () => void }) => (
  <button 
    onClick={onClick}
    style={{ width: 'clamp(44px, 12vw, 56px)', height: 'clamp(18px, 5vw, 24px)', fontSize: 'var(--fs-sm)' }}
    className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-extrabold shadow-lg shadow-pink-500/30 border border-pink-400/30 hover:scale-105 transition-transform flex items-center justify-center"
  >
    Claim
  </button>
);

/**
 * Quest Detail Modal - Same style as original quest card
 */
const QuestDetailModal = ({ 
  quest, 
  isOpen, 
  onClose, 
  onAction 
}: { 
  quest: Quest; 
  isOpen: boolean; 
  onClose: () => void;
  onAction: () => void;
}) => {
  if (!isOpen) return null;

  const isClaimable = quest.status === 'claimable';
  const isCompleted = quest.status === 'completed';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'linear-gradient(135deg, #ffffff, #e8dcc8)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 'clamp(10px, 2.5vw, 14px)',
          padding: 'clamp(10px, 2.5vw, 14px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: 'clamp(240px, 68vw, 300px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start" style={{ gap: 'clamp(8px, 2vw, 12px)' }}>
          {/* Quest Icon */}
          <div 
            className="rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-accent-cyan/20 to-accent-neon/20"
            style={{ width: 'clamp(36px, 10vw, 48px)', height: 'clamp(36px, 10vw, 48px)' }}
          >
            <span style={{ fontSize: 'clamp(18px, 5vw, 24px)' }}>
              {quest.type === 'social' && '🐦'}
              {quest.type === 'daily' && '🎁'}
              {quest.type === 'referral' && '👥'}
              {quest.type === 'achievement' && '🏆'}
            </span>
          </div>

          {/* Quest Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 style={{ color: '#1a1a2e', fontSize: 'var(--fs-base)', marginBottom: 'clamp(2px, 0.5vw, 4px)' }} className="font-bold">
              {quest.title}
            </h3>

            {/* Description - full text */}
            <p style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: 'var(--fs-sm)', lineHeight: '1.4', marginBottom: 'clamp(6px, 1.5vw, 10px)' }}>
              {quest.description}
            </p>

            {/* Reward + Action */}
            <div className="flex items-center" style={{ gap: 'clamp(5px, 1.2vw, 8px)' }}>
              <RewardBadge type={quest.reward.type} amount={quest.reward.amount} />
              {isCompleted ? (
                <CompletedBadge />
              ) : isClaimable ? (
                <button
                  onClick={() => {
                    onAction();
                    onClose();
                  }}
                  style={{ width: 'clamp(44px, 12vw, 56px)', height: 'clamp(18px, 5vw, 24px)', fontSize: 'var(--fs-xs)' }}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-extrabold shadow-lg shadow-pink-500/30 border border-pink-400/30 hover:scale-105 transition-transform flex items-center justify-center"
                >
                  Claim
                </button>
              ) : (
                <button
                  onClick={() => {
                    onAction();
                    onClose();
                  }}
                  style={{ width: 'clamp(44px, 12vw, 56px)', height: 'clamp(18px, 5vw, 24px)', fontSize: 'var(--fs-xs)' }}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold shadow-lg shadow-blue-500/30 border border-blue-400/30 hover:scale-105 transition-transform flex items-center justify-center"
                >
                  Go
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * QuestCard component - Layout like reference image
 */
export function QuestCard({ quest, onAction }: QuestCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const isLocked = quest.status === 'locked';
  const isClaimable = quest.status === 'claimable';
  const isCompleted = quest.status === 'completed';

  return (
    <>
      <div
        onClick={isLocked || isCompleted ? undefined : () => setShowDetail(true)}
        style={{
          background: 'linear-gradient(135deg, #ffffff, #e8dcc8)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 'clamp(10px, 2.5vw, 14px)',
          padding: 'clamp(8px, 2vw, 12px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          width: '100%',
        }}
        className={`${isLocked || isCompleted ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'}`}
      >
        <div className="flex items-center" style={{ gap: 'clamp(6px, 1.5vw, 10px)' }}>
          {/* Quest Icon */}
          <div 
            className="rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-accent-cyan/20 to-accent-neon/20"
            style={{ width: 'clamp(30px, 8vw, 40px)', height: 'clamp(30px, 8vw, 40px)' }}
          >
            <span style={{ fontSize: 'clamp(14px, 4vw, 20px)' }}>
              {quest.type === 'social' && '🐦'}
              {quest.type === 'daily' && '🎁'}
              {quest.type === 'referral' && '👥'}
              {quest.type === 'achievement' && '🏆'}
            </span>
          </div>

          {/* Quest Content */}
          <div className="flex-1 min-w-0">
            {/* Title - max 2 lines */}
            <h3 
              style={{ 
                color: '#1a1a2e', 
                fontSize: 'var(--fs-lg)', 
                marginBottom: 'clamp(1px, 0.2vw, 2px)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.3'
              }} 
              className="font-bold"
            >
              {quest.title}
            </h3>

            {/* Description - max 1 line */}
            <p 
              style={{ 
                color: 'rgba(0, 0, 0, 0.6)', 
                fontSize: 'var(--fs-base)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {quest.description}
            </p>
          </div>

          {/* Reward + Action - Right side */}
          <div className="flex items-center flex-shrink-0" style={{ gap: 'clamp(4px, 1vw, 8px)' }}>
            <RewardBadge type={quest.reward.type} amount={quest.reward.amount} />
            {isClaimable && (
              <ClaimButton onClick={() => {
                onAction();
              }} />
            )}
            {isCompleted && <CompletedBadge />}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <QuestDetailModal 
        quest={quest}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onAction={onAction}
      />
    </>
  );
}

export default QuestCard;
