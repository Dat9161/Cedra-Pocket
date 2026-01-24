'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, usePet, useEnergy, useGameSystemActions, useAppStore } from '../../store/useAppStore';
import { PetQuestModal } from './PetQuestModal';
// import { backendAPI } from '../../services/backend-api.service';

const getCoinsPerMinute = (level: number) => {
  return 100 + (level - 1) * 50;
};

const COIN_INTERVAL_SECONDS = 60;

// 12 con giáp theo năm sinh (Việt Nam: Mão = Mèo/Cat)
const ZODIAC_ANIMALS = [
  { id: 'rat', name: 'Rat', emoji: '🐀', nameVi: 'Tý', image: 'mouse', hasLevels: true }, // mouse1-mouse5
  { id: 'ox', name: 'Ox', emoji: '🐂', nameVi: 'Sửu', image: 'buff', hasLevels: true }, // buff1-buff5
  { id: 'tiger', name: 'Tiger', emoji: '🐅', nameVi: 'Dần', image: 'tiger', hasLevels: true }, // tiger1-tiger5
  { id: 'cat', name: 'Cat', emoji: '🐱', nameVi: 'Mão', image: 'cat', hasLevels: true }, // cat1-cat5
  { id: 'dragon', name: 'Dragon', emoji: '🐉', nameVi: 'Thìn', image: 'dragon', hasLevels: true }, // dragon1-dragon5
  { id: 'snake', name: 'Snake', emoji: '🐍', nameVi: 'Tỵ', image: 'snake', hasLevels: true }, // snake1-snake5
  { id: 'horse', name: 'Horse', emoji: '🐴', nameVi: 'Ngọ', image: 'horse', hasLevels: true }, // horse1-horse5
  { id: 'goat', name: 'Goat', emoji: '🐐', nameVi: 'Mùi', image: 'goat', hasLevels: true }, // goat1-goat5
  { id: 'monkey', name: 'Monkey', emoji: '🐵', nameVi: 'Thân', image: 'monkey', hasLevels: true }, // monkey1-monkey5
  { id: 'rooster', name: 'Rooster', emoji: '🐓', nameVi: 'Dậu', image: 'chicken', hasLevels: true }, // chicken1-chicken5
  { id: 'dog', name: 'Dog', emoji: '🐕', nameVi: 'Tuất', image: 'dog', hasLevels: true }, // dog1-dog5
  { id: 'pig', name: 'Pig', emoji: '🐷', nameVi: 'Hợi', image: 'pig', hasLevels: true }, // pig1-pig5
];

// Lấy ảnh pet theo zodiac và level
// Mỗi 2 level đổi ảnh 1 lần: lv1-2 = img1, lv3-4 = img2, ...
const getPetImage = (zodiac: typeof ZODIAC_ANIMALS[0], level: number) => {
  if (zodiac.hasLevels) {
    // Pet có nhiều level (tất cả animals đều có 5 levels)
    const imgLevel = Math.ceil(level / 2); // 1-2->1, 3-4->2, 5-6->3, 7-8->4, 9-10->5
    
    // Xử lý extension dựa trên từng animal và level cụ thể
    const getExtension = (animalImage: string, level: number) => {
      // Các trường hợp đặc biệt có .png thay vì .PNG
      const pngCases = [
        'mouse1', 'chicken1', 'dog3', 'horse2', 'horse5', 'pig3', 'pig4', 'snake3', 'snake4', 'tiger'
      ];
      
      const fileName = `${animalImage}${level}`;
      return pngCases.includes(fileName) ? '.png' : '.PNG';
    };
    
    const extension = getExtension(zodiac.image, imgLevel);
    return `/pet/${zodiac.image}${imgLevel}${extension}`;
  }
  return `/pet/${zodiac.image}`;
};

// Lấy size pet theo level (level chẵn to hơn level lẻ)
const getPetSize = (level: number) => {
  const baseSize = 140;
  const imgLevel = Math.ceil(level / 2); // 1, 2, 3, 4, 5
  const isEvenLevel = level % 2 === 0;
  // Mỗi cấp ảnh tăng 15px, level chẵn thêm 20px
  return baseSize + (imgLevel - 1) * 15 + (isEvenLevel ? 20 : 0);
};

// Tính con giáp từ năm sinh
const getZodiacFromYear = (year: number) => {
  // Năm 1900 là năm Tý (Rat), index 0
  const index = (year - 1900) % 12;
  const adjustedIndex = index < 0 ? index + 12 : index;
  return ZODIAC_ANIMALS[adjustedIndex];
};

export function PetScreen() {
  const user = useUser();
  const pet = usePet();
  const energy = useEnergy();
  const { updateBalance, setPet } = useAppStore();
  const { 
    feedGamePet, 
    loadGameDashboard,
    regenerateEnergy,
    claimGamePetRewards 
  } = useGameSystemActions();
  const hasFetchedRef = useRef(false);
  const hasLoadedFromBackend = useRef(false);
  
  // Lấy con giáp từ năm sinh
  const zodiac = pet.birthYear ? getZodiacFromYear(pet.birthYear) : null;
  const petName = zodiac ? zodiac.name : (user?.username ? `${user.username}'s Pet` : 'My Pet');

  const [isFeeding, setIsFeeding] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [claimedCoins, setClaimedCoins] = useState(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpGained, setXPGained] = useState(0);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showRecoverInviter, setShowRecoverInviter] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviterAddress, setInviterAddress] = useState('');
  const [showHatchModal, setShowHatchModal] = useState(false);
  const [isHatching, setIsHatching] = useState(false);
  const [debugData] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Hatch tasks - moved to PetQuestModal
  
  const petBoosts = [
    { 
      id: 'food_bowl', 
      name: 'Food Bowl', 
      desc: 'Increase hunger capacity', 
      icon: '🍖', 
      cost: 100, 
      level: 1,
      expGain: 50, // EXP gained when purchased
      effect: 'Hunger +20 capacity'
    },
    { 
      id: 'cozy_bed', 
      name: 'Cozy Bed', 
      desc: 'Increase passive mining speed', 
      icon: '🛏️', 
      cost: 200, 
      level: 1,
      expGain: 100, // EXP gained when purchased
      effect: 'Mining speed +10%'
    },
    { 
      id: 'magic_collar', 
      name: 'Magic Collar', 
      desc: 'Boost mining speed by 1.5x.. 2x.. 3x!', 
      icon: '✨', 
      cost: 500, 
      level: 1,
      expGain: 250, // EXP gained when purchased
      effect: 'Mining speed +50%'
    },
    { 
      id: 'golden_treat', 
      name: 'Golden Treat', 
      desc: 'Increase EXP gain per feed', 
      icon: '🦴', 
      cost: 300, 
      level: 1,
      expGain: 150, // EXP gained when purchased
      effect: 'Care EXP +5 per feed'
    },
  ];
  
  const [coinTimer, setCoinTimer] = useState(() => {
    if (pet.pendingCoins > 0) return 0;
    const elapsed = Math.floor((Date.now() - pet.lastCoinTime) / 1000);
    return Math.max(0, COIN_INTERVAL_SECONDS - elapsed);
  });

  useEffect(() => {
    const loadGameData = async () => {
      if (hasFetchedRef.current) return;
      
      try {
        hasFetchedRef.current = true;
        console.log('🎮 Loading game dashboard...');
        
        // Load complete game dashboard (pet, energy, ranking, stats)
        await loadGameDashboard();
        hasLoadedFromBackend.current = true; // Mark that we've loaded from backend
        
        // Also try to get pet status directly for debugging
        try {
          // const petStatus = await backendAPI.getGamePetStatus();
          // setDebugData({ type: 'Pet Status', data: petStatus });
          // console.log('🐾 Direct pet status:', petStatus);
          console.log('🐾 Pet status debug disabled');
        } catch (debugError) {
          console.log('⚠️ Failed to get direct pet status:', debugError);
        }
        
        // Regenerate energy based on time elapsed
        regenerateEnergy();
        
        console.log('✅ Game dashboard loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load game data:', error);
        // Fallback to old pet API if new system fails
        try {
          // const petData = await backendAPI.getPet();
          // setPet(petData);
          console.log('🐾 Old pet API disabled');
        } catch (fallbackError) {
          console.error('❌ Fallback pet loading also failed:', fallbackError);
        }
      }
    };
    
    loadGameData();
  }, []); // Empty dependency array - only run once

  // Energy regeneration timer
  useEffect(() => {
    const interval = setInterval(() => {
      regenerateEnergy();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []); // Empty dependency array - regenerateEnergy is stable

  // Timer logic - chỉ chạy khi pet đã nở
  useEffect(() => {
    if (!pet.hatched) return;
    
    // CRITICAL: Don't generate coins immediately after loading from backend
    if (hasLoadedFromBackend.current && pet.pendingCoins > 0) {
      console.log(`🚫 Skipping coin generation - just loaded from backend with ${pet.pendingCoins} coins`);
      setCoinTimer(0);
      hasLoadedFromBackend.current = false; // Reset flag
      return;
    }
    
    const elapsed = Math.floor((Date.now() - pet.lastCoinTime) / 1000);
    const remaining = COIN_INTERVAL_SECONDS - elapsed;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏰ Timer useEffect: elapsed=${elapsed}s, remaining=${remaining}s, pendingCoins=${pet.pendingCoins}, level=${pet.level}`);
    }
    
    // CRITICAL: If there are already pending coins, just show timer as 0 and DON'T generate more
    if (pet.pendingCoins > 0) { 
      setCoinTimer(0); 
      console.log(`🚫 Skipping coin generation - already have ${pet.pendingCoins} pending coins`);
      return; 
    }
    
    // If enough time has passed, generate coins immediately (only once)
    if (remaining <= 0) {
      const coins = getCoinsPerMinute(pet.level);
      console.log(`💰 Generating ${coins} coins for level ${pet.level} (elapsed: ${elapsed}s)`);
      // DON'T update lastCoinTime here - it should only be updated when user claims
      setPet({ pendingCoins: coins });
      setCoinTimer(0);
      return;
    }
    
    // Set initial timer
    setCoinTimer(remaining);
    console.log(`⏰ Setting timer to ${remaining}s`);
    
    // Start countdown timer - SIMPLIFIED: Only count down, don't generate coins here
    const interval = setInterval(() => {
      setCoinTimer(prev => {
        if (prev <= 1) {
          // Timer reached 0 - trigger useEffect to check for coin generation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pet.hatched, pet.lastCoinTime, pet.pendingCoins, pet.level]); // Include level to recalculate when pet levels up

  // Separate effect to handle coin generation when timer reaches exactly 0
  useEffect(() => {
    // Don't generate coins if we just loaded from backend
    if (hasLoadedFromBackend.current) return;
    
    // Only run when timer is exactly 0 and conditions are met
    if (coinTimer !== 0 || !pet.hatched || pet.pendingCoins > 0) return;
    
    const elapsed = Math.floor((Date.now() - pet.lastCoinTime) / 1000);
    
    // Double-check: only generate if enough time has passed
    if (elapsed >= COIN_INTERVAL_SECONDS) {
      const coins = getCoinsPerMinute(pet.level);
      console.log(`💰 Timer-triggered coin generation: ${coins} coins for level ${pet.level} (${elapsed}s elapsed)`);
      setPet({ pendingCoins: coins });
    }
  }, [coinTimer]); // Only trigger when coinTimer changes to 0

  const [isClaimingCoins, setIsClaimingCoins] = useState(false);

  // Helper function to check if claiming is allowed
  const canClaim = useCallback(() => {
    if (pet.pendingCoins <= 0) return false;
    
    const elapsed = Math.floor((Date.now() - pet.lastCoinTime) / 1000);
    const timeRemaining = COIN_INTERVAL_SECONDS - elapsed;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 canClaim check: pendingCoins=${pet.pendingCoins}, elapsed=${elapsed}s, remaining=${timeRemaining}s`);
    }
    
    // Can claim if there are pending coins AND enough time has passed
    return pet.pendingCoins > 0 && timeRemaining <= 0;
  }, [pet.pendingCoins, pet.lastCoinTime]);

  const collectCoins = useCallback(async () => {
    // Check if enough time has passed since last claim
    const elapsed = Math.floor((Date.now() - pet.lastCoinTime) / 1000);
    const timeRemaining = COIN_INTERVAL_SECONDS - elapsed;
    
    // Prevent claims if not enough time has passed AND no pending coins
    if (timeRemaining > 0 && pet.pendingCoins <= 0) {
      console.log(`⚠️ Claim blocked: Need to wait ${timeRemaining} more seconds`);
      return;
    }
    
    // Prevent multiple simultaneous claims
    if (isClaimingCoins || pet.pendingCoins <= 0) {
      console.log('⚠️ Claim blocked: already claiming or no coins available');
      return;
    }

    setIsClaimingCoins(true);
    
    try {
      const coinsToCollect = pet.pendingCoins;
      
      // Immediately update UI for instant feedback
      setClaimedCoins(coinsToCollect);
      setShowCoinAnimation(true);
      setTimeout(() => setShowCoinAnimation(false), 1000);
      
      console.log(`💰 Claiming ${coinsToCollect} coins via backend...`);
      
      // Try to claim via backend first
      try {
        await claimGamePetRewards();
        console.log(`✅ Successfully claimed ${coinsToCollect} coins via backend`);
      } catch (backendError) {
        console.warn('⚠️ Backend claim failed, using local fallback:', backendError);
        
        // Fallback to local update
        setPet({ 
          pendingCoins: 0, 
          lastCoinTime: Date.now() 
        });
        setCoinTimer(COIN_INTERVAL_SECONDS);
        await updateBalance(coinsToCollect, 'token');
        console.log(`✅ Successfully claimed ${coinsToCollect} coins locally`);
      }
    } catch (error) {
      console.error('❌ Failed to claim coins:', error);
      // Revert pet state if failed
      setPet({ 
        pendingCoins: pet.pendingCoins, 
        lastCoinTime: Date.now() - COIN_INTERVAL_SECONDS * 1000 
      });
    } finally {
      setIsClaimingCoins(false);
    }
  }, [pet.pendingCoins, pet.lastCoinTime, setPet, updateBalance, isClaimingCoins]);

  const handleFeed = async () => {
    // FIXED: Prevent multiple simultaneous feeds and check conditions properly
    if (isFeeding || (user?.tokenBalance || 0) < 20 || pet.level >= 10) {
      if (isFeeding) {
        console.log('⚠️ Already feeding, please wait...');
      } else if ((user?.tokenBalance || 0) < 20) {
        console.log('⚠️ Not enough points to feed (need 20 points)');
      } else if (pet.level >= 10) {
        console.log('⭐ Pet is at maximum level (10)');
      }
      return;
    }

    setIsFeeding(true);
    
    // FIXED: Immediately update UI for instant feedback
    const feedCost = 20;
    const xpGain = 20;
    
    // Update balance immediately to prevent race conditions
    updateBalance(-feedCost, 'token');
    
    try {
      // Store current level to detect level up
      const currentLevel = pet.level;
      
      // Use new game system API to feed pet
      await feedGamePet(1);
      console.log('✅ Pet fed via backend system');
      
      // FIXED: Show XP gain animation for backend success
      setShowXPAnimation(true);
      setXPGained(20); // Standard XP gain
      
      // Check for level up after a short delay (to let useAppStore update)
      setTimeout(() => {
        if (pet.level > currentLevel) {
          setShowLevelUpAnimation(true);
          console.log(`🎉 Level up detected: ${currentLevel} → ${pet.level}`);
        }
      }, 200);
      
      setTimeout(() => {
        setShowXPAnimation(false);
        setShowLevelUpAnimation(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Failed to feed via backend, using local fallback:', error);
      
      // Fallback to local system with CORRECT logic
      const currentExp = pet.exp;
      const newExp = currentExp + xpGain;
      const newHunger = Math.min(100, pet.hunger + 20);
      
      let newPetData: Partial<typeof pet>;
      let leveledUp = false;
      
      // FIXED: Use correct XP threshold for level up
      if (newExp >= 1200 && pet.level < 10) { // 1200 XP needed for level up
        // Level up - reset XP to remainder
        const remainingXP = newExp - 1200;
        newPetData = { 
          hunger: newHunger, 
          level: pet.level + 1, 
          exp: remainingXP, 
          maxExp: 1200 // Keep consistent maxExp
        };
        leveledUp = true;
        console.log(`🎉 Pet leveled up! Level ${pet.level} → ${pet.level + 1}, XP: ${remainingXP}/1200`);
      } else if (pet.level >= 10) {
        // Max level reached, cap XP at max
        newPetData = { 
          hunger: newHunger, 
          exp: Math.min(newExp, 1200) // Cap at max XP
        };
        console.log(`⭐ Pet at max level (10), XP capped at ${Math.min(newExp, 1200)}/1200`);
      } else {
        // Normal XP gain
        newPetData = { 
          hunger: newHunger, 
          exp: newExp 
        };
        console.log(`🍖 Pet fed! XP: ${newExp}/1200 (Level ${pet.level})`);
      }
      
      setPet(newPetData);
      
      // FIXED: Show XP gain animation
      setShowXPAnimation(true);
      setXPGained(xpGain);
      if (leveledUp) {
        setShowLevelUpAnimation(true);
      }
      setTimeout(() => {
        setShowXPAnimation(false);
        setShowLevelUpAnimation(false);
      }, 2000);
    }
    
    setTimeout(() => setIsFeeding(false), 1000);
  };

  const handleCareItems = () => setShowBoostModal(true);

  const handleBuyCareItem = (boost: typeof petBoosts[0]) => {
    if ((user?.tokenBalance || 0) >= boost.cost) {
      updateBalance(-boost.cost, 'token');
      
      // FIXED: Boosts now provide EXP instead of direct level up
      const currentExp = pet.exp;
      const newExp = currentExp + boost.expGain;
      const newHunger = Math.min(100, pet.hunger + 10); // Small hunger boost
      
      let newPetData: Partial<typeof pet>;
      let leveledUp = false;
      
      // Check for level up with correct XP threshold
      if (newExp >= 1200 && pet.level < 10) {
        // Level up - reset XP to remainder
        const remainingXP = newExp - 1200;
        newPetData = { 
          hunger: newHunger, 
          level: pet.level + 1, 
          exp: remainingXP, 
          maxExp: 1200
        };
        leveledUp = true;
        console.log(`🎉 Pet leveled up from care item! Level ${pet.level} → ${pet.level + 1}, XP: ${remainingXP}/1200`);
      } else if (pet.level >= 10) {
        // Max level reached, cap XP at max
        newPetData = { 
          hunger: newHunger, 
          exp: Math.min(newExp, 1200)
        };
        console.log(`⭐ Pet at max level (10), XP capped at ${Math.min(newExp, 1200)}/1200`);
      } else {
        // Normal XP gain
        newPetData = { 
          hunger: newHunger, 
          exp: newExp 
        };
        console.log(`💰 Care item purchased! ${boost.name}: +${boost.expGain} XP (${newExp}/1200)`);
      }
      
      setPet(newPetData);
      
      // Show XP gain animation
      setShowXPAnimation(true);
      setXPGained(boost.expGain);
      if (leveledUp) {
        setShowLevelUpAnimation(true);
      }
      setTimeout(() => {
        setShowXPAnimation(false);
        setShowLevelUpAnimation(false);
      }, 2000);
      
      // Close modal after purchase
      setShowBoostModal(false);
      
      console.log(`💰 Bought care item: ${boost.name} for ${boost.cost} points, gained ${boost.expGain} XP`);
    }
  };

  // Hatch pet - chỉ khi đã hoàn thành tất cả nhiệm vụ
  const [hatchStage, setHatchStage] = useState(0); // 0: not started, 1: shaking, 2: cracking, 3: pet reveal
  
  const handleHatch = () => {
    // Validate that all quests are completed
    const completedQuestIds = JSON.parse(localStorage.getItem('completed_pet_quests') || '[]');
    const storedBirthYear = localStorage.getItem('user_birth_year');
    const requiredQuests = ['follow_twitter', 'join_telegram', 'invite_friend', 'enter_birthyear'];
    
    // Check if all required quests are completed
    const allQuestsCompleted = requiredQuests.every(questId => 
      completedQuestIds.includes(questId) || (questId === 'enter_birthyear' && storedBirthYear)
    );
    
    if (!allQuestsCompleted) {
      alert('You must complete all tasks before hatching your pet egg!');
      return;
    }
    
    if (!storedBirthYear) {
      alert('You must enter your birth year before hatching your pet egg!');
      return;
    }
    
    if ((pet.hatchProgress || 0) >= 100) {
      setShowHatchModal(false);
      setIsHatching(true);
      setHatchStage(1); // Trứng rung
      
      // Stage 2: Pet xuất hiện
      setTimeout(() => setHatchStage(2), 1000);
      
      // Complete hatch - reset pendingCoins = 0 and mark as hatched
      setTimeout(() => {
        setPet({ hatched: true, pendingCoins: 0, lastCoinTime: Date.now() });
        // Store hatched status in localStorage for persistence
        localStorage.setItem('pet_hatched', 'true');
        setIsHatching(false);
        setHatchStage(0);
      }, 3000);
    } else {
      alert('Complete all tasks to hatch your pet egg!');
    }
  };

  // Nếu pet chưa nở - hiển thị quả trứng
  if (!pet.hatched) {
    const progress = pet.hatchProgress || 0;
    
    // Đang trong quá trình hatch - hiển thị animation trứng vỡ
    if (isHatching && pet.birthYear) {
      return (
        <div className="flex flex-col items-center justify-center relative" style={{ backgroundColor: 'transparent', minHeight: 'calc(100vh - 80px)', padding: '20px' }}>
          <div className="flex flex-col items-center" style={{ position: 'relative', minHeight: '200px' }}>
            
            {/* Trứng - chỉ hiện ở stage 1 */}
            {hatchStage === 1 && (
              <div style={{ animation: 'eggShake 0.15s ease-in-out infinite' }}>
                <img 
                  src="/icons/egg3.PNG"
                  alt="Egg" 
                  style={{ 
                    width: '150px', 
                    height: 'auto',
                    filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))',
                  }} 
                />
              </div>
            )}
            
            {/* Pet - xuất hiện từ stage 2 trở đi */}
            {hatchStage >= 2 && (
              <>
                <img 
                  src={getPetImage(getZodiacFromYear(pet.birthYear), 1)}
                  alt={getZodiacFromYear(pet.birthYear).name}
                  style={{
                    width: '160px',
                    height: 'auto',
                    filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.5))',
                    animation: 'petAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  }}
                />
                
                {/* Tên pet */}
                <div style={{ 
                  color: '#ffd700', 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  marginTop: '20px', 
                  animation: 'fadeIn 0.5s ease-out 0.3s both',
                }}>
                  {getZodiacFromYear(pet.birthYear).name}
                </div>
              </>
            )}
          </div>
          
          <style jsx>{`
            @keyframes eggShake {
              0%, 100% { transform: translateX(0) rotate(0); }
              20% { transform: translateX(-4px) rotate(-3deg); }
              40% { transform: translateX(4px) rotate(3deg); }
              60% { transform: translateX(-3px) rotate(-2deg); }
              80% { transform: translateX(3px) rotate(2deg); }
            }
            @keyframes petAppear {
              0% { transform: scale(0); opacity: 0; }
              60% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center relative" style={{ backgroundColor: 'transparent', minHeight: 'calc(100vh - 80px)', padding: '20px' }}>
        {/* Egg Display */}
        <div className="flex flex-col items-center">
          <div style={{ fontSize: 'var(--fs-base)', color: 'rgba(255,255,255,0.6)', marginBottom: 'clamp(12px, 3vw, 20px)' }}>
            Your egg is waiting to hatch!
          </div>
          
          {/* Egg Image with Effects */}
          <div 
            className="relative"
            style={{ 
              animation: progress >= 100 ? 'eggShake 0.3s infinite' : 
                        progress >= 75 ? 'eggWobble 1s ease-in-out infinite' :
                        progress >= 25 ? 'eggWobble 1.5s ease-in-out infinite' :
                        'eggFloat 3s ease-in-out infinite',
            }}
          >
            {/* Glow effect */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: progress >= 75 ? '180px' : '150px',
              height: progress >= 75 ? '180px' : '150px',
              borderRadius: '50%',
              background: progress >= 100 ? 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)' :
                         progress >= 75 ? 'radial-gradient(circle, rgba(255,165,0,0.4) 0%, transparent 70%)' :
                         progress >= 25 ? 'radial-gradient(circle, rgba(255,200,100,0.3) 0%, transparent 70%)' :
                         'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
              animation: progress >= 75 ? 'pulse 1.5s ease-in-out infinite' : 'none',
              zIndex: -1,
            }} />
            
            {/* Sparkles for higher progress */}
            {progress >= 50 && (
              <>
                <div style={{ position: 'absolute', top: '-10px', left: '20%', fontSize: '16px', animation: 'sparkle 1s ease-in-out infinite' }}>✨</div>
                <div style={{ position: 'absolute', top: '10%', right: '-5px', fontSize: '14px', animation: 'sparkle 1.2s ease-in-out infinite 0.3s' }}>✨</div>
              </>
            )}
            {progress >= 75 && (
              <>
                <div style={{ position: 'absolute', bottom: '10%', left: '-5px', fontSize: '14px', animation: 'sparkle 0.8s ease-in-out infinite 0.5s' }}>⭐</div>
                <div style={{ position: 'absolute', top: '30%', right: '-10px', fontSize: '12px', animation: 'sparkle 1s ease-in-out infinite 0.2s' }}>💫</div>
              </>
            )}
            {progress >= 100 && (
              <>
                <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', fontSize: '20px', animation: 'bounce 0.5s ease-in-out infinite' }}>🎉</div>
                <div style={{ position: 'absolute', bottom: '-10px', left: '30%', fontSize: '14px', animation: 'sparkle 0.6s ease-in-out infinite' }}>🌟</div>
                <div style={{ position: 'absolute', bottom: '-10px', right: '30%', fontSize: '14px', animation: 'sparkle 0.6s ease-in-out infinite 0.3s' }}>🌟</div>
              </>
            )}
            
            {/* Egg stages based on progress */}
            <img 
              src={
                progress >= 100 ? '/icons/egg4.PNG' :
                progress >= 75 ? '/icons/egg3.PNG' :
                progress >= 25 ? '/icons/egg2.PNG' :
                '/icons/egg1.PNG'
              }
              alt="Egg"
              style={{ 
                width: '150px',
                height: 'auto',
                filter: progress >= 100 ? 'drop-shadow(0 0 30px rgba(255,215,0,0.8))' :
                       progress >= 75 ? 'drop-shadow(0 0 20px rgba(255,165,0,0.6))' :
                       progress >= 25 ? 'drop-shadow(0 15px 30px rgba(255,200,100,0.5))' :
                       'drop-shadow(0 20px 40px rgba(255,200,100,0.3))',
                transition: 'filter 0.5s ease',
              }}
            />
          </div>

          {/* Progress Bar */}
          <div style={{ width: 'clamp(160px, 50vw, 280px)', marginTop: 'clamp(16px, 4vw, 32px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(4px, 1vw, 8px)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--fs-sm)' }}>Hatch Progress</span>
              <span style={{ color: '#ffd700', fontSize: 'var(--fs-sm)', fontWeight: '600' }}>{pet.hatchProgress || 0}%</span>
            </div>
            <div style={{ height: 'clamp(6px, 1.5vw, 10px)', background: 'rgba(255,255,255,0.2)', borderRadius: 'clamp(3px, 0.8vw, 5px)', overflow: 'hidden' }}>
              <div style={{ width: `${pet.hatchProgress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #ffd700, #f5a623)', borderRadius: 'clamp(3px, 0.8vw, 5px)', transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Hatch Button */}
          <button
            onClick={() => setShowHatchModal(true)}
            className="transition-all hover:scale-105 active:scale-95"
            style={{
              marginTop: 'clamp(16px, 4vw, 32px)',
              padding: 'clamp(12px, 3vw, 18px) clamp(32px, 8vw, 48px)',
              borderRadius: 'clamp(12px, 3vw, 20px)',
              background: 'linear-gradient(135deg, #ffd700, #f5a623)',
              border: 'none',
              color: '#1a1a2e',
              fontSize: 'var(--fs-md)',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Hatch
          </button>

          {/* Info */}
          <div style={{ marginTop: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
            Tap to see hatch tasks
          </div>
        </div>

        {/* Pet Quest Modal */}
        <PetQuestModal
          isOpen={showHatchModal}
          onClose={() => setShowHatchModal(false)}
          onHatch={handleHatch}
          currentProgress={pet.hatchProgress || 0}
        />

        <style jsx>{`
          @keyframes eggWobble {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
          }
          @keyframes eggFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes eggShake {
            0%, 100% { transform: translateX(0) rotate(0); }
            25% { transform: translateX(-5px) rotate(-5deg); }
            75% { transform: translateX(5px) rotate(5deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-10px); }
          }
          @keyframes eggCrack {
            0%, 100% { transform: scale(1) rotate(0); }
            25% { transform: scale(1.05) rotate(-3deg); }
            50% { transform: scale(0.95) rotate(3deg); }
            75% { transform: scale(1.02) rotate(-2deg); }
          }
          @keyframes petReveal {
            0% { transform: scale(0) rotate(-20deg); opacity: 0; }
            50% { transform: scale(1.2) rotate(10deg); opacity: 1; }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Pet đã nở - hiển thị giao diện chính
  return (
    <div className="flex flex-col relative" style={{ backgroundColor: 'transparent', height: 'calc(100vh - 160px)', overflow: 'visible', paddingBottom: '80px' }}>
      {/* Pet Info - Top Left */}
      <div className="flex items-center justify-between" style={{ marginTop: '16px', marginBottom: '8px', marginLeft: '20px', marginRight: '20px' }}>
        <div className="flex items-center">
          <div 
            className="relative flex items-center justify-center mr-3" 
            style={{ 
              width: 'clamp(32px, 8vw, 48px)', 
              height: 'clamp(32px, 8vw, 48px)', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)' 
            }}
          >
            <svg className="absolute" viewBox="0 0 40 40" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray={`${(pet.exp / pet.maxExp) * 100} 100`} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 'var(--fs-base)', fontWeight: '700', color: '#fff' }}>{pet.level}</span>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--fs-md)', fontWeight: '600' }}>{petName}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--fs-sm)' }}>EXP: {pet.exp}/{pet.maxExp}</div>
          </div>
        </div>

        {/* Energy Display - Top Right */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 'var(--fs-md)' }}>⚡</span>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--fs-md)', fontWeight: '600' }}>
              {energy.currentEnergy}/{energy.maxEnergy}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--fs-xs)' }}>Energy</div>
          </div>
        </div>
      </div>

      {/* Storage Display - Above Pet */}
      <div className="flex flex-col items-center" style={{ marginTop: '20px', marginBottom: '25px' }}>
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 'clamp(32px, 8vw, 48px)' }}>🪙</span>
          <span style={{ 
            fontSize: 'clamp(36px, 10vw, 56px)', 
            fontWeight: '700', 
            color: '#ffd700',
            textShadow: '0 2px 8px rgba(255, 215, 0, 0.3)'
          }}>{pet.pendingCoins}</span>
        </div>
      </div>

      {/* Pet Image - Below coins */}
      <div className="flex flex-col items-center justify-center relative" style={{ marginTop: '10px', marginBottom: '10px' }}>
        {showCoinAnimation && (
          <div style={{ 
            position: 'absolute', 
            top: '10%', 
            fontSize: 'var(--fs-xl)', 
            fontWeight: '700',
            color: '#ffd700',
            textShadow: '0 0 20px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.3)',
            animation: 'floatUp 1.2s ease-out forwards', 
            zIndex: 10,
          }}>
            +{claimedCoins} 🪙
          </div>
        )}
        
        {/* FIXED: XP Gain Animation */}
        {showXPAnimation && (
          <div style={{ 
            position: 'absolute', 
            top: '20%', 
            left: '70%',
            fontSize: 'var(--fs-lg)', 
            fontWeight: '700',
            color: '#4facfe',
            textShadow: '0 0 15px rgba(79,172,254,0.8), 0 2px 4px rgba(0,0,0,0.3)',
            animation: 'floatUpXP 1.5s ease-out forwards', 
            zIndex: 10,
          }}>
            +{xpGained} XP
          </div>
        )}
        
        {/* FIXED: Level Up Animation */}
        {showLevelUpAnimation && (
          <div style={{ 
            position: 'absolute', 
            top: '5%', 
            fontSize: 'var(--fs-xl)', 
            fontWeight: '700',
            color: '#ff6b6b',
            textShadow: '0 0 20px rgba(255,107,107,0.8), 0 2px 4px rgba(0,0,0,0.3)',
            animation: 'levelUpBounce 2s ease-out forwards', 
            zIndex: 15,
          }}>
            🎉 LEVEL UP! 🎉
          </div>
        )}
        
        {/* Zodiac Pet Display */}
        <div 
          className={isFeeding ? 'animate-pulse' : ''}
          style={{ 
            filter: 'drop-shadow(0 10px 30px rgba(255,215,0,0.3))', 
            animation: isFeeding ? '' : 'floatPet 3s ease-in-out infinite',
          }}
        >
          {zodiac ? (
            <img 
              src={getPetImage(zodiac, pet.level)}
              alt={zodiac.name}
              style={{
                width: `${Math.min(getPetSize(pet.level), 180)}px`,
                height: 'auto',
                transition: 'width 0.3s ease',
              }}
            />
          ) : (
            <span style={{ fontSize: '120px', lineHeight: 1 }}>🐾</span>
          )}
        </div>
      </div>

      {/* Spacer to push content up and make room for fixed elements */}
      <div style={{ flex: 1, minHeight: '30px' }} />

      {/* Claim Button - Centered and separate */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ 
          bottom: '20px', // Adjusted to be above the care bar
          zIndex: 10
        }}
      >
        <button 
          onClick={collectCoins} 
          disabled={!canClaim() || isClaimingCoins} 
          className="transition-all hover:scale-105 active:scale-95"
          style={{ 
            padding: '8px 20px', // Reduced from 10px 24px to 8px 20px
            borderRadius: '12px', // Slightly smaller border radius
            background: canClaim() && !isClaimingCoins ? 'linear-gradient(135deg, #ffd700, #f5a623)' : 'rgba(100,100,100,0.3)', 
            border: 'none', 
            color: canClaim() && !isClaimingCoins ? '#1a1a1f' : 'rgba(0,0,0,0.4)', 
            fontSize: 'var(--fs-md)', // Back to medium font size
            fontWeight: '700', 
            cursor: canClaim() && !isClaimingCoins ? 'pointer' : 'not-allowed',
            boxShadow: canClaim() && !isClaimingCoins ? '0 3px 12px rgba(255,215,0,0.4)' : 'none', // Smaller shadow
            transform: showCoinAnimation ? 'scale(0.95)' : 'scale(1)',
            opacity: showCoinAnimation ? 0.8 : 1,
          }}
        >
          {isClaimingCoins ? 'Claiming...' : canClaim() ? (showCoinAnimation ? 'Claimed!' : 'Claim') : `Next in ${Math.floor(coinTimer / 60)}:${(coinTimer % 60).toString().padStart(2, '0')}`}
        </button>
      </div>

      {/* Care Actions Bar - Bottom with full rounded rectangle */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ 
          bottom: '-85px', // Moved down to make room for XP display
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.4)', 
          backdropFilter: 'blur(20px)',
          width: '260px', // Increased width for better spacing
          zIndex: 5,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          padding: '8px 12px'
        }}
      >
        {/* FIXED: XP Progress Display */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '6px',
          fontSize: 'var(--fs-xs)',
          color: '#1a1a2e'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontWeight: '600' }}>Level {pet.level}</span>
            <span style={{ color: '#4facfe', fontWeight: '600' }}>{pet.exp}/{pet.maxExp} XP</span>
          </div>
          <div style={{ 
            height: '3px', 
            background: 'rgba(0,0,0,0.1)', 
            borderRadius: '2px', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              width: `${(pet.exp / pet.maxExp) * 100}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #4facfe, #00f2fe)', 
              borderRadius: '2px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: 'rgba(26, 26, 46, 0.6)', 
            marginTop: '2px' 
          }}>
            Care: 20 points → +20 XP
          </div>
        </div>
        
        <div className="flex justify-around items-center">
          <button 
            onClick={handleFeed} 
            disabled={isFeeding || (user?.tokenBalance || 0) < 20 || pet.level >= 10}
            className="flex flex-col items-center gap-0 transition-all hover:scale-105 active:scale-95" 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              padding: '3px 6px', 
              cursor: (isFeeding || (user?.tokenBalance || 0) < 20 || pet.level >= 10) ? 'not-allowed' : 'pointer',
              opacity: (isFeeding || (user?.tokenBalance || 0) < 20 || pet.level >= 10) ? 0.5 : 1
            }}
          >
            <img src="/icons/care.png" alt="Care" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <span style={{ color: '#1a1a2e', fontSize: 'var(--fs-xs)', fontWeight: '600' }}>
              {isFeeding ? 'Caring...' : pet.level >= 10 ? 'Max Lv' : 'Care'}
            </span>
          </button>
          <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)' }} />
          <button onClick={handleCareItems} className="flex flex-col items-center gap-0 transition-all hover:scale-105 active:scale-95" style={{ background: 'transparent', border: 'none', padding: '3px 6px', cursor: 'pointer' }}>
            <img src="/icons/application.png" alt="Care Items" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <span style={{ color: '#1a1a2e', fontSize: 'var(--fs-xs)', fontWeight: '600' }}>Care</span>
          </button>
          <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)' }} />
          <button onClick={() => setShowFriendsModal(true)} className="flex flex-col items-center gap-0 transition-all hover:scale-105 active:scale-95" style={{ padding: '3px 6px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <img src="/icons/friend.png" alt="Friends" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <span style={{ color: '#1a1a2e', fontSize: 'var(--fs-xs)', fontWeight: '600' }}>Friends</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatUp { 
          0% { opacity: 0; transform: translateY(20px) scale(0.8); } 
          20% { opacity: 1; transform: translateY(0) scale(1.2); }
          40% { transform: translateY(-20px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1); } 
        }
        @keyframes floatUpXP { 
          0% { opacity: 0; transform: translateY(15px) translateX(-10px) scale(0.7); } 
          25% { opacity: 1; transform: translateY(0) translateX(0) scale(1.1); }
          50% { transform: translateY(-15px) translateX(5px) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) translateX(10px) scale(0.8); } 
        }
        @keyframes levelUpBounce { 
          0% { opacity: 0; transform: translateY(30px) scale(0.5); } 
          15% { opacity: 1; transform: translateY(-10px) scale(1.3); }
          30% { transform: translateY(5px) scale(1.1); }
          45% { transform: translateY(-5px) scale(1.2); }
          60% { transform: translateY(0) scale(1); }
          80% { transform: translateY(0) scale(1); opacity: 1; }
          100% { opacity: 0; transform: translateY(-20px) scale(0.9); } 
        }
        @keyframes floatPet { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Care Items Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px', padding: '16px', maxWidth: '320px', width: '100%', maxHeight: '70vh', overflowY: 'auto', backdropFilter: 'blur(20px)' }}>
            <button onClick={() => setShowBoostModal(false)} className="absolute top-3 right-3" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', border: 'none', color: '#333', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span style={{ fontSize: '14px' }}>🪙</span>
                <span style={{ fontSize: 'var(--fs-md)', fontWeight: '700', color: '#f5a623' }}>{(user?.tokenBalance || 0).toLocaleString()}</span>
              </div>
              <h2 style={{ fontSize: 'var(--fs-md)', fontWeight: '700', color: '#1a1a2e' }}>Care Items for your pet!</h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {petBoosts.map((boost) => (
                <button key={boost.id} onClick={() => handleBuyCareItem(boost)} disabled={(user?.tokenBalance || 0) < boost.cost} className="w-full mb-2 transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '12px', padding: '10px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '8px', opacity: (user?.tokenBalance || 0) < boost.cost ? 0.5 : 1, cursor: (user?.tokenBalance || 0) < boost.cost ? 'not-allowed' : 'pointer' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #fff8e1, #ffe082)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{boost.icon}</div>
                  <div className="flex-1 text-left">
                    <div style={{ color: '#1a1a2e', fontSize: 'var(--fs-sm)', fontWeight: '600' }}>{boost.name}</div>
                    <div style={{ color: 'rgba(0,0,0,0.5)', fontSize: 'var(--fs-xs)', marginBottom: '2px' }}>{boost.effect}</div>
                    <div className="flex items-center gap-2" style={{ marginTop: '2px' }}>
                      <div className="flex items-center gap-1">
                        <span style={{ fontSize: '10px' }}>🪙</span>
                        <span style={{ color: '#f5a623', fontWeight: '600', fontSize: 'var(--fs-xs)' }}>{boost.cost}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span style={{ fontSize: '10px', color: '#4facfe' }}>⚡</span>
                        <span style={{ color: '#4facfe', fontWeight: '600', fontSize: 'var(--fs-xs)' }}>+{boost.expGain} XP</span>
                      </div>
                      <span style={{ color: 'rgba(0,0,0,0.4)', fontSize: 'var(--fs-xs)' }}>L{boost.level}</span>
                    </div>
                  </div>
                  <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: '14px' }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px', padding: '24px 20px', maxWidth: '320px', width: '100%', backdropFilter: 'blur(20px)', position: 'relative' }}>
            <button onClick={() => { setShowFriendsModal(false); setShowRecoverInviter(false); }} style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', border: 'none', color: '#333', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            
            {showRecoverInviter ? (
              <>
                {/* Recover Inviter View */}
                <div>
                  <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: '700', color: '#1a1a2e' }}>Recover inviter</h2>
                  
                  <p style={{ fontSize: 'var(--fs-md)', color: 'rgba(0,0,0,0.6)', marginTop: '12px', lineHeight: 1.5 }}>
                    You can link the account that invited you if this did not happen automatically.
                  </p>
                  
                  {/* Input */}
                  <input
                    type="text"
                    value={inviterAddress}
                    onChange={(e) => setInviterAddress(e.target.value)}
                    placeholder="Inviter account address"
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.15)',
                      background: 'rgba(0,0,0,0.03)',
                      color: '#1a1a2e',
                      fontSize: 'var(--fs-md)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Buttons */}
                <button 
                  onClick={() => {
                    setShowRecoverInviter(false);
                    setShowInviteModal(true);
                  }}
                  style={{ 
                    width: '100%',
                    marginTop: '24px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    color: '#1a1a2e',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  Invite a Friend
                </button>
                
                <button 
                  onClick={() => {
                    // TODO: Handle bind inviter
                    console.log('Bind inviter:', inviterAddress);
                  }}
                  disabled={!inviterAddress}
                  style={{ 
                    width: '100%',
                    marginTop: '10px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: inviterAddress ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)',
                    border: 'none',
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: inviterAddress ? 'pointer' : 'not-allowed',
                  }}
                >
                  Bind inviter
                </button>
              </>
            ) : (
              <>
                {/* Main Friends View */}
                <div className="text-center">
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>Friends: <span style={{ color: '#f5a623' }}>0</span></h2>
                  
                  <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)', marginTop: '16px', lineHeight: 1.5 }}>
                    Every time your friend claims coins you get <span style={{ fontWeight: '600', color: '#1a1a2e' }}>20% cashback</span>. And <span style={{ fontWeight: '600', color: '#1a1a2e' }}>5%</span> every time their referrals claim it
                  </p>
                  
                  <button 
                    onClick={() => setShowRecoverInviter(true)}
                    style={{ marginTop: '16px', background: 'transparent', border: 'none', color: '#1a1a2e', fontSize: '14px', fontWeight: '600', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Recovery my inviter
                  </button>
                </div>

                {/* Invite Button */}
                <button 
                  onClick={() => setShowInviteModal(true)}
                  style={{ 
                    width: '100%',
                    marginTop: '24px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    color: '#1a1a2e',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  Invite a Friend
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invite Modal - Friendship bonus */}
      {showInviteModal && (
        <div 
          style={{ 
            position: 'fixed',
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(20, 20, 30, 0.99)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Close button */}
          <button 
            onClick={() => setShowInviteModal(false)}
            style={{ 
              position: 'absolute', 
              top: '12px', 
              right: '12px', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: '#fff', 
              fontSize: '16px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            {/* Header */}
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Friends: <span style={{ color: '#f5a623' }}>0</span></h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.5, marginBottom: '30px', maxWidth: '280px' }}>
              Every time your friend claims HOT you get <span style={{ color: '#fff', fontWeight: '600' }}>20% cashback</span>. And <span style={{ color: '#fff', fontWeight: '600' }}>5%</span> every time their referrals claim it
            </p>

            {/* Emoji */}
            <div style={{ fontSize: '70px', marginBottom: '24px' }}>🙌</div>

            {/* Friendship bonus */}
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Friendship bonus</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.5, maxWidth: '260px' }}>
              Friends amplify your power! Earn <span style={{ color: '#fff', fontWeight: '600' }}>20% HOT</span> from all your friends' income - no limits, no boundaries.
            </p>
          </div>

          {/* Bottom Button - fixed position */}
          <div style={{ 
            position: 'absolute',
            bottom: '100px',
            left: '20px',
            right: '20px',
          }}>
            <button 
              onClick={() => {
                console.log('Get referral link');
              }}
              style={{ 
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: 'rgba(255, 235, 210, 0.95)',
                border: 'none',
                color: '#1a1a2e',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Get referral link
            </button>
          </div>
        </div>
      )}

      {/* Debug Info - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="px-3 py-1 bg-red-500 text-white text-xs rounded"
          >
            Debug
          </button>
          {showDebugInfo && (
            <div className="absolute top-8 right-0 w-80 max-h-96 overflow-auto bg-white border rounded shadow-lg p-2 text-xs">
              <h3 className="font-bold mb-2">Pet Debug Info</h3>
              <div className="mb-2">
                <strong>Pet State:</strong>
                <pre className="bg-gray-100 p-1 rounded text-xs overflow-auto">
                  {JSON.stringify(pet, null, 2)}
                </pre>
              </div>
              {debugData && (
                <div className="mb-2">
                  <strong>{debugData.type}:</strong>
                  <pre className="bg-gray-100 p-1 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.data, null, 2)}
                  </pre>
                </div>
              )}
              <div className="mb-2">
                <strong>User:</strong>
                <pre className="bg-gray-100 p-1 rounded text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PetScreen;
