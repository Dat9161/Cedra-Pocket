'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, usePet, useEnergy, useGameSystemActions, useAppStore } from '../../store/useAppStore';
import { backendAPI } from '../../services/backend-api.service';

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
  const { updateBalance, setPet, claimPetCoins } = useAppStore();
  const { 
    feedGamePet, 
    claimGamePetRewards, 
    loadGameDashboard,
    regenerateEnergy 
  } = useGameSystemActions();
  const hasFetchedRef = useRef(false);
  
  // Lấy con giáp từ năm sinh
  const zodiac = pet.birthYear ? getZodiacFromYear(pet.birthYear) : null;
  const petName = zodiac ? zodiac.name : (user?.username ? `${user.username}'s Pet` : 'My Pet');

  const [isFeeding, setIsFeeding] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [claimedCoins, setClaimedCoins] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showRecoverInviter, setShowRecoverInviter] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviterAddress, setInviterAddress] = useState('');
  const [showHatchModal, setShowHatchModal] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [isHatching, setIsHatching] = useState(false);
  const [showBirthYearInput, setShowBirthYearInput] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  
  // Hatch tasks
  const hatchTasks = [
    { id: 'follow_twitter', name: 'Follow on Twitter', icon: '🐦', progress: 25 },
    { id: 'join_telegram', name: 'Join Telegram Group', icon: '📱', progress: 25 },
    { id: 'invite_friend', name: 'Invite 1 Friend', icon: '👥', progress: 25 },
    { id: 'enter_birthyear', name: 'Enter Your Birth Year', icon: '🎂', progress: 25 },
  ];
  
  const petBoosts = [
    { id: 'food_bowl', name: 'Food Bowl', desc: 'Increase hunger capacity', icon: '🍖', cost: 100, level: 1 },
    { id: 'cozy_bed', name: 'Cozy Bed', desc: 'Increase passive mining speed', icon: '🛏️', cost: 200, level: 1 },
    { id: 'magic_collar', name: 'Magic Collar', desc: 'Boost mining speed by 1.5x.. 2x.. 3x!', icon: '✨', cost: 500, level: 1 },
    { id: 'golden_treat', name: 'Golden Treat', desc: 'Increase EXP gain per feed', icon: '🦴', cost: 300, level: 1 },
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
        
        // Regenerate energy based on time elapsed
        regenerateEnergy();
        
        console.log('✅ Game dashboard loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load game data:', error);
        // Fallback to old pet API if new system fails
        try {
          const petData = await backendAPI.getPet();
          setPet(petData);
        } catch (fallbackError) {
          console.error('❌ Fallback pet loading also failed:', fallbackError);
        }
      }
    };
    
    loadGameData();
  }, [loadGameDashboard, regenerateEnergy, setPet]);

  const syncToBackend = useCallback(async (petData: Partial<typeof pet>) => {
    if (!backendAPI.isAuthenticated() || isSyncing) return;
    try {
      setIsSyncing(true);
      await backendAPI.updatePet(petData);
    } catch (error) {
      console.error('Failed to sync pet to backend:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Energy regeneration timer
  useEffect(() => {
    const interval = setInterval(() => {
      regenerateEnergy();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [regenerateEnergy]);

  // Timer logic - chỉ chạy khi pet đã nở
  useEffect(() => {
    if (!pet.hatched) return;
    if (pet.pendingCoins > 0) { 
      setCoinTimer(0); 
      return; 
    }
    
    const elapsed = Math.floor((Date.now() - pet.lastCoinTime) / 1000);
    const remaining = COIN_INTERVAL_SECONDS - elapsed;
    
    if (remaining <= 0) {
      // Dùng setTimeout để tránh setState trong render
      setTimeout(() => {
        const coins = getCoinsPerMinute(pet.level);
        setPet({ pendingCoins: coins });
        syncToBackend({ pendingCoins: coins });
      }, 0);
      setCoinTimer(0);
      return;
    }
    
    setCoinTimer(remaining);
    
    const interval = setInterval(() => {
      setCoinTimer(prev => {
        if (prev <= 1) {
          // Dùng setTimeout để tránh setState trong render
          setTimeout(() => {
            const coins = getCoinsPerMinute(pet.level);
            setPet({ pendingCoins: coins });
            syncToBackend({ pendingCoins: coins });
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pet.level, pet.pendingCoins, pet.lastCoinTime, pet.hatched, setPet, syncToBackend]);

  const collectCoins = useCallback(async () => {
    if (pet.pendingCoins > 0) {
      const coinsToCollect = pet.pendingCoins;
      setClaimedCoins(coinsToCollect);
      setShowCoinAnimation(true);
      setTimeout(() => setShowCoinAnimation(false), 1000);
      
      try {
        // Use new game system API to claim pet rewards
        await claimGamePetRewards();
        console.log('✅ Pet rewards claimed via new game system');
      } catch (error) {
        console.error('❌ Failed to claim via new game system, using fallback:', error);
        // Fallback to old system
        claimPetCoins();
        setCoinTimer(COIN_INTERVAL_SECONDS);
        if (backendAPI.isAuthenticated()) {
          try { 
            await backendAPI.claimPetCoins(coinsToCollect); 
          } catch (e) { 
            console.error('❌ Fallback claim also failed:', e); 
          }
        }
      }
    }
  }, [pet.pendingCoins, claimGamePetRewards, claimPetCoins]);

  const handleFeed = async () => {
    if ((user?.tokenBalance || 0) >= 20 && pet.hunger < 100) { // New system uses 20 points per feed
      setIsFeeding(true);
      
      try {
        // Use new game system API to feed pet
        await feedGamePet(1);
        console.log('✅ Pet fed via new game system');
      } catch (error) {
        console.error('❌ Failed to feed via new game system, using fallback:', error);
        // Fallback to old system
        updateBalance(-10, 'token');
        const newExp = pet.exp + 5;
        const newHunger = Math.min(100, pet.hunger + 20);
        let newPetData: Partial<typeof pet>;
        if (newExp >= pet.maxExp && pet.level < 10) {
          // Level up, max level = 10
          newPetData = { hunger: newHunger, level: pet.level + 1, exp: newExp - pet.maxExp, maxExp: Math.floor(pet.maxExp * 1.5) };
        } else if (newExp >= pet.maxExp && pet.level >= 10) {
          // Max level reached, keep exp at max
          newPetData = { hunger: newHunger, exp: pet.maxExp };
        } else {
          newPetData = { hunger: newHunger, exp: newExp };
        }
        setPet(newPetData);
        syncToBackend(newPetData);
      }
      
      setTimeout(() => setIsFeeding(false), 1000);
    }
  };

  const handleBoost = () => setShowBoostModal(true);

  const handleBuyBoost = (boost: typeof petBoosts[0]) => {
    if ((user?.tokenBalance || 0) >= boost.cost && pet.level < 10) {
      updateBalance(-boost.cost, 'token');
      const newPetData = { level: pet.level + 1, exp: 0, maxExp: Math.floor(pet.maxExp * 1.5) };
      setPet(newPetData);
      syncToBackend(newPetData);
    }
  };

  // Hatch pet - chỉ khi đã hoàn thành tất cả nhiệm vụ
  const [hatchStage, setHatchStage] = useState(0); // 0: not started, 1: shaking, 2: cracking, 3: pet reveal
  
  const handleHatch = () => {
    if ((pet.hatchProgress || 0) >= 100) {
      setShowHatchModal(false);
      setIsHatching(true);
      setHatchStage(1); // Trứng rung
      
      // Stage 2: Pet xuất hiện
      setTimeout(() => setHatchStage(2), 1000);
      
      // Complete hatch - reset pendingCoins = 0
      setTimeout(() => {
        setPet({ hatched: true, pendingCoins: 0, lastCoinTime: Date.now() });
        syncToBackend({ hatched: true, pendingCoins: 0 });
        setIsHatching(false);
        setHatchStage(0);
      }, 3000);
    }
  };

  // Complete a hatch task
  const handleCompleteTask = (taskId: string) => {
    if (completedTasks.includes(taskId)) return;
    
    if (taskId === 'enter_birthyear') {
      setShowBirthYearInput(true);
    } else {
      // Mark task as completed
      const newCompletedTasks = [...completedTasks, taskId];
      setCompletedTasks(newCompletedTasks);
      
      // Update progress
      const newProgress = Math.min(100, (pet.hatchProgress || 0) + 25);
      setPet({ hatchProgress: newProgress });
      syncToBackend({ hatchProgress: newProgress });
    }
  };
  
  // Submit birth year
  const handleSubmitBirthYear = () => {
    const year = parseInt(birthYear);
    if (year >= 1950 && year <= 2020) {
      const newCompletedTasks = [...completedTasks, 'enter_birthyear'];
      setCompletedTasks(newCompletedTasks);
      setShowBirthYearInput(false);
      
      // Update progress
      const newProgress = Math.min(100, (pet.hatchProgress || 0) + 25);
      setPet({ hatchProgress: newProgress, birthYear: year });
      syncToBackend({ hatchProgress: newProgress, birthYear: year });
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
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
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
          <div style={{ width: '200px', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Hatch Progress</span>
              <span style={{ color: '#ffd700', fontSize: '12px', fontWeight: '600' }}>{pet.hatchProgress || 0}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${pet.hatchProgress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #ffd700, #f5a623)', borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Hatch Button */}
          <button
            onClick={() => setShowHatchModal(true)}
            className="transition-all hover:scale-105 active:scale-95"
            style={{
              marginTop: '24px',
              padding: '14px 40px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ffd700, #f5a623)',
              border: 'none',
              color: '#1a1a2e',
              fontSize: '16px',
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

        {/* Hatch Modal - Task List */}
        {showHatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px', padding: '16px', maxWidth: '300px', width: '100%', maxHeight: '70vh', overflowY: 'auto', backdropFilter: 'blur(20px)' }}>
              {showBirthYearInput ? (
                <>
                  {/* Birth Year Input */}
                  <button onClick={() => setShowBirthYearInput(false)} className="absolute top-3 right-3" style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', color: '#333', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                  <div className="text-center mb-3">
                    <span style={{ fontSize: '40px' }}>🎂</span>
                    <h3 style={{ color: '#1a1a2e', fontSize: '16px', fontWeight: '700', marginTop: '6px' }}>Enter Your Birth Year</h3>
                  </div>
                  
                  <input
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="e.g. 1995"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '2px solid rgba(0,0,0,0.1)',
                      background: 'rgba(0,0,0,0.05)',
                      color: '#1a1a2e',
                      fontSize: '16px',
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setShowBirthYearInput(false)}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.08)', border: 'none', color: '#333', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitBirthYear}
                      disabled={!birthYear || parseInt(birthYear) < 1950 || parseInt(birthYear) > 2020}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: birthYear && parseInt(birthYear) >= 1950 && parseInt(birthYear) <= 2020 
                          ? 'linear-gradient(135deg, #ffd700, #f5a623)' 
                          : 'rgba(0,0,0,0.1)',
                        border: 'none',
                        color: '#1a1a2e',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: birthYear ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Confirm ✓
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Task List */}
                  <button onClick={() => setShowHatchModal(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✕</button>
                  
                  <div className="text-center mb-3">
                    {/* Egg image changes based on progress */}
                    <img 
                      src={
                        progress >= 100 ? '/icons/egg4.PNG' :
                        progress >= 75 ? '/icons/egg3.PNG' :
                        progress >= 25 ? '/icons/egg2.PNG' :
                        '/icons/egg1.PNG'
                      }
                      alt="Egg"
                      style={{ 
                        width: '60px',
                        height: 'auto',
                        margin: '0 auto',
                      }}
                    />
                    <h3 style={{ color: '#1a1a2e', fontSize: '16px', fontWeight: '700', marginTop: '6px' }}>Hatch Your Pet!</h3>
                    <p style={{ color: 'rgba(0,0,0,0.5)', fontSize: '12px', marginTop: '2px' }}>Complete all tasks to hatch your egg</p>
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'rgba(0,0,0,0.5)', fontSize: '11px' }}>Progress</span>
                      <span style={{ color: '#f5a623', fontSize: '11px', fontWeight: '600' }}>{pet.hatchProgress || 0}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pet.hatchProgress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #ffd700, #f5a623)', borderRadius: '3px', transition: 'width 0.5s' }} />
                    </div>
                  </div>

                  {/* Tasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    {hatchTasks.map((task) => {
                      const isCompleted = completedTasks.includes(task.id);
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={isCompleted}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            borderRadius: '10px',
                            background: isCompleted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.05)',
                            border: isCompleted ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(0,0,0,0.08)',
                            cursor: isCompleted ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '8px', 
                            background: isCompleted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.05)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '16px' 
                          }}>
                            {isCompleted ? '✓' : task.icon}
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ color: isCompleted ? 'rgba(34, 197, 94, 1)' : '#1a1a2e', fontSize: '13px', fontWeight: '600' }}>{task.name}</div>
                            <div style={{ color: isCompleted ? 'rgba(34, 197, 94, 0.7)' : 'rgba(0,0,0,0.4)', fontSize: '11px' }}>+{task.progress}% progress</div>
                          </div>
                          {!isCompleted && (
                            <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: '14px' }}>›</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hatch Button */}
                  <button
                    onClick={handleHatch}
                    disabled={(pet.hatchProgress || 0) < 100}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      background: (pet.hatchProgress || 0) >= 100 
                        ? 'linear-gradient(135deg, #ffd700, #f5a623)' 
                        : 'rgba(0,0,0,0.1)',
                      border: 'none',
                      color: (pet.hatchProgress || 0) >= 100 ? '#1a1a2e' : 'rgba(0,0,0,0.4)',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: (pet.hatchProgress || 0) >= 100 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    🐣 {(pet.hatchProgress || 0) >= 100 ? 'Hatch Now!' : 'Complete all tasks'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

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
    <div className="flex flex-col relative" style={{ backgroundColor: 'transparent', height: 'calc(100vh - 160px)', overflow: 'visible' }}>
      {/* Pet Info - Top Left */}
      <div className="flex items-center justify-between" style={{ marginTop: '16px', marginBottom: '8px', marginLeft: '20px', marginRight: '20px' }}>
        <div className="flex items-center">
          <div 
            className="relative flex items-center justify-center mr-3" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}
          >
            <svg className="absolute" viewBox="0 0 40 40" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray={`${(pet.exp / pet.maxExp) * 100} 100`} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{pet.level}</span>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '600' }}>{petName}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>EXP: {pet.exp}/{pet.maxExp}</div>
          </div>
        </div>

        {/* Energy Display - Top Right */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '16px' }}>⚡</span>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '600' }}>
              {energy.currentEnergy}/{energy.maxEnergy}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>Energy</div>
          </div>
        </div>
      </div>

      {/* Storage Display - Above Pet */}
      <div className="flex flex-col items-center" style={{ marginTop: '10px', marginBottom: '15px' }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '28px' }}>🪙</span>
          <span style={{ fontSize: '42px', fontWeight: '700', color: '#ffd700' }}>{pet.pendingCoins}</span>
        </div>
      </div>

      {/* Pet Image - Below coins */}
      <div className="flex flex-col items-center justify-center relative" style={{ marginTop: '10px', marginBottom: '10px' }}>
        {showCoinAnimation && (
          <div style={{ 
            position: 'absolute', 
            top: '10%', 
            fontSize: '28px', 
            fontWeight: '700',
            color: '#ffd700',
            textShadow: '0 0 20px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.3)',
            animation: 'floatUp 1.2s ease-out forwards', 
            zIndex: 10,
          }}>
            +{claimedCoins} 🪙
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

      {/* Claim Button - Separate from care bar */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{ 
          bottom: '50px',
          zIndex: 10
        }}
      >
        <button 
          onClick={collectCoins} 
          disabled={pet.pendingCoins <= 0} 
          className="transition-all hover:scale-105 active:scale-95"
          style={{ 
            padding: '10px 28px', 
            borderRadius: '14px', 
            background: pet.pendingCoins > 0 ? 'linear-gradient(135deg, #ffd700, #f5a623)' : 'rgba(100,100,100,0.3)', 
            border: 'none', 
            color: pet.pendingCoins > 0 ? '#1a1a1f' : 'rgba(0,0,0,0.4)', 
            fontSize: '14px', 
            fontWeight: '700', 
            cursor: pet.pendingCoins > 0 ? 'pointer' : 'not-allowed',
            boxShadow: pet.pendingCoins > 0 ? '0 4px 20px rgba(255,215,0,0.4)' : 'none'
          }}
        >
          {pet.pendingCoins > 0 ? 'Claim' : `Next in ${Math.floor(coinTimer / 60)}:${(coinTimer % 60).toString().padStart(2, '0')}`}
        </button>
      </div>

      {/* Care Actions Bar - Separate */}
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: '18px', 
          border: '1px solid rgba(255, 255, 255, 0.4)', 
          backdropFilter: 'blur(20px)',
          width: '240px',
          marginBottom: '-30px',
          zIndex: 5,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '8px 12px 12px 12px'
        }}
      >
        <div className="flex justify-around items-center">
          <button onClick={handleFeed} className="flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95" style={{ background: 'transparent', border: 'none', padding: '6px 10px', cursor: 'pointer' }}>
            <img src="/icons/mission.png" alt="Missions" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span style={{ color: '#1a1a2e', fontSize: '11px', fontWeight: '600' }}>Missions</span>
          </button>
          <div style={{ width: '1px', height: '32px', background: 'rgba(0,0,0,0.1)' }} />
          <button onClick={handleBoost} className="flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95" style={{ background: 'transparent', border: 'none', padding: '6px 10px', cursor: 'pointer' }}>
            <img src="/icons/care.png" alt="Care" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span style={{ color: '#1a1a2e', fontSize: '11px', fontWeight: '600' }}>Care</span>
          </button>
          <div style={{ width: '1px', height: '32px', background: 'rgba(0,0,0,0.1)' }} />
          <button onClick={() => setShowFriendsModal(true)} className="flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95" style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <img src="/icons/friend.png" alt="Friends" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span style={{ color: '#1a1a2e', fontSize: '11px', fontWeight: '600' }}>Friends</span>
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
        @keyframes floatPet { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Boost Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px', padding: '16px', maxWidth: '320px', width: '100%', maxHeight: '70vh', overflowY: 'auto', backdropFilter: 'blur(20px)' }}>
            <button onClick={() => setShowBoostModal(false)} className="absolute top-3 right-3" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', border: 'none', color: '#333', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span style={{ fontSize: '14px' }}>🪙</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#f5a623' }}>{(user?.tokenBalance || 0).toLocaleString()}</span>
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e' }}>Care for your pet!</h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {petBoosts.map((boost) => (
                <button key={boost.id} onClick={() => handleBuyBoost(boost)} disabled={(user?.tokenBalance || 0) < boost.cost} className="w-full mb-2 transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '12px', padding: '10px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '8px', opacity: (user?.tokenBalance || 0) < boost.cost ? 0.5 : 1, cursor: (user?.tokenBalance || 0) < boost.cost ? 'not-allowed' : 'pointer' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #fff8e1, #ffe082)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{boost.icon}</div>
                  <div className="flex-1 text-left">
                    <div style={{ color: '#1a1a2e', fontSize: '13px', fontWeight: '600' }}>{boost.name}</div>
                    <div style={{ color: 'rgba(0,0,0,0.5)', fontSize: '10px' }}>{boost.desc}</div>
                    <div className="flex items-center gap-1" style={{ marginTop: '2px' }}>
                      <span style={{ fontSize: '10px' }}>🪙</span>
                      <span style={{ color: '#f5a623', fontWeight: '600', fontSize: '11px' }}>{boost.cost}</span>
                      <span style={{ color: 'rgba(0,0,0,0.4)', fontSize: '10px' }}>• L{boost.level}</span>
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
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>Recover inviter</h2>
                  
                  <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)', marginTop: '12px', lineHeight: 1.5 }}>
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
                      fontSize: '14px',
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
    </div>
  );
}

export default PetScreen;
