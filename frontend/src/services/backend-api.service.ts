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
   * Check if backend is available
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      // Quick health check with short timeout
      const response = await this.client.get('/health', {
        timeout: 2000 // Reduced from default to 2 seconds
      });
      return response.status === 200;
    } catch (error) {
      console.log('Backend not available:', error);
      return false;
    }
  }

  /**
   * Check if authenticated (for serverless, we'll use Telegram WebApp context)
   */
  isAuthenticated(): boolean {
    // For serverless deployment, we rely on Telegram WebApp context
    // But don't require backend to be available
    if (typeof window !== 'undefined') {
      return Boolean((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) || Boolean(this.token);
    }
    return Boolean(this.token);
  }

  /**
   * Authenticate with Telegram initData
   */
  async authenticate(initData: string): Promise<AuthResponse> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for authentication');
      // Return mock auth response for local gameplay
      const mockUser: BackendUser = {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: null,
        is_wallet_connected: false,
        total_points: 0,
        current_rank: 'Shrimp',
        referral_code: 'local_ref',
        referrer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      return {
        access_token: 'local_token',
        user: mockUser,
      };
    }

    try {
      const response = await this.client.post<AuthResponse>('/auth/verify', {
        initData,
      });

      // Save token
      this.setToken(response.data.access_token);

      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to authenticate via backend, using local fallback');
      // Return mock auth response for local gameplay
      const mockUser: BackendUser = {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: null,
        is_wallet_connected: false,
        total_points: 0,
        current_rank: 'Shrimp',
        referral_code: 'local_ref',
        referrer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Set local token
      this.setToken('local_token');
      
      return {
        access_token: 'local_token',
        user: mockUser,
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<BackendUser> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for user profile');
      // Return mock user profile for local gameplay
      return {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: null,
        is_wallet_connected: false,
        total_points: 0,
        current_rank: 'Shrimp',
        referral_code: 'local_ref',
        referrer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    try {
      const response = await this.client.get<BackendUser>('/users/profile');
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get user profile from backend, using local fallback');
      // Return mock user profile for local gameplay
      return {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: null,
        is_wallet_connected: false,
        total_points: 0,
        current_rank: 'Shrimp',
        referral_code: 'local_ref',
        referrer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Connect wallet
   */
  async connectWallet(walletAddress: string): Promise<BackendUser> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for wallet connection');
      // Return mock user with connected wallet for local gameplay
      return {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: walletAddress,
        is_wallet_connected: true,
        total_points: 0,
        current_rank: 'Shrimp',
        referral_code: 'local_ref',
        referrer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    try {
      const response = await this.client.post<BackendUser>('/users/connect-wallet', {
        wallet_address: walletAddress,
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to connect wallet via backend, using local fallback');
      // Return mock user with connected wallet for local gameplay
      return {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: walletAddress,
        is_wallet_connected: true,
        total_points: 0,
        current_rank: 'Shrimp',
        referral_code: 'local_ref',
        referrer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Add points to user (sync with backend)
   */
  async addPoints(points: number): Promise<BackendUser> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, points will be stored locally');
      // Return a mock user response for local gameplay
      return {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: null,
        is_wallet_connected: false,
        total_points: points,
        current_rank: 'Shrimp',
        referral_code: null,
        referrer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    try {
      const response = await this.client.post<BackendUser>('/users/add-points', {
        points,
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to add points to backend, storing locally');
      // Return a mock user response for local gameplay
      return {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: null,
        is_wallet_connected: false,
        total_points: points,
        current_rank: 'Shrimp',
        referral_code: null,
        referrer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Get quests list
   */
  async getQuests(): Promise<BackendQuest[]> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback quests');
      // Return mock quests for local gameplay
      return [
        {
          id: 1,
          title: 'Follow on Twitter',
          description: 'Follow our official Twitter account',
          type: 'SOCIAL',
          category: 'social',
          config: { url: 'https://twitter.com/cedra_quest' },
          reward_amount: 100,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 2,
          title: 'Join Telegram',
          description: 'Join our Telegram community',
          type: 'SOCIAL',
          category: 'social',
          config: { url: 'https://t.me/cedra_quest' },
          reward_amount: 100,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 3,
          title: 'Daily Check-in',
          description: 'Check in daily to earn rewards',
          type: 'ONCHAIN',
          category: 'daily',
          config: {},
          reward_amount: 50,
          reward_type: 'POINT',
          frequency: 'DAILY',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
      ];
    }

    try {
      const response = await this.client.get<BackendQuest[]>('/quests');
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get quests from backend, using local fallback');
      // Return mock quests for local gameplay
      return [
        {
          id: 1,
          title: 'Follow on Twitter',
          description: 'Follow our official Twitter account',
          type: 'SOCIAL',
          category: 'social',
          config: { url: 'https://twitter.com/cedra_quest' },
          reward_amount: 100,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 2,
          title: 'Join Telegram',
          description: 'Join our Telegram community',
          type: 'SOCIAL',
          category: 'social',
          config: { url: 'https://t.me/cedra_quest' },
          reward_amount: 100,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 3,
          title: 'Daily Check-in',
          description: 'Check in daily to earn rewards',
          type: 'ONCHAIN',
          category: 'daily',
          config: {},
          reward_amount: 50,
          reward_type: 'POINT',
          frequency: 'DAILY',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
      ];
    }
  }



  /**
   * Verify/complete a quest
   */
  async verifyQuest(
    questId: number,
    proofData?: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for quest verification');
      // Return mock success for local gameplay
      return {
        success: true,
        message: 'Quest completed successfully (offline mode)',
      };
    }

    try {
      const response = await this.client.post(`/quests/${questId}/verify`, {
        proof_data: proofData || {},
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to verify quest via backend, using local fallback');
      // Return mock success for local gameplay
      return {
        success: true,
        message: 'Quest completed successfully (offline mode)',
      };
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
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for referral stats');
      // Return mock referral stats for local gameplay
      return {
        totalReferrals: 0,
        totalBonus: 0,
        referralLink: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'cedra_quest_bot'}?start=local_user`,
        friends: [],
      };
    }

    try {
      // TODO: Implement when backend has referral endpoint
      const user = await this.getUserProfile();
      return {
        totalReferrals: 0,
        totalBonus: 0,
        referralLink: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'cedra_quest_bot'}?start=${user.referral_code || ''}`,
        friends: [],
      };
    } catch (error) {
      console.log('⚠️ Failed to get referral stats from backend, using local fallback');
      // Return mock referral stats for local gameplay
      return {
        totalReferrals: 0,
        totalBonus: 0,
        referralLink: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'cedra_quest_bot'}?start=local_user`,
        friends: [],
      };
    }
  }

  // ============ Pet API Methods ============

  /**
   * Pet data interface
   */
  

  /**
   * Get pet data
   */
  async getPet(): Promise<PetData> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for pet data');
      // Return mock pet data for local gameplay
      return {
        level: 1,
        exp: 0,
        maxExp: 100,
        hunger: 50,
        happiness: 50,
        lastCoinTime: Date.now(),
        pendingCoins: 0,
      };
    }

    try {
      const response = await this.client.get<PetData>('/pets');
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get pet data from backend, using local fallback');
      // Return mock pet data for local gameplay
      return {
        level: 1,
        exp: 0,
        maxExp: 100,
        hunger: 50,
        happiness: 50,
        lastCoinTime: Date.now(),
        pendingCoins: 0,
      };
    }
  }

  /**
   * Update pet data
   */
  async updatePet(petData: Partial<PetData>): Promise<PetData> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for pet update');
      // Return mock updated pet data for local gameplay
      return {
        level: petData.level || 1,
        exp: petData.exp || 0,
        maxExp: petData.maxExp || 100,
        hunger: petData.hunger || 50,
        happiness: petData.happiness || 50,
        lastCoinTime: petData.lastCoinTime || Date.now(),
        pendingCoins: petData.pendingCoins || 0,
      };
    }

    try {
      const response = await this.client.put<PetData>('/pets', petData);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to update pet data via backend, using local fallback');
      // Return mock updated pet data for local gameplay
      return {
        level: petData.level || 1,
        exp: petData.exp || 0,
        maxExp: petData.maxExp || 100,
        hunger: petData.hunger || 50,
        happiness: petData.happiness || 50,
        lastCoinTime: petData.lastCoinTime || Date.now(),
        pendingCoins: petData.pendingCoins || 0,
      };
    }
  }

  /**
   * Claim pet coins
   */
  async claimPetCoins(coins: number): Promise<PetData> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for pet coin claim');
      // Return mock pet data after claim for local gameplay
      return {
        level: 1,
        exp: 0,
        maxExp: 100,
        hunger: 50,
        happiness: 50,
        lastCoinTime: Date.now(),
        pendingCoins: 0,
      };
    }

    try {
      const response = await this.client.post<PetData>('/pets/claim', { coins });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to claim pet coins via backend, using local fallback');
      // Return mock pet data after claim for local gameplay
      return {
        level: 1,
        exp: 0,
        maxExp: 100,
        hunger: 50,
        happiness: 50,
        lastCoinTime: Date.now(),
        pendingCoins: 0,
      };
    }
  }

  // ============ New Game System APIs ============

  /**
   * Get pet status from new game system
   */
  async getGamePetStatus(): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for pet status');
      // Return mock pet status for local gameplay
      return {
        level: 1,
        currentXp: 0,
        xpForNextLevel: 100,
        pendingRewards: 0,
        lastClaimTime: new Date().toISOString(),
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/pet/status/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get pet status from backend, using local fallback');
      // Return mock pet status for local gameplay
      return {
        level: 1,
        currentXp: 0,
        xpForNextLevel: 100,
        pendingRewards: 0,
        lastClaimTime: new Date().toISOString(),
      };
    }
  }

  /**
   * Feed pet in new game system
   */
  async feedGamePet(feedCount: number = 1): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for pet feeding');
      // Return mock feed result for local gameplay
      return {
        success: true,
        pet: {
          level: 1,
          currentXp: 5 * feedCount,
          xpForNextLevel: 100,
        },
        user: {
          total_points: 0, // Will be handled by local state
        },
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.post(`/game/pet/feed/${user.telegram_id}`, {
        feedCount,
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to feed pet via backend, using local fallback');
      // Return mock feed result for local gameplay
      return {
        success: true,
        pet: {
          level: 1,
          currentXp: 5 * feedCount,
          xpForNextLevel: 100,
        },
        user: {
          total_points: 0, // Will be handled by local state
        },
      };
    }
  }

  /**
   * Claim pet rewards in new game system with optimized retry logic
   */
  async claimGamePetRewards(telegramId?: string): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for pet claim');
      // Return a mock successful response for local gameplay
      return {
        success: true,
        pointsEarned: Math.floor(Math.random() * 100) + 50, // Random points 50-150
        newTotalPoints: 0,
        newLifetimePoints: 0,
        claimTime: new Date(),
      };
    }

    const maxRetries = 2; // Reduced from 3 to 2 for faster response

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
          timeout: 5000 // Reduced from 10s to 5s for faster response
        });

        console.log(`✅ [Attempt ${attempt}] Pet rewards claimed successfully:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ [Attempt ${attempt}] Claim pet rewards error:`, error);
        
        // Check if it's a "User not found" error - don't retry for this
        if (axios.isAxiosError(error) && error.response?.status === 400 && error.response?.data?.message === 'User not found') {
          console.log('⚠️ User not found in backend, using local fallback for pet claim');
          return {
            success: true,
            pointsEarned: Math.floor(Math.random() * 100) + 50, // Random points 50-150
            newTotalPoints: 0,
            newLifetimePoints: 0,
            claimTime: new Date(),
          };
        }
        
        if (attempt < maxRetries) {
          const delay = 500; // Reduced from variable delay to fixed 500ms
          console.log(`⏳ Retrying claim in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - return local fallback
    console.log('⚠️ All retries failed, using local fallback for pet claim');
    return {
      success: true,
      pointsEarned: Math.floor(Math.random() * 100) + 50, // Random points 50-150
      newTotalPoints: 0,
      newLifetimePoints: 0,
      claimTime: new Date(),
    };
  }

  /**
   * Get energy status
   */
  async getEnergyStatus(): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for energy status');
      // Return mock energy status for local gameplay
      return {
        currentEnergy: 100,
        maxEnergy: 100,
        lastUpdate: new Date().toISOString(),
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/energy/status/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get energy status from backend, using local fallback');
      // Return mock energy status for local gameplay
      return {
        currentEnergy: 100,
        maxEnergy: 100,
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  /**
   * Refill energy
   */
  async refillEnergy(energyAmount: number): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for energy refill');
      // Return mock refill result for local gameplay
      return {
        success: true,
        energy: {
          currentEnergy: energyAmount,
          maxEnergy: 100,
        },
        user: {
          total_points: 0, // Will be handled by local state
        },
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.post(`/game/energy/refill/${user.telegram_id}`, {
        energyAmount,
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to refill energy via backend, using local fallback');
      // Return mock refill result for local gameplay
      return {
        success: true,
        energy: {
          currentEnergy: energyAmount,
          maxEnergy: 100,
        },
        user: {
          total_points: 0, // Will be handled by local state
        },
      };
    }
  }

  /**
   * Start game session
   */
  async startGameSession(gameType: string): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for game session start');
      // Return mock session start result for local gameplay
      return {
        success: true,
        sessionId: `local_session_${Date.now()}`,
        energyUsed: 1,
        gameType,
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.post(`/game/session/start/${user.telegram_id}`, {
        gameType,
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to start game session via backend, using local fallback');
      // Return mock session start result for local gameplay
      return {
        success: true,
        sessionId: `local_session_${Date.now()}`,
        energyUsed: 1,
        gameType,
      };
    }
  }

  /**
   * Complete game session
   */
  async completeGameSession(score: number, duration?: number): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for game session completion');
      // Return mock session completion result for local gameplay
      const pointsEarned = Math.floor(score / 10); // Simple scoring: 10 points per 100 score
      return {
        success: true,
        pointsEarned,
        ranking: {
          rank: 'Shrimp',
          position: 1000,
          lifetimePoints: pointsEarned,
        },
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.post(`/game/session/complete/${user.telegram_id}`, {
        score,
        duration,
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to complete game session via backend, using local fallback');
      // Return mock session completion result for local gameplay
      const pointsEarned = Math.floor(score / 10); // Simple scoring: 10 points per 100 score
      return {
        success: true,
        pointsEarned,
        ranking: {
          rank: 'Shrimp',
          position: 1000,
          lifetimePoints: pointsEarned,
        },
      };
    }
  }

  /**
   * Get game stats
   */
  async getGameStats(): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for game stats');
      // Return mock game stats for local gameplay
      return {
        totalGamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        totalPointsEarned: 0,
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/session/stats/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get game stats from backend, using local fallback');
      // Return mock game stats for local gameplay
      return {
        totalGamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        totalPointsEarned: 0,
      };
    }
  }

  /**
   * Get user rank info
   */
  async getUserRankInfo(): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for user rank info');
      // Return mock rank info for local gameplay
      return {
        rank: 'Shrimp',
        position: 1000,
        lifetimePoints: 0,
        nextRankThreshold: 1000,
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/ranking/user/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get user rank info from backend, using local fallback');
      // Return mock rank info for local gameplay
      return {
        rank: 'Shrimp',
        position: 1000,
        lifetimePoints: 0,
        nextRankThreshold: 1000,
      };
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 50, offset: number = 0): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for leaderboard');
      // Return mock leaderboard for local gameplay
      return {
        leaderboard: [],
        totalUsers: 0,
        hasMore: false,
      };
    }

    try {
      const response = await this.client.get(`/game/ranking/leaderboard?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get leaderboard from backend, using local fallback');
      // Return mock leaderboard for local gameplay
      return {
        leaderboard: [],
        totalUsers: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get user position in ranking
   */
  async getUserPosition(): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for user position');
      // Return mock position for local gameplay
      return {
        position: 1000,
        totalUsers: 1000,
      };
    }

    try {
      const user = await this.getUserProfile();
      const response = await this.client.get(`/game/ranking/position/${user.telegram_id}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get user position from backend, using local fallback');
      // Return mock position for local gameplay
      return {
        position: 1000,
        totalUsers: 1000,
      };
    }
  }

  /**
   * Get current game cycle
   */
  async getCurrentGameCycle(): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback for game cycle');
      // Return mock game cycle for local gameplay
      return {
        cycleNumber: 1,
        growthRate: 1.0,
        maxSpeedCap: 100,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        isActive: true,
      };
    }

    try {
      const response = await this.client.get('/game/cycle/current');
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get game cycle from backend, using local fallback');
      // Return mock game cycle for local gameplay
      return {
        cycleNumber: 1,
        growthRate: 1.0,
        maxSpeedCap: 100,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        isActive: true,
      };
    }
  }

  /**
   * Get complete game dashboard with retry logic
   */
  async getGameDashboard(telegramId?: string): Promise<any> {
    // Check if backend is available first
    const backendAvailable = await this.isBackendAvailable();
    if (!backendAvailable) {
      console.log('⚠️ Backend not available, using local fallback dashboard');
      // Return a mock dashboard for local gameplay
      return {
        success: true,
        pet: {
          level: 1,
          currentXp: 0,
          xpForNextLevel: 100,
          pendingRewards: 0,
          lastClaimTime: new Date().toISOString(),
        },
        energy: {
          currentEnergy: 100,
          maxEnergy: 100,
          lastUpdate: new Date().toISOString(),
        },
        ranking: {
          rank: 'Shrimp',
          position: 1000,
          lifetimePoints: 0,
          nextRankThreshold: 1000,
        },
        gameStats: {
          totalGamesPlayed: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          totalPointsEarned: 0,
        },
      };
    }

    const maxRetries = 3;

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
        console.error(`❌ [Attempt ${attempt}] Game dashboard API error:`, error);
        
        // Check if it's a "User not found" error - don't retry for this
        if (axios.isAxiosError(error) && error.response?.status === 400 && error.response?.data?.message === 'User not found') {
          console.log('⚠️ User not found in backend, using local fallback dashboard');
          return {
            success: true,
            pet: {
              level: 1,
              currentXp: 0,
              xpForNextLevel: 100,
              pendingRewards: 0,
              lastClaimTime: new Date().toISOString(),
            },
            energy: {
              currentEnergy: 100,
              maxEnergy: 100,
              lastUpdate: new Date().toISOString(),
            },
            ranking: {
              rank: 'Shrimp',
              position: 1000,
              lifetimePoints: 0,
              nextRankThreshold: 1000,
            },
            gameStats: {
              totalGamesPlayed: 0,
              totalScore: 0,
              averageScore: 0,
              bestScore: 0,
              totalPointsEarned: 0,
            },
          };
        }
        
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // 1s, 2s, 3s delays
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - return local fallback
    console.log('⚠️ All retries failed, using local fallback dashboard');
    return {
      success: true,
      pet: {
        level: 1,
        currentXp: 0,
        xpForNextLevel: 100,
        pendingRewards: 0,
        lastClaimTime: new Date().toISOString(),
      },
      energy: {
        currentEnergy: 100,
        maxEnergy: 100,
        lastUpdate: new Date().toISOString(),
      },
      ranking: {
        rank: 'Shrimp',
        position: 1000,
        lifetimePoints: 0,
        nextRankThreshold: 1000,
      },
      gameStats: {
        totalGamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        totalPointsEarned: 0,
      },
    };
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
