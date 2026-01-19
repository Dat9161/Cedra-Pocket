'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore, useQuests, useQuestsLoading } from '../../store/useAppStore';
import { QuestCard } from './QuestCard';
import { backendAPI, BackendAPIError } from '../../services/backend-api.service';
import { telegramService } from '../../services/telegram.service';
import { LoadingSpinner } from '../shared/LoadingSpinner';

/**
 * QuestScreen component
 * Split into Daily Login and Tasks sections
 * Now connected to backend API
 */
export function QuestScreen() {
  const quests = useQuests();
  const questsLoading = useQuestsLoading();
  const { setQuests, setQuestsLoading, updateQuest, updateBalance, addXP } = useAppStore();

  // Filter quests by type
  const dailyQuests = quests.filter((q) => q.type === 'daily');
  const taskQuests = quests.filter((q) => q.type !== 'daily');

  // Calculate total progress
  const totalProgress = quests.length > 0 
    ? Math.round(quests.reduce((sum, q) => sum + q.progress, 0) / quests.length)
    : 0;
  const completedCount = quests.filter(q => q.status === 'completed').length;

  // Load quests from backend on mount
  useEffect(() => {
    const loadQuests = async () => {
      setQuestsLoading(true);
      try {
        // Get quests from authenticated endpoint
        let backendQuests;
        if (backendAPI.isAuthenticated()) {
          backendQuests = await backendAPI.getQuests();
        } else {
          console.warn('Not authenticated, cannot load quests');
          return;
        }

        // Convert to frontend format
        const frontendQuests = backendQuests.map((q) => backendAPI.backendQuestToQuest(q));
        setQuests(frontendQuests);
      } catch (error) {
        console.error('Failed to load quests:', error);
      } finally {
        setQuestsLoading(false);
      }
    };

    loadQuests();
  }, [setQuests, setQuestsLoading]);

  // Handle quest action (Go or Claim)
  const handleQuestSelect = useCallback(async (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    telegramService.triggerHapticFeedback('light');

    // If already completed, do nothing
    if (quest.status === 'completed') {
      return;
    }

    // If claimable, claim the reward and mark as completed
    if (quest.status === 'claimable') {
      // Add reward to balance
      if (quest.reward) {
        if (quest.reward.type === 'token') {
          updateBalance(quest.reward.amount, 'token');
        } else if (quest.reward.type === 'gem') {
          updateBalance(quest.reward.amount, 'gem');
        } else if (quest.reward.type === 'xp') {
          addXP(quest.reward.amount);
        }
      }
      
      // Mark as completed
      updateQuest(questId, { 
        status: 'completed', 
        progress: 100,
        currentValue: quest.targetValue 
      });
      
      telegramService.triggerHapticFeedback('medium');
      console.log('✅ Quest reward claimed!');
      return;
    }

    // If active, try to complete the quest
    if (quest.status === 'active') {
      // Check if authenticated before verifying with backend
      if (!backendAPI.isAuthenticated()) {
        console.log('⚠️ Not authenticated, marking as claimable locally (demo mode)');
        // Mark as claimable so user can click Claim
        updateQuest(questId, { 
          status: 'claimable', 
          progress: 100,
          currentValue: quest.targetValue 
        });
        telegramService.triggerHapticFeedback('medium');
        return;
      }

      // Try to verify with backend
      try {
        const result = await backendAPI.verifyQuest(Number(questId));
        
        if (result.success) {
          // Mark as claimable (user needs to click Claim to get reward)
          updateQuest(questId, { 
            status: 'claimable', 
            progress: 100,
            currentValue: quest.targetValue 
          });
          
          telegramService.triggerHapticFeedback('medium');
          console.log('✅ Quest verified, ready to claim:', result.message);
        } else {
          console.log('❌ Quest verification failed:', result.message);
          telegramService.triggerHapticFeedback('heavy');
        }
      } catch (error) {
        console.error('Failed to verify quest:', error);
        
        if (error instanceof BackendAPIError) {
          console.log('Backend error:', error.message);
        }
        
        telegramService.triggerHapticFeedback('heavy');
      }
    }
  }, [quests, updateQuest, updateBalance, addXP]);

  if (questsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col hide-scrollbar" 
      style={{ 
        paddingTop: 'clamp(12px, 3vw, 18px)', 
        paddingLeft: 'clamp(8px, 2vw, 12px)',
        paddingRight: 'clamp(8px, 2vw, 12px)',
        backgroundColor: 'transparent',
        height: 'calc(100vh - clamp(56px, 14vw, 72px))',
        overflowY: 'auto',
        paddingBottom: 'clamp(60px, 16vw, 80px)'
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 'clamp(8px, 2vw, 12px)', paddingLeft: 'clamp(8px, 2vw, 12px)', paddingRight: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }} className="flex-shrink-0">
        <h1 style={{ color: '#1a1a2e', fontSize: 'var(--fs-xl)' }} className="font-extrabold drop-shadow-[0_0_15px_rgba(0,0,0,0.1)]">
          Quests
        </h1>

        {/* Total Progress Bar */}
        <div style={{ marginTop: 'clamp(6px, 1.5vw, 10px)', marginBottom: 'clamp(8px, 2vw, 12px)', paddingLeft: 'clamp(8px, 2vw, 12px)', paddingRight: 'clamp(8px, 2vw, 12px)' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.1)', height: 'clamp(18px, 5vw, 22px)' }} className="w-full rounded-full overflow-hidden relative">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${totalProgress}%`,
                background: 'linear-gradient(90deg, #FFD700, #FFA500)'
              }}
            />
            <span style={{ color: '#1a1a2e', fontSize: 'var(--fs-sm)' }} className="absolute inset-0 flex items-center justify-center font-bold drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
              {completedCount}/{quests.length} completed
            </span>
          </div>
        </div>
      </header>

      {/* Daily Login Section - No title */}
      <section style={{ marginBottom: 'clamp(10px, 2.5vw, 14px)', paddingLeft: 'clamp(10px, 2.5vw, 14px)', paddingRight: 'clamp(10px, 2.5vw, 14px)' }} className="flex-shrink-0">
        <div className="flex flex-col" style={{ gap: 'clamp(8px, 2vw, 12px)' }}>
          {dailyQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onAction={() => handleQuestSelect(quest.id)}
            />
          ))}
        </div>
      </section>

      {/* Tasks Section */}
      <section style={{ paddingLeft: 'clamp(8px, 2vw, 12px)', paddingRight: 'clamp(8px, 2vw, 12px)' }} className="flex-shrink-0">
        <h2 style={{ color: '#1a1a2e', marginBottom: 'clamp(6px, 1.5vw, 10px)', fontSize: 'var(--fs-base)' }} className="font-extrabold flex items-center gap-2">
          ⚡ Tasks
        </h2>
        <div className="flex flex-col" style={{ gap: 'clamp(8px, 2vw, 12px)' }}>
          {taskQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onAction={() => handleQuestSelect(quest.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default QuestScreen;
