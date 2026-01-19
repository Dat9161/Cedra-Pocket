/**
 * Backend API Service
 * Connects to NestJS backend for real data
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  UserData,
  Quest,
  ReferralStats,
} from '../models';

// API Base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cedra-pocket-wybm.vercel.app';

/**
 * API Error class
 */
export class BackendAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'BackendAPIError';
  }
}

/**
 * Auth response from backend
 */
export interface AuthResponse {
  access_token: string;
  user: BackendUser;
}

/**
 * Backend user model (matches Prisma schema)
 */
export interface BackendUser {
  id: string | bigint;
  telegram_id: string;
  username: string | null;
  wallet_address: string | null;
  is_wallet_connected: boolean;
  total_points: number | string;
  current_rank: string;
  referral_code: string | null;
  referrer_id: string | bigint | null;
  created_at: string;
  updated_at: string;
}

/**
 * Backend quest model
 */
export interface BackendQuest {
  id: number;
  title: string;
  description: string | null;
  type: 'SOCIAL' | 'ONCHAIN';
  category: string | null;
  config: Record<string, unknown>;
  reward_amount: number | string;
  reward_type: string;
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY';
  is_active: boolean;
  user_status?: 'NOT_STARTED' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CLAIMED';
  user_completed_at?: string;
  user_claimed_at?: string;
}

/**
 * Backend API Service
 */
export class BackendAPIService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add JWT token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, clear it
          this.token = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('jwt_token');
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('jwt_token');
    }
  }

  /**
   * Set JWT token
   */
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', token);
    }
  }

  /**
   * Clear JWT token
   */
  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
    }
  }

  /**
   * Check if authenticated (for serverless, we'll use Telegram WebApp context)
   */
  isAuthenticated(): boolean {
    // For serverless deployment, we rely on Telegram WebApp context
    if (typeof window !== 'undefined') {
      return !!(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
    }
    return false;
  }

  /**
   * Authenticate with Telegram initData
   */
  async authenticate(initData: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/auth/verify', {
        initData,
      });

      // Save token
      this.setToken(response.data.access_token);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Authentication failed',
          error.response?.status || 500,
          'AUTH_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<BackendUser> {
    try {
      const response = await this.client.get<BackendUser>('/users/profile');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get profile',
          error.response?.status || 500,
          'PROFILE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Connect wallet
   */
  async connectWallet(walletAddress: string): Promise<BackendUser> {
    try {
      const response = await this.client.post<BackendUser>('/users/connect-wallet', {
        wallet_address: walletAddress,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to connect wallet',
          error.response?.status || 500,
          'WALLET_CONNECT_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Add points to user (sync with backend)
   */
  async addPoints(points: number): Promise<BackendUser> {
    try {
      const response = await this.client.post<BackendUser>('/users/add-points', {
        points,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to add points',
          error.response?.status || 500,
          'ADD_POINTS_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get quests list
   */
  async getQuests(): Promise<BackendQuest[]> {
    try {
      const response = await this.client.get<BackendQuest[]>('/quests');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get quests',
          error.response?.status || 500,
          'QUESTS_FAILED'
        );
      }
      throw error;
    }
  }



  /**
   * Verify/complete a quest
   */
  async verifyQuest(
    questId: number,
    proofData?: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post(`/quests/${questId}/verify`, {
        proof_data: proofData || {},
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Quest verification failed',
          error.response?.status || 500,
          'QUEST_VERIFY_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          'Backend not available',
          error.response?.status || 500,
          'HEALTH_CHECK_FAILED'
        );
      }
      throw error;
    }
  }

  // ============ Adapter methods to match existing frontend interface ============

  /**
   * Convert backend user to frontend UserData format
   */
  backendUserToUserData(backendUser: BackendUser, telegramUser?: { username?: string; firstName?: string; photoUrl?: string }): UserData {
    return {
      id: String(backendUser.id),
      telegramId: backendUser.telegram_id,
      username: telegramUser?.username || telegramUser?.firstName || backendUser.username || 'Player',
      avatarUrl: telegramUser?.photoUrl,
      level: this.calculateLevel(Number(backendUser.total_points)),
      currentXP: Number(backendUser.total_points) % 1000,
      requiredXP: 1000,
      tokenBalance: Number(backendUser.total_points),
      walletBalance: 0, // Backend doesn't have wallet balance yet
      gemBalance: 0, // Backend doesn't have gems yet
      earningRate: 10,
      walletAddress: backendUser.wallet_address || undefined,
      createdAt: new Date(backendUser.created_at),
      updatedAt: new Date(backendUser.updated_at),
    };
  }

  /**
   * Convert backend quest to frontend Quest format
   */
  backendQuestToQuest(backendQuest: BackendQuest): Quest {
    const statusMap: Record<string, 'active' | 'completed' | 'locked'> = {
      'NOT_STARTED': 'active',
      'PENDING': 'active',
      'COMPLETED': 'completed',
      'CLAIMED': 'completed',
      'FAILED': 'active',
    };

    return {
      id: String(backendQuest.id),
      title: backendQuest.title,
      description: backendQuest.description || '',
      iconUrl: '',
      type: backendQuest.type === 'SOCIAL' ? 'social' : 'achievement',
      status: statusMap[backendQuest.user_status || 'NOT_STARTED'] || 'active',
      progress: backendQuest.user_status === 'COMPLETED' || backendQuest.user_status === 'CLAIMED' ? 100 : 0,
      currentValue: backendQuest.user_status === 'COMPLETED' || backendQuest.user_status === 'CLAIMED' ? 1 : 0,
      targetValue: 1,
      reward: {
        type: backendQuest.reward_type === 'POINT' ? 'token' : 'token',
        amount: Number(backendQuest.reward_amount),
      },
    };
  }

  /**
   * Calculate level from total points
   */
  private calculateLevel(totalPoints: number): number {
    return Math.floor(totalPoints / 1000) + 1;
  }

  /**
   * Get referral stats
   */
  async getReferralStats(): Promise<ReferralStats> {
    // TODO: Implement when backend has referral endpoint
    const user = await this.getUserProfile();
    return {
      totalReferrals: 0,
      totalBonus: 0,
      referralLink: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'cedra_quest_bot'}?start=${user.referral_code || ''}`,
      friends: [],
    };
  }

  // ============ Pet API Methods ============

  /**
   * Pet data interface
   */
  

  /**
   * Get pet data
   */
  async getPet(): Promise<PetData> {
    try {
      const response = await this.client.get<PetData>('/pets');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get pet',
          error.response?.status || 500,
          'PET_GET_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Update pet data
   */
  async updatePet(petData: Partial<PetData>): Promise<PetData> {
    try {
      const response = await this.client.put<PetData>('/pets', petData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to update pet',
          error.response?.status || 500,
          'PET_UPDATE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Claim pet coins
   */
  async claimPetCoins(coins: number): Promise<PetData> {
    try {
      const response = await this.client.post<PetData>('/pets/claim', { coins });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to claim coins',
          error.response?.status || 500,
          'PET_CLAIM_FAILED'
        );
      }
      throw error;
    }
  }

  // ============ New Game System APIs ============

  /**
   * Get pet status from new game system
   */
  async getGamePetStatus(): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/pet/status/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get pet status',
          error.response?.status || 500,
          'GAME_PET_STATUS_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Feed pet in new game system
   */
  async feedGamePet(feedCount: number = 1): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.post(`/game/pet/feed/${user.telegram_id}`, {
        feedCount,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to feed pet',
          error.response?.status || 500,
          'GAME_PET_FEED_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Claim pet rewards in new game system with retry logic
   */
  async claimGamePetRewards(telegramId?: string): Promise<any> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use provided telegram ID or get from Telegram WebApp
        let userId = telegramId;
        if (!userId) {
          // Get telegram ID from Telegram WebApp context
          if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            userId = String((window as any).Telegram.WebApp.initDataUnsafe.user.id);
          } else {
            // Fallback: try to get from stored user data
            const storedUser = localStorage.getItem('tg-mini-app-storage');
            if (storedUser) {
              const parsed = JSON.parse(storedUser);
              if (parsed.state?.user?.telegramId) {
                userId = parsed.state.user.telegramId;
              }
            }
          }
        }

        if (!userId) {
          console.error('❌ User ID not available from any source, using test ID');
          // Use test ID for development
          userId = '123456789';
        }

        console.log(`💰 [Attempt ${attempt}] Claiming pet rewards for user:`, userId);

        const response = await this.client.post(`/game/pet/claim/${userId}`, {}, {
          timeout: 10000 // 10 seconds timeout
        });

        console.log(`✅ [Attempt ${attempt}] Pet rewards claimed successfully:`, response.data);
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(`❌ [Attempt ${attempt}] Claim pet rewards error:`, error);
        
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // 1s, 2s, 3s delays
          console.log(`⏳ Retrying claim in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    if (axios.isAxiosError(lastError)) {
      throw new BackendAPIError(
        lastError.response?.data?.message || 'Failed to claim pet rewards after retries',
        lastError.response?.status || 500,
        'GAME_PET_CLAIM_FAILED'
      );
    }
    throw lastError;
  }

  /**
   * Get energy status
   */
  async getEnergyStatus(): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/energy/status/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get energy status',
          error.response?.status || 500,
          'GAME_ENERGY_STATUS_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Refill energy
   */
  async refillEnergy(energyAmount: number): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.post(`/game/energy/refill/${user.telegram_id}`, {
        energyAmount,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to refill energy',
          error.response?.status || 500,
          'GAME_ENERGY_REFILL_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Start game session
   */
  async startGameSession(gameType: string): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.post(`/game/session/start/${user.telegram_id}`, {
        gameType,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to start game session',
          error.response?.status || 500,
          'GAME_SESSION_START_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Complete game session
   */
  async completeGameSession(score: number, duration?: number): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.post(`/game/session/complete/${user.telegram_id}`, {
        score,
        duration,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to complete game session',
          error.response?.status || 500,
          'GAME_SESSION_COMPLETE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get game stats
   */
  async getGameStats(): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/session/stats/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get game stats',
          error.response?.status || 500,
          'GAME_STATS_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get user rank info
   */
  async getUserRankInfo(): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/ranking/user/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get user rank info',
          error.response?.status || 500,
          'GAME_RANK_INFO_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await this.client.get(`/game/ranking/leaderboard?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get leaderboard',
          error.response?.status || 500,
          'GAME_LEADERBOARD_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get user position in ranking
   */
  async getUserPosition(): Promise<any> {
    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/ranking/position/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get user position',
          error.response?.status || 500,
          'GAME_POSITION_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get current game cycle
   */
  async getCurrentGameCycle(): Promise<any> {
    try {
      const response = await this.client.get('/game/cycle/current');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get current game cycle',
          error.response?.status || 500,
          'GAME_CYCLE_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Get complete game dashboard with retry logic
   */
  async getGameDashboard(telegramId?: string): Promise<any> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use provided telegram ID or get from Telegram WebApp
        let userId = telegramId;
        if (!userId) {
          console.log(`🔍 [Attempt ${attempt}] Getting user ID from Telegram WebApp...`);
          
          // Get telegram ID from Telegram WebApp context
          if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            userId = String((window as any).Telegram.WebApp.initDataUnsafe.user.id);
            console.log('✅ Got user ID from Telegram WebApp:', userId);
          } else {
            console.log('⚠️ Telegram WebApp user ID not available, trying localStorage...');
            
            // Fallback: try to get from stored user data
            const storedUser = localStorage.getItem('tg-mini-app-storage');
            if (storedUser) {
              const parsed = JSON.parse(storedUser);
              if (parsed.state?.user?.telegramId) {
                userId = parsed.state.user.telegramId;
                console.log('✅ Got user ID from localStorage:', userId);
              }
            }
          }
        }

        if (!userId) {
          console.error('❌ User ID not available from any source, using test ID');
          // Use test ID for development
          userId = '123456789';
        }

        console.log(`🚀 [Attempt ${attempt}] Calling game dashboard API with user ID:`, userId);
        
        // Add timeout for the request
        const response = await this.client.get(`/game/dashboard/${userId}`, {
          timeout: 10000 // 10 seconds timeout
        });
        
        console.log(`✅ [Attempt ${attempt}] Game dashboard API response:`, response.data);
        
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(`❌ [Attempt ${attempt}] Game dashboard API error:`, error);
        
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // 1s, 2s, 3s delays
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    if (axios.isAxiosError(lastError)) {
      throw new BackendAPIError(
        lastError.response?.data?.message || 'Failed to get game dashboard after retries',
        lastError.response?.status || 500,
        'GAME_DASHBOARD_FAILED'
      );
    }
    throw lastError;
  }
}

export interface PetData {
  level: number;
  exp: number;
  maxExp: number;
  hunger: number;
  happiness: number;
  lastCoinTime: number;
  pendingCoins: number;
}

// Singleton instance
export const backendAPI = new BackendAPIService();
