/**
 * Zustand App Store
 * Central state management for the Telegram Mini App
 * Requirements: All state-related requirements
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserData,
  Quest,
  Reward,
  DailyRewardData,
  LeaderboardEntry,
  Card,
  CardCategory,
  ReferralStats,
  WalletState,
} from '../models';

/**
 * Navigation tab types
 */
export type NavigationTab = 'home' | 'quest' | 'pet' | 'wallet' | 'game';

/**
 * Currency types for balance updates
 */
export type CurrencyType = 'token' | 'gem' | 'wallet';

/**
 * Complete application state interface
 */
export interface AppState {
  // User State
  user: UserData | null;
  isLoading: boolean;
  error: string | null;

  // Quest State
  quests: Quest[];
  questsLoading: boolean;

  // Reward State
  rewards: Reward[];
  dailyReward: DailyRewardData | null;

  // Leaderboard State
  leaderboard: LeaderboardEntry[];
  leaderboardPage: number;
  hasMoreLeaderboard: boolean;

  // Cards State
  cards: Card[];
  activeCardCategory: CardCategory;

  // Friends State
  referralStats: ReferralStats | null;

  // Wallet State
  wallet: WalletState;

  // Navigation State
  activeTab: NavigationTab;

  // Spin State
  spinsLeft: number;

  // Pet State
  pet: {
    level: number;
    exp: number;
    maxExp: number;
    hunger: number;
    happiness: number;
    lastCoinTime: number;
    pendingCoins: number;
    hatched: boolean;
    birthYear: number | null;
    hatchProgress: number; // 0-100, cần hoàn thành nhiệm vụ để tăng
  };

  // New Game System State
  energy: {
    currentEnergy: number;
    maxEnergy: number;
    lastUpdate: number;
  };

  gameStats: {
    totalGamesPlayed: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    totalPointsEarned: number;
  };

  ranking: {
    rank: string;
    position: number;
    lifetimePoints: number;
    nextRankThreshold?: number;
  };

  gameCycle: {
    cycleNumber: number;
    growthRate: number;
    maxSpeedCap: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null;

  // Transaction state to prevent dashboard from overwriting recent changes
  recentTransaction: {
    timestamp: number;
    amount: number;
  } | null;

  // Rank up notification state
  rankUpNotification: {
    show: boolean;
    newRank: string;
    coinsAwarded: number;
  } | null;
}

/**
 * Store actions interface
 */
export interface AppActions {
  // User Actions
  setUser: (user: UserData | null) => void;
  updateBalance: (amount: number, currency: CurrencyType) => Promise<void>;
  addXP: (amount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Quest Actions
  setQuests: (quests: Quest[]) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  setQuestsLoading: (loading: boolean) => void;

  // Reward Actions
  setRewards: (rewards: Reward[]) => void;
  claimReward: (rewardId: string) => void;
  setDailyReward: (reward: DailyRewardData | null) => void;

  // Leaderboard Actions
  setLeaderboard: (entries: LeaderboardEntry[], hasMore: boolean) => void;
  appendLeaderboard: (entries: LeaderboardEntry[], hasMore: boolean) => void;
  setLeaderboardPage: (page: number) => void;

  // Cards Actions
  setCards: (cards: Card[]) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  setActiveCardCategory: (category: CardCategory) => void;
  purchaseCard: (cardId: string) => { success: boolean; error?: string };
  upgradeCard: (cardId: string) => { success: boolean; error?: string };

  // Friends Actions
  setReferralStats: (stats: ReferralStats | null) => void;
  addReferralBonus: (friend: import('../models').Friend) => void;

  // Wallet Actions
  setWallet: (wallet: Partial<WalletState>) => void;

  // Navigation Actions
  setActiveTab: (tab: NavigationTab) => void;

  // Spin Actions
  setSpinsLeft: (spins: number) => void;
  decrementSpins: () => void;

  // Pet Actions
  setPet: (pet: Partial<AppState['pet']>) => void;

  // New Game System Actions
  setEnergy: (energy: Partial<AppState['energy']>) => void;
  consumeEnergy: (amount: number) => boolean;
  regenerateEnergy: () => void;
  
  setGameStats: (stats: Partial<AppState['gameStats']>) => void;
  updateGameStats: (score: number, pointsEarned: number) => void;
  
  setRanking: (ranking: Partial<AppState['ranking']>) => void;
  
  setGameCycle: (cycle: AppState['gameCycle']) => void;

  // Game API Actions
  feedGamePet: (feedCount?: number) => Promise<void>;
  claimGamePetRewards: () => Promise<void>;
  startGameSession: (gameType: string) => Promise<any>;
  completeGameSession: (score: number, duration?: number) => Promise<void>;
  refillGameEnergy: (amount: number) => Promise<void>;
  loadGameDashboard: () => Promise<void>;

  // Global Actions
  reset: () => void;

  // Rank up notification actions
  showRankUpNotification: (newRank: string, coinsAwarded: number) => void;
  hideRankUpNotification: () => void;
}

/**
 * Combined store type
 */
export type AppStore = AppState & AppActions;

/**
 * Initial wallet state
 */
const initialWalletState: WalletState = {
  connected: false,
  address: undefined,
  chainId: undefined,
  connecting: false,
  error: undefined,
};

/**
 * Initial application state
 */
const initialState: AppState = {
  // User State
  user: null,
  isLoading: false,
  error: null,

  // Quest State
  quests: [],
  questsLoading: false,

  // Reward State
  rewards: [],
  dailyReward: null,

  // Leaderboard State
  leaderboard: [],
  leaderboardPage: 1,
  hasMoreLeaderboard: true,

  // Cards State
  cards: [],
  activeCardCategory: 'equipment',

  // Friends State
  referralStats: null,

  // Wallet State
  wallet: initialWalletState,

  // Navigation State
  activeTab: 'home',

  // Spin State
  spinsLeft: 3,

  // Pet State
  pet: {
    level: 1,
    exp: 0,
    maxExp: 1200, // Fixed: Use correct XP threshold consistent with backend
    hunger: 50,
    happiness: 50,
    lastCoinTime: Date.now(),
    pendingCoins: 0,
    hatched: false,
    birthYear: null,
    hatchProgress: 0,
  },

  // New Game System State
  energy: {
    currentEnergy: 10,
    maxEnergy: 10,
    lastUpdate: Date.now(),
  },

  gameStats: {
    totalGamesPlayed: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    totalPointsEarned: 0,
  },

  ranking: {
    rank: 'RANK1',
    position: 0,
    lifetimePoints: 0,
    nextRankThreshold: 10000,
  },

  gameCycle: null,

  // Transaction state
  recentTransaction: null,

  // Rank up notification state
  rankUpNotification: null,
};


/**
 * Keys to persist in local storage
 * Requirements: 13.1, 13.2, 13.3
 */
const PERSISTED_KEYS: (keyof AppState)[] = [
  'user',
  'quests',
  'rewards',
  'dailyReward',
  'cards',
  'referralStats',
  'wallet',
  'activeTab',
  'spinsLeft',
  'pet',
  'energy',
  'gameStats',
  'ranking',
  'gameCycle',
];

/**
 * Custom storage adapter for Zustand persist middleware
 * Uses localStorage with JSON serialization
 */
const customStorage = createJSONStorage(() => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
});

/**
 * Create the Zustand store with persistence
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // User Actions
      setUser: (user) => {
        set({ user });
      },

      updateBalance: async (amount, currency) => {
        const { user } = get();
        if (!user) {
          console.log('❌ No user found, cannot update balance');
          return;
        }

        if (currency === 'token') {
          // Update local state immediately for instant UI feedback
          const oldBalance = user.tokenBalance;
          const newBalance = oldBalance + amount;
          
          set({
            user: {
              ...user,
              tokenBalance: newBalance,
              updatedAt: new Date(),
            },
          });
          
          console.log(`💰 Balance updated locally: ${oldBalance} → ${newBalance} (${amount > 0 ? '+' : ''}${amount})`);
          
          // Try to save to localStorage manually to ensure persistence
          try {
            const currentState = get();
            const stateToSave = {
              state: {
                user: currentState.user,
                pet: currentState.pet,
                // Add other important state here
              }
            };
            localStorage.setItem('tg-mini-app-storage', JSON.stringify(stateToSave));
            console.log('📱 Manually saved to localStorage');
          } catch (localError) {
            console.error('❌ Failed to save to localStorage:', localError);
          }
          
          // Save to backend database with better error handling
          try {
            const { backendAPI } = await import('../services/backend-api.service');
            console.log(`💾 Attempting to save to database: ${amount > 0 ? '+' : ''}${amount}`);
            const result = await backendAPI.addPoints(amount);
            console.log(`✅ Database save success: ${result.total_points}`);
            
            // Update local state with backend's authoritative value if different
            const backendTotal = Number(result.total_points);
            if (Math.abs(newBalance - backendTotal) > 1) {
              console.log(`🔄 Adjusting local balance from ${newBalance} to ${backendTotal}`);
              set({
                user: {
                  ...user,
                  tokenBalance: backendTotal,
                },
              });
            }
          } catch (err) {
            console.error('❌ Database save failed:', err);
            console.log('📱 Points saved locally, will sync when backend is available');
            // Keep local state - user still gets their coins
            // The points are already saved in localStorage via Zustand persist
          }
        } else if (currency === 'wallet') {
          // Update wallet balance (USD)
          const newWalletBalance = user.walletBalance + amount;
          set({
            user: {
              ...user,
              walletBalance: newWalletBalance,
              updatedAt: new Date(),
            },
          });
        } else {
          set({
            user: {
              ...user,
              gemBalance: user.gemBalance + amount,
              updatedAt: new Date(),
            },
          });
        }
      },

      addXP: (amount) => {
        const { user } = get();
        if (!user) return;

        let newXP = user.currentXP + amount;
        let newLevel = user.level;
        let newRequiredXP = user.requiredXP;

        // Level up logic - check if XP exceeds required
        while (newXP >= newRequiredXP) {
          newXP -= newRequiredXP;
          newLevel += 1;
          // Increase required XP for next level (simple scaling)
          newRequiredXP = Math.floor(newRequiredXP * 1.2);
        }

        set({
          user: {
            ...user,
            currentXP: newXP,
            level: newLevel,
            requiredXP: newRequiredXP,
            updatedAt: new Date(),
          },
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // Quest Actions
      setQuests: (quests) => set({ quests }),

      updateQuest: (questId, updates) => {
        const { quests } = get();
        set({
          quests: quests.map((quest) =>
            quest.id === questId ? { ...quest, ...updates } : quest
          ),
        });
      },

      setQuestsLoading: (questsLoading) => set({ questsLoading }),

      // Reward Actions
      setRewards: (rewards) => set({ rewards }),

      claimReward: (rewardId) => {
        const { rewards, user } = get();
        const reward = rewards.find((r) => r.id === rewardId);

        if (!reward || reward.claimed || !user) return;

        // Update reward as claimed
        const updatedRewards = rewards.map((r) =>
          r.id === rewardId
            ? { ...r, claimed: true, claimedAt: new Date() }
            : r
        );

        // Update user balance based on reward type
        let updatedUser = { ...user, updatedAt: new Date() };
        if (reward.type === 'token') {
          updatedUser.tokenBalance += reward.amount;
        } else if (reward.type === 'gem') {
          updatedUser.gemBalance += reward.amount;
        }

        set({ rewards: updatedRewards, user: updatedUser });
      },

      setDailyReward: (dailyReward) => set({ dailyReward }),

      // Leaderboard Actions
      setLeaderboard: (entries, hasMore) =>
        set({ leaderboard: entries, hasMoreLeaderboard: hasMore, leaderboardPage: 1 }),

      appendLeaderboard: (entries, hasMore) => {
        const { leaderboard, leaderboardPage } = get();
        set({
          leaderboard: [...leaderboard, ...entries],
          hasMoreLeaderboard: hasMore,
          leaderboardPage: leaderboardPage + 1,
        });
      },

      setLeaderboardPage: (leaderboardPage) => set({ leaderboardPage }),

      // Cards Actions
      setCards: (cards) => set({ cards }),

      updateCard: (cardId, updates) => {
        const { cards } = get();
        set({
          cards: cards.map((card) =>
            card.id === cardId ? { ...card, ...updates } : card
          ),
        });
      },

      setActiveCardCategory: (activeCardCategory) => set({ activeCardCategory }),

      /**
       * Purchase a card
       * Requirements: 11.4 - Deduct tokens and add card bonus to passive earnings
       */
      purchaseCard: (cardId) => {
        const { cards, user } = get();
        const card = cards.find((c) => c.id === cardId);

        if (!card) {
          return { success: false, error: 'Card not found' };
        }

        if (card.owned) {
          return { success: false, error: 'Card already owned' };
        }

        if (!user) {
          return { success: false, error: 'User not found' };
        }

        if (user.tokenBalance < card.cost) {
          return { success: false, error: 'Insufficient balance' };
        }

        // Deduct tokens and add bonus to earning rate
        const updatedUser = {
          ...user,
          tokenBalance: user.tokenBalance - card.cost,
          earningRate: user.earningRate + card.bonusRate,
          updatedAt: new Date(),
        };

        // Update card as owned
        const updatedCards = cards.map((c) =>
          c.id === cardId ? { ...c, owned: true, level: 1 } : c
        );

        set({ user: updatedUser, cards: updatedCards });
        return { success: true };
      },

      /**
       * Upgrade an owned card
       * Requirements: 11.4 - Deduct tokens and add card bonus to passive earnings
       */
      upgradeCard: (cardId) => {
        const { cards, user } = get();
        const card = cards.find((c) => c.id === cardId);

        if (!card) {
          return { success: false, error: 'Card not found' };
        }

        if (!card.owned) {
          return { success: false, error: 'Card not owned' };
        }

        if (card.level >= card.maxLevel) {
          return { success: false, error: 'Card already at max level' };
        }

        if (!user) {
          return { success: false, error: 'User not found' };
        }

        if (user.tokenBalance < card.upgradeCost) {
          return { success: false, error: 'Insufficient balance' };
        }

        // Calculate new bonus (each level adds the base bonus rate)
        const additionalBonus = card.bonusRate;

        // Deduct tokens and add bonus to earning rate
        const updatedUser = {
          ...user,
          tokenBalance: user.tokenBalance - card.upgradeCost,
          earningRate: user.earningRate + additionalBonus,
          updatedAt: new Date(),
        };

        // Update card level and upgrade cost (cost increases by 50% per level)
        const newLevel = card.level + 1;
        const newUpgradeCost = Math.floor(card.upgradeCost * 1.5);

        const updatedCards = cards.map((c) =>
          c.id === cardId
            ? { ...c, level: newLevel, upgradeCost: newUpgradeCost }
            : c
        );

        set({ user: updatedUser, cards: updatedCards });
        return { success: true };
      },

      // Friends Actions
      setReferralStats: (referralStats) => set({ referralStats }),

      /**
       * Add a referral bonus when a new friend joins
       * Requirements: 12.4 - Credit bonus on new referral
       */
      addReferralBonus: (friend) => {
        const { referralStats, user } = get();
        
        if (!referralStats || !user) return;

        // Update referral stats with new friend
        const updatedStats = {
          ...referralStats,
          totalReferrals: referralStats.totalReferrals + 1,
          totalBonus: referralStats.totalBonus + friend.contribution,
          friends: [...referralStats.friends, friend],
        };

        // Credit bonus to user's token balance
        const updatedUser = {
          ...user,
          tokenBalance: user.tokenBalance + friend.contribution,
          updatedAt: new Date(),
        };

        set({ referralStats: updatedStats, user: updatedUser });
      },

      // Wallet Actions
      setWallet: (walletUpdates) => {
        const { wallet } = get();
        set({ wallet: { ...wallet, ...walletUpdates } });
      },

      // Navigation Actions
      setActiveTab: (activeTab) => set({ activeTab }),

      // Spin Actions
      setSpinsLeft: (spinsLeft) => set({ spinsLeft }),
      decrementSpins: () => {
        const { spinsLeft } = get();
        if (spinsLeft > 0) {
          set({ spinsLeft: spinsLeft - 1 });
        }
      },

      // Pet Actions
      setPet: (petUpdates) => {
        const { pet } = get();
        set({ pet: { ...pet, ...petUpdates } });
      },

      // New Game System Actions
      setEnergy: (energyUpdates) => {
        const { energy } = get();
        set({ energy: { ...energy, ...energyUpdates } });
      },

      consumeEnergy: (amount) => {
        const { energy } = get();
        if (energy.currentEnergy >= amount) {
          set({ 
            energy: { 
              ...energy, 
              currentEnergy: energy.currentEnergy - amount,
              lastUpdate: Date.now()
            } 
          });
          return true;
        }
        return false;
      },

      regenerateEnergy: () => {
        const { energy } = get();
        const now = Date.now();
        const timeDiff = now - energy.lastUpdate;
        const REGEN_INTERVAL = 60 * 60 * 1000; // 1 hour
        const REGEN_THRESHOLD = 5; // Only regen if energy < 5

        if (energy.currentEnergy < REGEN_THRESHOLD) {
          const intervalsElapsed = Math.floor(timeDiff / REGEN_INTERVAL);
          const energyToAdd = Math.min(intervalsElapsed, energy.maxEnergy - energy.currentEnergy);
          
          if (energyToAdd > 0) {
            set({
              energy: {
                ...energy,
                currentEnergy: energy.currentEnergy + energyToAdd,
                lastUpdate: now,
              }
            });
          }
        }
      },

      setGameStats: (statsUpdates) => {
        const { gameStats } = get();
        set({ gameStats: { ...gameStats, ...statsUpdates } });
      },

      updateGameStats: (score, pointsEarned) => {
        const { gameStats } = get();
        const newTotalGames = gameStats.totalGamesPlayed + 1;
        const newTotalScore = gameStats.totalScore + score;
        const newAverageScore = newTotalScore / newTotalGames;
        const newBestScore = Math.max(gameStats.bestScore, score);
        const newTotalPoints = gameStats.totalPointsEarned + pointsEarned;

        set({
          gameStats: {
            totalGamesPlayed: newTotalGames,
            totalScore: newTotalScore,
            averageScore: Math.round(newAverageScore),
            bestScore: newBestScore,
            totalPointsEarned: newTotalPoints,
          }
        });
      },

      setRanking: (rankingUpdates) => {
        const { ranking } = get();
        set({ ranking: { ...ranking, ...rankingUpdates } });
      },

      setGameCycle: (cycle) => {
        set({ gameCycle: cycle });
      },

      // Game API Actions
      feedGamePet: async (feedCount = 1) => {
        try {
          console.log(`🍖 Feeding pet with count: ${feedCount}`);
          const { backendAPI } = await import('../services/backend-api.service');
          const result = await backendAPI.feedPet(feedCount);
          
          if (result.success) {
            console.log('✅ Pet fed successfully:', result);
            
            // FIXED: Update pet with correct data from backend
            const currentPet = get().pet;
            const petUpdates: Partial<typeof currentPet> = {
              exp: result.newXp, // Use backend's authoritative XP value
              maxExp: 1200, // Keep consistent with backend constants
            };
            
            // Only update level if backend explicitly returns a new level
            if (result.newLevel !== undefined && result.newLevel !== currentPet.level) {
              petUpdates.level = result.newLevel;
              console.log(`🎉 Pet leveled up! Level ${currentPet.level} → ${result.newLevel}`);
            }
            
            get().setPet(petUpdates);
            
            // Update user points (subtract cost) - use backend's authoritative value
            if (result.pointsSpent > 0) {
              const currentUser = get().user;
              if (currentUser) {
                set({
                  user: {
                    ...currentUser,
                    tokenBalance: Math.max(0, currentUser.tokenBalance - result.pointsSpent),
                  }
                });
              }
            }
            
            console.log(`🎉 Pet gained ${result.xpGained} XP (${result.newXp}/1200), spent ${result.pointsSpent} points`);
          } else {
            console.error('❌ Failed to feed pet:', result.error);
            throw new Error(result.error || 'Failed to feed pet');
          }
        } catch (error) {
          console.error('❌ Feed pet error:', error);
          throw error;
        }
      },

      claimGamePetRewards: async () => {
        try {
          console.log('💰 Claiming pet rewards...');
          const { backendAPI } = await import('../services/backend-api.service');
          const result = await backendAPI.claimPetRewards();
          
          if (result.success) {
            console.log('✅ Pet rewards claimed successfully:', result);
            
            // Update pet state (reset pending coins)
            get().setPet({
              pendingCoins: 0,
              lastCoinTime: Date.now(),
            });
            
            // Update user points - ALWAYS use backend's authoritative value
            if (result.pointsEarned > 0 && result.newTotalPoints !== undefined) {
              const currentUser = get().user;
              if (currentUser) {
                console.log(`💰 Pet claim: ${result.pointsEarned} points earned, new total: ${result.newTotalPoints}`);
                
                set({
                  user: {
                    ...currentUser,
                    tokenBalance: result.newTotalPoints,
                  },
                  recentTransaction: {
                    timestamp: Date.now(),
                    amount: result.pointsEarned,
                  }
                });
              }
            }
            
            console.log(`🎉 Claimed ${result.pointsEarned} points from pet rewards`);
          } else {
            console.error('❌ Failed to claim pet rewards:', result.error);
            throw new Error(result.error || 'Failed to claim pet rewards');
          }
        } catch (error) {
          console.error('❌ Claim pet rewards error:', error);
          throw error;
        }
      },

      startGameSession: async (gameType) => {
        console.log(`🎮 Start game session called for ${gameType} (disabled)`);
        // Disabled to prevent errors
        return { success: true, sessionId: 'local', energyUsed: 1 };
      },

      completeGameSession: async (score, _duration) => {
        try {
          console.log(`🏁 Completing game session with score ${score}`);
          const { backendAPI } = await import('../services/backend-api.service');
          
          // Calculate points earned (same as frontend logic)
          const pointsEarned = score; // 1 point per score
          
          const result = await backendAPI.completeGameSession('pocket-fly', score, pointsEarned);
          
          if (result.success) {
            console.log('✅ Game session completed successfully:', result);
            
            // Update user points - ALWAYS use backend's authoritative value
            if (result.pointsEarned > 0 && result.newTotalPoints !== undefined) {
              const currentUser = get().user;
              if (currentUser) {
                console.log(`💰 Game complete: ${result.pointsEarned} points earned, new total: ${result.newTotalPoints}`);
                
                set({
                  user: {
                    ...currentUser,
                    tokenBalance: result.newTotalPoints,
                  },
                  recentTransaction: {
                    timestamp: Date.now(),
                    amount: result.pointsEarned,
                  }
                });
              }
            }
            
            // Update game stats
            get().updateGameStats(score, result.pointsEarned);
            
            console.log(`🎉 Game completed: ${score} score, ${result.pointsEarned} points earned`);
          } else {
            console.warn('⚠️ Game session save failed, updating locally:', result.error);
            // Fallback to local update
            get().updateGameStats(score, pointsEarned);
            get().updateBalance(pointsEarned, 'token');
          }
        } catch (error) {
          console.error('❌ Complete game session error:', error);
          // Fallback to local update
          const pointsEarned = score;
          get().updateGameStats(score, pointsEarned);
          get().updateBalance(pointsEarned, 'token');
        }
      },

      refillGameEnergy: async (amount) => {
        console.log(`⚡ Refill energy called with amount ${amount} (disabled)`);
        // Disabled to prevent errors
      },

      loadGameDashboard: async () => {
        try {
          console.log('🎮 Loading game dashboard...');
          const { backendAPI } = await import('../services/backend-api.service');
          const dashboard = await backendAPI.getGameDashboard();
          
          if (dashboard && dashboard.success) {
            console.log('✅ Dashboard loaded successfully, processing data...');
            
            // Update pet state - FIXED: Don't overwrite local pet progress
            if (dashboard.pet) {
              console.log('🐾 Updating pet state:', dashboard.pet);
              const currentPet = get().pet;
              
              // Only update if backend has higher/newer values to prevent reset
              const petUpdates: Partial<typeof currentPet> = {
                // Keep existing hatched status and birth year from localStorage
                hatched: currentPet.hatched,
                birthYear: currentPet.birthYear,
                hatchProgress: currentPet.hatchProgress,
                // Update coins and timing from backend
                pendingCoins: dashboard.pet.pendingRewards || 0,
                lastCoinTime: dashboard.pet.lastClaimTime ? new Date(dashboard.pet.lastClaimTime).getTime() : Date.now(),
                // Use consistent maxExp
                maxExp: 1200,
              };
              
              // Only update level and XP if backend has valid data AND it's higher than current
              if (dashboard.pet.level && dashboard.pet.level >= currentPet.level) {
                petUpdates.level = dashboard.pet.level;
                petUpdates.exp = dashboard.pet.currentXp || 0;
                console.log(`🔄 Pet sync: Level ${currentPet.level} → ${dashboard.pet.level}, XP: ${dashboard.pet.currentXp || 0}/1200`);
              } else {
                // Keep current level and XP if backend data is lower (prevent reset)
                console.log(`🚫 Keeping local pet data: Level ${currentPet.level}, XP: ${currentPet.exp}/1200 (backend had lower values)`);
              }
              
              get().setPet(petUpdates);
            }

            // Update energy state
            if (dashboard.energy) {
              console.log('⚡ Updating energy state:', dashboard.energy);
              get().setEnergy({
                currentEnergy: dashboard.energy.currentEnergy || 10,
                maxEnergy: dashboard.energy.maxEnergy || 10,
                lastUpdate: dashboard.energy.lastUpdate ? new Date(dashboard.energy.lastUpdate).getTime() : Date.now(),
              });
            }

            // Update ranking
            if (dashboard.ranking) {
              console.log('🏆 Updating ranking:', dashboard.ranking);
              get().setRanking({
                rank: dashboard.ranking.rank || 'RANK1',
                position: dashboard.ranking.position || 999,
                lifetimePoints: dashboard.ranking.lifetimePoints || 0,
                nextRankThreshold: dashboard.ranking.pointsToNextRank || 1000,
              });
            }

            // Update game stats
            if (dashboard.gameStats) {
              console.log('📈 Updating game stats:', dashboard.gameStats);
              get().setGameStats({
                totalGamesPlayed: dashboard.gameStats.totalGamesPlayed || 0,
                totalScore: dashboard.gameStats.totalScore || 0,
                averageScore: dashboard.gameStats.averageScore || 0,
                bestScore: dashboard.gameStats.bestScore || 0,
                totalPointsEarned: dashboard.gameStats.totalPointsEarned || 0,
              });
            }

            // Update user points if available in dashboard
            if (dashboard.user && dashboard.user.total_points !== undefined) {
              console.log('💰 Dashboard user points:', dashboard.user.total_points);
              const dashboardPoints = Number(dashboard.user.total_points);
              
              set((state) => {
                const currentBalance = state.user?.tokenBalance || 0;
                
                // Check if there's a recent transaction (within last 10 seconds)
                const hasRecentTransaction = state.recentTransaction && 
                  (Date.now() - state.recentTransaction.timestamp) < 10000;
                
                if (hasRecentTransaction) {
                  console.log('⏰ Recent transaction detected, keeping current balance to avoid overwrite');
                  return state; // Don't update balance
                }
                
                // Only update if dashboard has higher value (to avoid overwriting recent claims)
                const shouldUpdate = dashboardPoints > currentBalance;
                
                console.log(`💰 Current: ${currentBalance}, Dashboard: ${dashboardPoints}, Update: ${shouldUpdate}`);
                
                return {
                  user: state.user ? {
                    ...state.user,
                    tokenBalance: shouldUpdate ? dashboardPoints : currentBalance,
                  } : state.user,
                  // Clear old transaction flags
                  recentTransaction: hasRecentTransaction ? state.recentTransaction : null,
                };
              });
            } else if (dashboard.userExists === false) {
              console.log('👤 User does not exist in database yet - keeping local balance');
              // Don't update balance if user doesn't exist in DB
              // The user will be created when they perform actions like claiming coins
            }
            
            console.log('✅ Game dashboard loaded successfully');
          } else {
            console.warn('⚠️ Dashboard response missing success flag or empty:', dashboard);
            
            // Check if it's completely empty
            if (!dashboard || Object.keys(dashboard).length === 0) {
              console.log('📭 Dashboard response is empty - backend may not be available');
              console.log('🔄 App will continue with local data');
            } else {
              console.log('📊 Dashboard has some data but no success flag - processing anyway');
              
              // Try to process the data even without success flag
              if (dashboard.pet) {
                console.log('🐾 Processing pet data from response');
                const currentPet = get().pet;
                
                // Same logic as above - don't overwrite local progress
                const petUpdates: Partial<typeof currentPet> = {
                  hatched: currentPet.hatched,
                  birthYear: currentPet.birthYear,
                  hatchProgress: currentPet.hatchProgress,
                  pendingCoins: dashboard.pet.pendingRewards || 0,
                  lastCoinTime: dashboard.pet.lastClaimTime ? new Date(dashboard.pet.lastClaimTime).getTime() : Date.now(),
                  maxExp: 1200,
                };
                
                // Only update level and XP if backend has valid data AND it's higher
                if (dashboard.pet.level && dashboard.pet.level >= currentPet.level) {
                  petUpdates.level = dashboard.pet.level;
                  petUpdates.exp = dashboard.pet.currentXp || 0;
                } else {
                  console.log(`🚫 Keeping local pet data in fallback processing`);
                }
                
                get().setPet(petUpdates);
              }
              
              if (dashboard.energy) {
                console.log('⚡ Processing energy data from response');
                get().setEnergy({
                  currentEnergy: dashboard.energy.currentEnergy || 10,
                  maxEnergy: dashboard.energy.maxEnergy || 10,
                  lastUpdate: dashboard.energy.lastUpdate ? new Date(dashboard.energy.lastUpdate).getTime() : Date.now(),
                });
              }
            }
          }
        } catch (error) {
          console.error('❌ Failed to load game dashboard:', error);
          // Don't set error state - app can work without dashboard data
          console.log('⚠️ Continuing without dashboard data');
        }
      },

      // Global Actions
      reset: () => set(initialState),

      // Rank up notification actions
      showRankUpNotification: (newRank: string, coinsAwarded: number) => {
        set({
          rankUpNotification: {
            show: true,
            newRank,
            coinsAwarded,
          }
        });
      },

      hideRankUpNotification: () => {
        set({ rankUpNotification: null });
      },
    }),
    {
      name: 'tg-mini-app-storage',
      storage: customStorage,
      partialize: (state) => {
        // Only persist specific keys
        const persisted: Partial<AppState> = {};
        for (const key of PERSISTED_KEYS) {
          (persisted as Record<string, unknown>)[key] = state[key];
        }
        return persisted;
      },
      // Handle hydration from storage on app load
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert date strings back to Date objects after rehydration
          if (state.user) {
            state.user = {
              ...state.user,
              createdAt: new Date(state.user.createdAt),
              updatedAt: new Date(state.user.updatedAt),
              lastDailyClaim: state.user.lastDailyClaim
                ? new Date(state.user.lastDailyClaim)
                : undefined,
            };
          }

          if (state.dailyReward?.nextClaimAt) {
            state.dailyReward = {
              ...state.dailyReward,
              nextClaimAt: new Date(state.dailyReward.nextClaimAt),
            };
          }

          if (state.rewards) {
            state.rewards = state.rewards.map((reward) => ({
              ...reward,
              createdAt: new Date(reward.createdAt),
              claimedAt: reward.claimedAt ? new Date(reward.claimedAt) : undefined,
            }));
          }

          if (state.quests) {
            state.quests = state.quests.map((quest) => ({
              ...quest,
              expiresAt: quest.expiresAt ? new Date(quest.expiresAt) : undefined,
            }));
          }

          if (state.referralStats?.friends) {
            state.referralStats = {
              ...state.referralStats,
              friends: state.referralStats.friends.map((friend) => ({
                ...friend,
                joinedAt: new Date(friend.joinedAt),
              })),
            };
          }

          // Check localStorage for pet hatching status and quest progress
          if (typeof window !== 'undefined') {
            const storedBirthYear = localStorage.getItem('user_birth_year');
            const storedHatched = localStorage.getItem('pet_hatched');
            const completedQuestIds = JSON.parse(localStorage.getItem('completed_pet_quests') || '[]');
            
            // Calculate hatch progress based on completed quests (25% per quest, 4 quests total)
            const hatchProgress = Math.min(100, completedQuestIds.length * 25);
            
            if (storedBirthYear && storedHatched === 'true') {
              state.pet = {
                ...state.pet,
                birthYear: parseInt(storedBirthYear),
                hatched: true,
                hatchProgress: 100, // If pet is hatched, progress should be 100%
              };
            } else if (completedQuestIds.length > 0) {
              // If pet is not hatched but has quest progress, restore the progress
              state.pet = {
                ...state.pet,
                hatchProgress: hatchProgress,
              };
              
              // If birth year is stored but pet is not hatched, restore birth year
              if (storedBirthYear) {
                state.pet.birthYear = parseInt(storedBirthYear);
              }
            }
          }
        }
      },
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 */
export const useUser = () => useAppStore((state) => state.user);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);
export const useQuests = () => useAppStore((state) => state.quests);
export const useQuestsLoading = () => useAppStore((state) => state.questsLoading);
export const useRewards = () => useAppStore((state) => state.rewards);
export const useDailyReward = () => useAppStore((state) => state.dailyReward);
export const useLeaderboard = () => useAppStore((state) => state.leaderboard);
export const useHasMoreLeaderboard = () => useAppStore((state) => state.hasMoreLeaderboard);
export const useCards = () => useAppStore((state) => state.cards);
export const useActiveCardCategory = () => useAppStore((state) => state.activeCardCategory);
export const useReferralStats = () => useAppStore((state) => state.referralStats);
export const useWallet = () => useAppStore((state) => state.wallet);
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useSpinsLeft = () => useAppStore((state) => state.spinsLeft);
export const usePet = () => useAppStore((state) => state.pet);

// New Game System Selectors
export const useEnergy = () => useAppStore((state) => state.energy);
export const useGameStats = () => useAppStore((state) => state.gameStats);
export const useRanking = () => useAppStore((state) => state.ranking);
export const useGameCycle = () => useAppStore((state) => state.gameCycle);

/**
 * Action hooks for cleaner component code
 * Using useShallow to prevent infinite loops with object selectors
 */
export const useUserActions = () => {
  const setUser = useAppStore((state) => state.setUser);
  const updateBalance = useAppStore((state) => state.updateBalance);
  const addXP = useAppStore((state) => state.addXP);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  return { setUser, updateBalance, addXP, setLoading, setError };
};

export const useQuestActions = () => {
  const setQuests = useAppStore((state) => state.setQuests);
  const updateQuest = useAppStore((state) => state.updateQuest);
  const setQuestsLoading = useAppStore((state) => state.setQuestsLoading);
  return { setQuests, updateQuest, setQuestsLoading };
};

export const useRewardActions = () => {
  const setRewards = useAppStore((state) => state.setRewards);
  const claimReward = useAppStore((state) => state.claimReward);
  const setDailyReward = useAppStore((state) => state.setDailyReward);
  return { setRewards, claimReward, setDailyReward };
};

export const useLeaderboardActions = () => {
  const setLeaderboard = useAppStore((state) => state.setLeaderboard);
  const appendLeaderboard = useAppStore((state) => state.appendLeaderboard);
  const setLeaderboardPage = useAppStore((state) => state.setLeaderboardPage);
  return { setLeaderboard, appendLeaderboard, setLeaderboardPage };
};

export const useCardActions = () => {
  const setCards = useAppStore((state) => state.setCards);
  const updateCard = useAppStore((state) => state.updateCard);
  const setActiveCardCategory = useAppStore((state) => state.setActiveCardCategory);
  const purchaseCard = useAppStore((state) => state.purchaseCard);
  const upgradeCard = useAppStore((state) => state.upgradeCard);
  return { setCards, updateCard, setActiveCardCategory, purchaseCard, upgradeCard };
};

export const useFriendsActions = () => {
  const setReferralStats = useAppStore((state) => state.setReferralStats);
  const addReferralBonus = useAppStore((state) => state.addReferralBonus);
  return { setReferralStats, addReferralBonus };
};

export const useWalletActions = () => {
  const setWallet = useAppStore((state) => state.setWallet);
  return { setWallet };
};

export const useNavigationActions = () => {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  return { setActiveTab };
};

export const useGameSystemActions = () => {
  const setEnergy = useAppStore((state) => state.setEnergy);
  const consumeEnergy = useAppStore((state) => state.consumeEnergy);
  const regenerateEnergy = useAppStore((state) => state.regenerateEnergy);
  const setGameStats = useAppStore((state) => state.setGameStats);
  const updateGameStats = useAppStore((state) => state.updateGameStats);
  const setRanking = useAppStore((state) => state.setRanking);
  const setGameCycle = useAppStore((state) => state.setGameCycle);
  const feedGamePet = useAppStore((state) => state.feedGamePet);
  const claimGamePetRewards = useAppStore((state) => state.claimGamePetRewards);
  const startGameSession = useAppStore((state) => state.startGameSession);
  const completeGameSession = useAppStore((state) => state.completeGameSession);
  const refillGameEnergy = useAppStore((state) => state.refillGameEnergy);
  const loadGameDashboard = useAppStore((state) => state.loadGameDashboard);
  
  return {
    setEnergy,
    consumeEnergy,
    regenerateEnergy,
    setGameStats,
    updateGameStats,
    setRanking,
    setGameCycle,
    feedGamePet,
    claimGamePetRewards,
    startGameSession,
    completeGameSession,
    refillGameEnergy,
    loadGameDashboard,
  };
};
