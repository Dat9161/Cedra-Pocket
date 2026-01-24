'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAppStore, useQuests, useQuestsLoading } from '../../store/useAppStore';
import { QuestCard } from './QuestCard';
import { BirthYearModal } from './BirthYearModal';
import { backendAPI } from '../../services/backend-api.service';
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
  const { setQuests, setQuestsLoading, updateQuest, updateBalance, addXP, setPet } = useAppStore();
  const pet = useAppStore((state) => state.pet);
  
  // Birth year modal state
  const [showBirthYearModal, setShowBirthYearModal] = useState(false);
  const [currentPetQuest, setCurrentPetQuest] = useState<string | null>(null);
  const [isHatchingEgg, setIsHatchingEgg] = useState(false);

  // Handle birth year submission for pet hatching
  const handleBirthYearSubmit = useCallback(async (birthYear: number) => {
    if (!currentPetQuest) return;

    setIsHatchingEgg(true);
    
    try {
      // Verify quest with birth year
      const result = await backendAPI.verifyQuest(Number(currentPetQuest), { birthYear });
      
      if (result.success) {
        // Update pet state with birth year and hatched status
        setPet({
          birthYear: birthYear,
          hatched: true,
        });
        
        // Mark as claimable (user needs to click Claim to get reward)
        updateQuest(currentPetQuest, { 
          status: 'claimable', 
          progress: 100,
          currentValue: 1 
        });
        
        telegramService.triggerHapticFeedback('medium');
        console.log('✅ Pet egg hatched successfully:', result.message);
        
        // Close modal
        setShowBirthYearModal(false);
        setCurrentPetQuest(null);
      } else {
        console.log('❌ Pet hatching failed:', result.message);
        telegramService.triggerHapticFeedback('heavy');
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to hatch pet egg:', error);
      telegramService.triggerHapticFeedback('heavy');
      alert('Failed to hatch pet egg. Please try again.');
    } finally {
      setIsHatchingEgg(false);
    }
  }, [currentPetQuest, updateQuest, setPet]);

  // Handle closing birth year modal
  const handleCloseBirthYearModal = useCallback(() => {
    setShowBirthYearModal(false);
    setCurrentPetQuest(null);
    setIsHatchingEgg(false);
  }, []);

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
        // Always try to get quests, let backend handle authentication
        let backendQuests;
        try {
          backendQuests = await backendAPI.getQuests();
          console.log('✅ Quests loaded from backend:', backendQuests.length);
        } catch (error) {
          console.warn('⚠️ Failed to load quests from backend, using fallback');
          // Use fallback quests if backend fails
          backendQuests = [
            {
              id: 4,
              title: 'Daily Check-in',
              description: 'Check in daily to earn rewards',
              type: 'GAME' as const,
              category: 'daily',
              config: {},
              reward_amount: 50,
              reward_type: 'POINT' as const,
              frequency: 'DAILY' as const,
              is_active: true,
              user_status: 'NOT_STARTED' as const,
            },
            {
              id: 1,
              title: 'Follow on Twitter',
              description: 'Follow our official Twitter account @CedraQuest',
              type: 'SOCIAL' as const,
              category: 'social',
              config: { url: 'https://twitter.com/intent/follow?screen_name=CedraQuest' },
              reward_amount: 100,
              reward_type: 'POINT' as const,
              frequency: 'ONCE' as const,
              is_active: true,
              user_status: 'NOT_STARTED' as const,
            },
            {
              id: 6,
              title: 'Hatch Your Pet Egg',
              description: 'Enter your birth year and hatch your first pet egg to start your journey',
              type: 'GAME' as const,
              category: 'pet',
              config: { requiresBirthYear: true },
              reward_amount: 300,
              reward_type: 'POINT' as const,
              frequency: 'ONCE' as const,
              is_active: true,
              user_status: 'NOT_STARTED' as const,
            },
          ];
        }

        // Convert to frontend format
        const frontendQuests = backendQuests.map((q) => {
          const questType = q.type === 'SOCIAL' ? 'social' as const : 
                           q.category === 'daily' ? 'daily' as const : 'achievement' as const;
          
          // For daily quests, auto-mark as claimable if not already claimed
          let questStatus = q.user_status === 'COMPLETED' ? 'claimable' as const :
                           q.user_status === 'CLAIMED' ? 'completed' as const : 'active' as const;
          
          if (questType === 'daily' && questStatus === 'active') {
            questStatus = 'claimable' as const;
          }
          
          return {
            id: String(q.id),
            title: q.title,
            description: q.description || '',
            iconUrl: '',
            type: questType,
            status: questStatus,
            progress: questStatus === 'claimable' || questStatus === 'completed' ? 100 : 0,
            currentValue: questStatus === 'claimable' || questStatus === 'completed' ? 1 : 0,
            targetValue: 1,
            reward: {
              type: 'token' as const,
              amount: Number(q.reward_amount),
            },
            url: q.type === 'SOCIAL' && q.config?.url ? String(q.config.url) : undefined,
          };
        });
        
        // Check pet hatching quest status based on pet state
        const updatedQuests = frontendQuests.map((quest) => {
          if (quest.type === 'achievement' && quest.title === 'Hatch Your Pet Egg') {
            if (pet.hatched && pet.birthYear) {
              // Pet is already hatched, mark quest as completed
              return {
                ...quest,
                status: 'completed' as const,
                progress: 100,
                currentValue: 1,
              };
            } else {
              // Pet not hatched, ensure quest is active
              return {
                ...quest,
                status: 'active' as const,
                progress: 0,
                currentValue: 0,
              };
            }
          }
          return quest;
        });
        
        setQuests(updatedQuests);
      } catch (error) {
        console.error('Failed to load quests:', error);
      } finally {
        setQuestsLoading(false);
      }
    };

    loadQuests();
  }, [setQuests, setQuestsLoading, pet.hatched, pet.birthYear]);

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
      // Special check for pet hatching quest - ensure pet is actually hatched
      if (quest.type === 'achievement' && quest.title === 'Hatch Your Pet Egg') {
        if (!pet.hatched || !pet.birthYear) {
          console.log('❌ Cannot claim pet hatching reward - pet not properly hatched');
          alert('You must hatch your pet egg first by entering your birth year!');
          // Reset quest to active state
          updateQuest(questId, { 
            status: 'active', 
            progress: 0,
            currentValue: 0 
          });
          return;
        }
      }

      // Try to claim via backend first
      try {
        const result = await backendAPI.claimQuestReward(Number(questId));
        if (result.success) {
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
          console.log('✅ Quest reward claimed from backend!');
          return;
        }
      } catch (error) {
        console.error('Failed to claim quest reward from backend:', error);
      }

      // Fallback to local claim
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
      console.log('✅ Quest reward claimed locally!');
      return;
    }

    // If active, handle based on quest type
    if (quest.status === 'active') {
      // Special handling for daily quests - auto mark as claimable
      if (quest.type === 'daily') {
        console.log('🎁 Daily quest auto-completed, marking as claimable');
        updateQuest(questId, { 
          status: 'claimable', 
          progress: 100,
          currentValue: quest.targetValue 
        });
        
        // Trigger haptic feedback and return to let user claim
        telegramService.triggerHapticFeedback('light');
        return;
      }

      // Special handling for pet hatching quest
      if (quest.type === 'achievement' && quest.title === 'Hatch Your Pet Egg') {
        // Check if pet is already hatched
        if (pet.hatched && pet.birthYear) {
          console.log('🥚 Pet already hatched, marking quest as claimable');
          updateQuest(questId, { 
            status: 'claimable', 
            progress: 100,
            currentValue: 1 
          });
          return;
        }
        
        console.log('🥚 Opening birth year modal for pet hatching quest');
        setCurrentPetQuest(questId);
        setShowBirthYearModal(true);
        telegramService.triggerHapticFeedback('light');
        return;
      }

      // For social quests with URLs, open external link first
      if (quest.type === 'social' && quest.url) {
        console.log('🔗 Opening external URL for social quest:', quest.url);
        
        // Try to use Telegram WebApp navigation if available
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openLink) {
          (window as any).Telegram.WebApp.openLink(quest.url);
        } else {
          // Fallback to regular window.open
          window.open(quest.url, '_blank');
        }
        
        // Mark as claimable after opening the link (user needs to complete the action and then claim)
        updateQuest(questId, { 
          status: 'claimable', 
          progress: 100,
          currentValue: quest.targetValue 
        });
        
        telegramService.triggerHapticFeedback('medium');
        console.log('✅ Social quest link opened, marked as claimable');
        return;
      }

      // For non-social quests or quests without URLs, try to verify with backend
      // Always try backend first, fallback to local if needed
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
        
        // Fallback: mark as claimable locally for demo
        console.log('⚠️ Backend verification failed, marking as claimable locally (demo mode)');
        updateQuest(questId, { 
          status: 'claimable', 
          progress: 100,
          currentValue: quest.targetValue 
        });
        telegramService.triggerHapticFeedback('medium');
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

      {/* Birth Year Modal */}
      <BirthYearModal
        isOpen={showBirthYearModal}
        onClose={handleCloseBirthYearModal}
        onSubmit={handleBirthYearSubmit}
        isLoading={isHatchingEgg}
      />
    </div>
  );
}

export default QuestScreen;
