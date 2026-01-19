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
  claimPetCoins: () => void;

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
    maxExp: 100,
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
    rank: 'BRONZE',
    position: 0,
    lifetimePoints: 0,
    nextRankThreshold: 10000,
  },

  gameCycle: null,
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
      setUser: (user) => set({ user }),

      updateBalance: async (amount, currency) => {
        const { user } = get();
        if (!user) return;

        if (currency === 'token') {
          // Update local state immediately
          const newBalance = user.tokenBalance + amount;
          set({
            user: {
              ...user,
              tokenBalance: newBalance,
              updatedAt: new Date(),
            },
          });
          
          // Sync to backend
          if (amount !== 0) {
            try {
              const { backendAPI } = await import('../services/backend-api.service');
              console.log(`💰 Syncing points to backend: ${amount > 0 ? '+' : ''}${amount}`);
              const result = await backendAPI.addPoints(amount);
              console.log(`✅ Backend sync success. New total: ${result.total_points}`);
              
              // Update local state with backend's authoritative value
              const currentUser = get().user;
              if (currentUser) {
                set({
                  user: {
                    ...currentUser,
                    tokenBalance: Number(result.total_points),
                  },
                });
              }
            } catch (err) {
              console.error('❌ Failed to sync points to backend:', err);
              // Revert local change on error
              const currentUser = get().user;
              if (currentUser) {
                set({
                  user: {
                    ...currentUser,
                    tokenBalance: currentUser.tokenBalance - amount,
                  },
                });
              }
            }
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
      claimPetCoins: () => {
        const { pet } = get();
        if (pet.pendingCoins > 0) {
          get().updateBalance(pet.pendingCoins, 'token');
          set({ 
            pet: { 
              ...pet, 
              pendingCoins: 0, 
              lastCoinTime: Date.now() 
            } 
          });
        }
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
        const REGEN_INTERVAL = 30 * 60 * 1000; // 30 minutes
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
          const { backendAPI } = await import('../services/backend-api.service');
          const result = await backendAPI.feedGamePet(feedCount);
          
          // Update local pet state with backend response
          if (result.pet) {
            get().setPet({
              level: result.pet.level,
              exp: result.pet.currentXp,
              maxExp: result.pet.xpForNextLevel,
            });
          }

          // Update user points if changed
          if (result.user && result.user.total_points !== undefined) {
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: {
                  ...currentUser,
                  tokenBalance: Number(result.user.total_points),
                }
              });
            }
          }
        } catch (error) {
          console.error('Failed to feed pet:', error);
          get().setError('Failed to feed pet');
        }
      },

      claimGamePetRewards: async () => {
        try {
          const { backendAPI } = await import('../services/backend-api.service');
          const result = await backendAPI.claimGamePetRewards();
          
          // Update user points with claimed rewards
          if (result.pointsEarned) {
            get().updateBalance(result.pointsEarned, 'token');
          }

          // Update pet state
          if (result.pet) {
            get().setPet({
              lastCoinTime: Date.now(),
              pendingCoins: 0,
            });
          }
        } catch (error) {
          console.error('Failed to claim pet rewards:', error);
          get().setError('Failed to claim rewards');
        }
      },

      startGameSession: async (gameType) => {
        try {
          const { backendAPI } = await import('../services/backend-api.service');
          const result = await backendAPI.startGameSession(gameType);
          
          // Consume energy locally
          if (result.energyUsed) {
            get().consumeEnergy(result.energyUsed);
          }

          return result;
        } catch (error) {
          console.error('Failed to start game session:', error);
          get().setError('Failed to start game');
          throw error;
        }
      },

      completeGameSession: async (score, duration) => {
        try {
          const { backendAPI } = await import('../services/backend-api.service');
          const result = await backendAPI.completeGameSession(score, duration);
          
          // Update game stats
          if (result.pointsEarned) {
            get().updateGameStats(score, result.pointsEarned);
            get().updateBalance(result.pointsEarned, 'token');
          }

          // Update ranking if changed
          if (result.ranking) {
            get().setRanking(result.ranking);
          }
        } catch (error) {
          console.error('Failed to complete game session:', error);
          get().setError('Failed to complete game');
        }
      },

      refillGameEnergy: async (amount) => {
        try {
          const { backendAPI } = await import('../services/backend-api.service');
          const result = await backendAPI.refillEnergy(amount);
          
          // Update energy state
          if (result.energy) {
            get().setEnergy({
              currentEnergy: result.energy.currentEnergy,
              maxEnergy: result.energy.maxEnergy,
              lastUpdate: Date.now(),
            });
          }

          // Update user points if cost was deducted
          if (result.user && result.user.total_points !== undefined) {
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: {
                  ...currentUser,
                  tokenBalance: Number(result.user.total_points),
                }
              });
            }
          }
        } catch (error) {
          console.error('Failed to refill energy:', error);
          get().setError('Failed to refill energy');
        }
      },

      loadGameDashboard: async () => {
        try {
          const { backendAPI } = await import('../services/backend-api.service');
          const dashboard = await backendAPI.getGameDashboard();
          
          if (dashboard.success) {
            // Update pet state
            if (dashboard.pet) {
              get().setPet({
                level: dashboard.pet.level,
                exp: dashboard.pet.currentXp,
                maxExp: dashboard.pet.xpForNextLevel,
                pendingCoins: dashboard.pet.pendingRewards || 0,
                lastCoinTime: dashboard.pet.lastClaimTime ? new Date(dashboard.pet.lastClaimTime).getTime() : Date.now(),
              });
            }

            // Update energy state
            if (dashboard.energy) {
              get().setEnergy({
                currentEnergy: dashboard.energy.currentEnergy,
                maxEnergy: dashboard.energy.maxEnergy,
                lastUpdate: dashboard.energy.lastUpdate ? new Date(dashboard.energy.lastUpdate).getTime() : Date.now(),
              });
            }

            // Update ranking
            if (dashboard.ranking) {
              get().setRanking({
                rank: dashboard.ranking.rank,
                position: dashboard.ranking.position,
                lifetimePoints: dashboard.ranking.lifetimePoints,
                nextRankThreshold: dashboard.ranking.nextRankThreshold,
              });
            }

            // Update game stats
            if (dashboard.gameStats) {
              get().setGameStats({
                totalGamesPlayed: dashboard.gameStats.totalGamesPlayed,
                totalScore: dashboard.gameStats.totalScore,
                averageScore: dashboard.gameStats.averageScore,
                bestScore: dashboard.gameStats.bestScore,
                totalPointsEarned: dashboard.gameStats.totalPointsEarned,
              });
            }

            // Load current game cycle
            const cycle = await backendAPI.getCurrentGameCycle();
            if (cycle) {
              get().setGameCycle(cycle);
            }
          }
        } catch (error) {
          console.error('Failed to load game dashboard:', error);
          get().setError('Failed to load game data');
        }
      },

      // Global Actions
      reset: () => set(initialState),
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
