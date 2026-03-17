'use client';

import { useState, useEffect } from 'react';
import { backendAPI } from '../../services/backend-api.service';
import { useAppStore } from '../../store/useAppStore';

interface PetQuest {
  id: string;
  name: string;
  icon: string;
  progress: number;
  completed: boolean;
  url?: string;
}

interface PetQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHatch: () => void;
  currentProgress: number;
}

export function PetQuestModal({ isOpen, onClose, onHatch, currentProgress }: PetQuestModalProps) {
  const { setPet } = useAppStore();
  const [quests, setQuests] = useState<PetQuest[]>([
    { id: 'follow_twitter', name: 'Follow on Twitter', icon: '🐦', progress: 25, completed: false, url: 'https://twitter.com/intent/follow?screen_name=CedraQuest' },
    { id: 'join_telegram', name: 'Join Telegram Group', icon: '📱', progress: 25, completed: false, url: 'https://t.me/cedra_quest_official' },
    { id: 'invite_friend', name: 'Invite 1 Friend', icon: '👥', progress: 25, completed: false },
    { id: 'enter_birthyear', name: 'Enter Your Birth Year', icon: '🎂', progress: 25, completed: false },
  ]);
  
  const [showBirthYearInput, setShowBirthYearInput] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load quest status from backend and localStorage
  useEffect(() => {
    if (isOpen) {
      loadPetQuests();
    }
  }, [isOpen]);

  const loadPetQuests = async () => {
    try {
      // Get pet-specific quests from backend
      const backendQuests = await backendAPI.getQuests();
      const petQuests = backendQuests.filter(q => q.category === 'pet' || q.category === 'pet_task');
      
      // Check localStorage for completed quests (for persistence across refreshes)
      const completedQuestIds = JSON.parse(localStorage.getItem('completed_pet_quests') || '[]');
      const storedBirthYear = localStorage.getItem('user_birth_year');
      const isPetHatched = localStorage.getItem('pet_hatched') === 'true';
      
      // Update local quest status based on backend and localStorage
      setQuests(prevQuests => 
        prevQuests.map(quest => {
          // Check if quest is completed in localStorage
          const isCompletedLocally = completedQuestIds.includes(quest.id);
          
          // Check backend quest status
          let backendQuest = null;
          if (quest.id === 'follow_twitter') {
            backendQuest = petQuests.find(bq => bq.title.includes('Twitter') && bq.category === 'pet_task');
          } else if (quest.id === 'join_telegram') {
            backendQuest = petQuests.find(bq => bq.title.includes('Telegram') && bq.category === 'pet_task');
          } else if (quest.id === 'invite_friend') {
            backendQuest = petQuests.find(bq => bq.title.includes('Friend') && bq.category === 'pet_task');
          } else if (quest.id === 'enter_birthyear') {
            // Birth year quest is completed if pet is hatched and birth year is stored
            return {
              ...quest,
              completed: isPetHatched && storedBirthYear !== null
            };
          }
          
          const isCompletedBackend = backendQuest && 
            (backendQuest.user_status === 'COMPLETED' || backendQuest.user_status === 'CLAIMED');
          
          return {
            ...quest,
            completed: isCompletedLocally || isCompletedBackend
          };
        })
      );
    } catch (error) {
      console.error('Failed to load pet quests:', error);
      
      // Fallback to localStorage only
      const completedQuestIds = JSON.parse(localStorage.getItem('completed_pet_quests') || '[]');
      const storedBirthYear = localStorage.getItem('user_birth_year');
      const isPetHatched = localStorage.getItem('pet_hatched') === 'true';
      
      setQuests(prevQuests => 
        prevQuests.map(quest => ({
          ...quest,
          completed: completedQuestIds.includes(quest.id) || 
                    (quest.id === 'enter_birthyear' && isPetHatched && storedBirthYear !== null)
        }))
      );
    }
  };

  const handleCompleteQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    if (questId === 'enter_birthyear') {
      setShowBirthYearInput(true);
      return;
    }

    // For social quests, open URL and mark as completed
    if (quest.url) {
      // Open URL
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openLink) {
        (window as any).Telegram.WebApp.openLink(quest.url);
      } else {
        window.open(quest.url, '_blank');
      }

      // Mark as completed locally
      markQuestCompleted(questId);
      
      // Try to verify with backend
      try {
        const backendQuests = await backendAPI.getQuests();
        const backendQuest = backendQuests.find(bq => 
          (questId === 'follow_twitter' && bq.title.includes('Twitter')) ||
          (questId === 'join_telegram' && bq.title.includes('Telegram'))
        );
        
        if (backendQuest) {
          await backendAPI.verifyQuest(backendQuest.id);
        }
      } catch (error) {
        console.error('Failed to verify quest with backend:', error);
      }
    } else {
      // For other quests, just mark as completed
      markQuestCompleted(questId);
    }
  };

  const markQuestCompleted = (questId: string) => {
    setQuests(prevQuests => 
      prevQuests.map(quest => 
        quest.id === questId ? { ...quest, completed: true } : quest
      )
    );

    // Persist quest completion in localStorage
    const completedQuestIds = JSON.parse(localStorage.getItem('completed_pet_quests') || '[]');
    if (!completedQuestIds.includes(questId)) {
      completedQuestIds.push(questId);
      localStorage.setItem('completed_pet_quests', JSON.stringify(completedQuestIds));
    }

    // Update pet hatch progress
    const newProgress = Math.min(100, currentProgress + 25);
    setPet({ hatchProgress: newProgress });
  };

  const handleSubmitBirthYear = async () => {
    const year = parseInt(birthYear);
    if (year < 1900 || year > new Date().getFullYear() - 5) {
      alert('Please enter a valid birth year');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Try to verify with backend first
      const backendQuests = await backendAPI.getQuests();
      const petHatchQuest = backendQuests.find(bq => bq.title.includes('Hatch') || bq.category === 'pet');
      
      if (petHatchQuest) {
        const result = await backendAPI.verifyQuest(petHatchQuest.id, { birthYear: year });
        if (result.success) {
          // Update pet with birth year and mark quest completed
          setPet({ 
            birthYear: year,
            hatchProgress: Math.min(100, currentProgress + 25)
          });
          
          // Store in localStorage for persistence
          localStorage.setItem('user_birth_year', String(year));
          
          markQuestCompleted('enter_birthyear');
          setShowBirthYearInput(false);
          setBirthYear('');
        } else {
          alert(result.message || 'Failed to submit birth year');
        }
      } else {
        // Fallback to local storage
        setPet({ 
          birthYear: year,
          hatchProgress: Math.min(100, currentProgress + 25)
        });
        
        // Store in localStorage for persistence
        localStorage.setItem('user_birth_year', String(year));
        
        markQuestCompleted('enter_birthyear');
        setShowBirthYearInput(false);
        setBirthYear('');
      }
    } catch (error) {
      console.error('Failed to submit birth year:', error);
      // Fallback to local update
      setPet({ 
        birthYear: year,
        hatchProgress: Math.min(100, currentProgress + 25)
      });
      
      // Store in localStorage for persistence
      localStorage.setItem('user_birth_year', String(year));
      
      markQuestCompleted('enter_birthyear');
      setShowBirthYearInput(false);
      setBirthYear('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = quests.filter(q => q.completed).length;
  const totalProgress = (completedCount / quests.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div style={{ 
        background: 'var(--card-bg-solid)', 
        borderRadius: 'var(--card-radius)', 
        padding: 'clamp(20px, 5vw, 24px)', 
        maxWidth: 'clamp(320px, 90vw, 400px)', 
        width: '100%', 
        maxHeight: '80vh', 
        overflowY: 'auto', 
        backdropFilter: 'blur(20px)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute',
            top: 'clamp(12px, 3vw, 16px)',
            right: 'clamp(12px, 3vw, 16px)',
            background: 'var(--widget-bg)', 
            border: 'none', 
            borderRadius: '50%', 
            width: 'clamp(28px, 7vw, 32px)', 
            height: 'clamp(28px, 7vw, 32px)', 
            color: 'var(--card-text)', 
            cursor: 'pointer', 
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {showBirthYearInput ? (
          <>
            {/* Birth Year Input */}
            <div className="text-center mb-6">
              <div style={{ fontSize: 'clamp(40px, 10vw, 48px)', marginBottom: 'clamp(12px, 3vw, 16px)' }}>🎂</div>
              <h3 style={{ color: 'var(--card-text)', fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: '700', marginBottom: 'clamp(8px, 2vw, 12px)' }}>
                Enter Your Birth Year
              </h3>
              <p style={{ color: 'var(--card-text-secondary)', fontSize: 'clamp(14px, 3.5vw, 16px)', lineHeight: '1.4' }}>
                Your birth year determines your pet's zodiac traits
              </p>
            </div>
            
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="e.g. 1995"
              min="1900"
              max={new Date().getFullYear() - 5}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: 'clamp(12px, 3vw, 16px)',
                borderRadius: 'clamp(10px, 2.5vw, 12px)',
                border: '1px solid var(--card-border)',
                background: 'var(--widget-bg)',
                color: 'var(--card-text)',
                fontSize: 'clamp(16px, 4vw, 18px)',
                textAlign: 'center',
                outline: 'none',
                marginBottom: 'clamp(16px, 4vw, 20px)'
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowBirthYearInput(false)}
                disabled={isSubmitting}
                style={{ 
                  flex: 1, 
                  padding: 'clamp(12px, 3vw, 14px)', 
                  borderRadius: 'clamp(10px, 2.5vw, 12px)', 
                  background: 'var(--widget-bg)', 
                  border: 'none', 
                  color: 'var(--card-text)', 
                  fontSize: 'clamp(14px, 3.5vw, 16px)', 
                  fontWeight: '600', 
                  cursor: 'pointer' 
                }}
              >
                Back
              </button>
              <button
                onClick={handleSubmitBirthYear}
                disabled={!birthYear || isSubmitting || parseInt(birthYear) < 1900 || parseInt(birthYear) > new Date().getFullYear() - 5}
                style={{
                  flex: 1,
                  padding: 'clamp(12px, 3vw, 14px)',
                  borderRadius: 'clamp(10px, 2.5vw, 12px)',
                  background: birthYear && !isSubmitting && parseInt(birthYear) >= 1900 && parseInt(birthYear) <= new Date().getFullYear() - 5
                    ? 'linear-gradient(135deg, #ffd700, #f5a623)' 
                    : 'var(--widget-bg)',
                  border: 'none',
                  color: birthYear && !isSubmitting && parseInt(birthYear) >= 1900 && parseInt(birthYear) <= new Date().getFullYear() - 5 ? '#1a1a2e' : 'var(--card-text-muted)',
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  fontWeight: '700',
                  cursor: birthYear && !isSubmitting ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm ✓'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <img 
                src={
                  totalProgress >= 100 ? '/icons/egg4.PNG' :
                  totalProgress >= 75 ? '/icons/egg3.PNG' :
                  totalProgress >= 25 ? '/icons/egg2.PNG' :
                  '/icons/egg1.PNG'
                }
                alt="Egg"
                style={{ 
                  width: 'clamp(60px, 15vw, 80px)',
                  height: 'auto',
                  margin: '0 auto clamp(12px, 3vw, 16px)',
                }}
              />
              <h3 style={{ color: 'var(--card-text)', fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: '700', marginBottom: 'clamp(4px, 1vw, 8px)' }}>
                Complete all tasks to hatch your egg
              </h3>
              <p style={{ color: 'var(--card-text-muted)', fontSize: 'clamp(12px, 3vw, 14px)' }}>
                {completedCount}/{quests.length} tasks completed
              </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 'clamp(20px, 5vw, 24px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(6px, 1.5vw, 8px)' }}>
                <span style={{ color: 'var(--card-text-muted)', fontSize: 'clamp(12px, 3vw, 14px)' }}>Progress</span>
                <span style={{ color: '#f5a623', fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '600' }}>{Math.round(totalProgress)}%</span>
              </div>
              <div style={{ height: 'clamp(8px, 2vw, 10px)', background: 'var(--widget-bg)', borderRadius: 'clamp(4px, 1vw, 5px)', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${totalProgress}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #ffd700, #f5a623)', 
                  borderRadius: 'clamp(4px, 1vw, 5px)', 
                  transition: 'width 0.5s ease' 
                }} />
              </div>
            </div>

            {/* Quest List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 12px)', marginBottom: 'clamp(20px, 5vw, 24px)' }}>
              {quests.map((quest) => (
                <button
                  key={quest.id}
                  onClick={() => handleCompleteQuest(quest.id)}
                  disabled={quest.completed}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(12px, 3vw, 16px)',
                    padding: 'clamp(12px, 3vw, 16px)',
                    borderRadius: 'clamp(12px, 3vw, 16px)',
                    background: quest.completed ? 'rgba(34, 197, 94, 0.15)' : 'var(--card-bg)',
                    border: quest.completed ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--card-border)',
                    cursor: quest.completed ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ 
                    width: 'clamp(36px, 9vw, 44px)', 
                    height: 'clamp(36px, 9vw, 44px)', 
                    borderRadius: 'clamp(8px, 2vw, 12px)', 
                    background: quest.completed ? 'rgba(34, 197, 94, 0.2)' : 'var(--widget-bg)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 'clamp(16px, 4vw, 20px)' 
                  }}>
                    {quest.completed ? '✓' : quest.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: quest.completed ? 'rgba(34, 197, 94, 1)' : 'var(--card-text)', 
                      fontSize: 'clamp(14px, 3.5vw, 16px)', 
                      fontWeight: '600',
                      marginBottom: 'clamp(2px, 0.5vw, 4px)'
                    }}>
                      {quest.name}
                    </div>
                    <div style={{ 
                      color: quest.completed ? 'rgba(34, 197, 94, 0.7)' : 'var(--card-text-muted)', 
                      fontSize: 'clamp(11px, 2.8vw, 13px)' 
                    }}>
                      +{quest.progress}% progress
                    </div>
                  </div>
                  {!quest.completed && (
                    <span style={{ color: 'var(--card-text-muted)', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>›</span>
                  )}
                </button>
              ))}
            </div>

            {/* Hatch Button */}
            <button
              onClick={onHatch}
              disabled={totalProgress < 100}
              style={{
                width: '100%',
                padding: 'clamp(14px, 3.5vw, 18px)',
                borderRadius: 'clamp(12px, 3vw, 16px)',
                background: totalProgress >= 100 
                  ? 'linear-gradient(135deg, #ffd700, #f5a623)' 
                  : 'var(--widget-bg)',
                border: 'none',
                color: totalProgress >= 100 ? '#1a1a2e' : 'var(--card-text-muted)',
                fontSize: 'clamp(16px, 4vw, 18px)',
                fontWeight: '700',
                cursor: totalProgress >= 100 ? 'pointer' : 'not-allowed',
                boxShadow: totalProgress >= 100 ? '0 4px 16px rgba(255, 215, 0, 0.4)' : 'none'
              }}
            >
              🐣 {totalProgress >= 100 ? 'Hatch Now!' : `Complete ${quests.length - completedCount} more tasks`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}