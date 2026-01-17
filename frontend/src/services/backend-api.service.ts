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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cedra-quest-backend.onrender.com';

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
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
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
   * Get quests without auth (for testing)
   */
  async getTestQuests(): Promise<{ quests: BackendQuest[]; count: number }> {
    try {
      const response = await this.client.get('/test/quests');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BackendAPIError(
          error.response?.data?.message || 'Failed to get test quests',
          error.response?.status || 500,
          'TEST_QUESTS_FAILED'
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
