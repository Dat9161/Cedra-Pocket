/**
 * Backend API Service
 * Connects to NestJS backend for real data
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

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
  type: 'SOCIAL' | 'GAME';
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
    if (typeof window !== 'undefined') {
      return Boolean((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) || Boolean(this.token);
    }
    return Boolean(this.token);
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
   * Authenticate with Telegram initData
   */
  async authenticate(initData: string): Promise<AuthResponse> {
    try {
      // Use /auth/verify endpoint as documented
      const response = await this.client.post<AuthResponse>('/auth/verify', {
        initData: initData || 'test', // Ensure we always send something
      });

      // Save token
      this.setToken(response.data.access_token);

      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to authenticate via backend, using local fallback');
      console.error('Backend auth error:', error);
      
      // Return mock auth response for local gameplay
      const mockUser: BackendUser = {
        id: 'local_user',
        telegram_id: '123456789',
        username: 'Local User',
        wallet_address: null,
        is_wallet_connected: false,
        total_points: 0,
        current_rank: 'BRONZE',
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
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new BackendAPIError(
        'Backend not available',
        500,
        'HEALTH_CHECK_FAILED'
      );
    }
  }

  /**
   * Add points to user (sync with backend)
   */
  async addPoints(points: number): Promise<BackendUser> {
    try {
      // Get current user ID from various sources
      const userId = this.getCurrentUserId();
      
      // Use the main add-points endpoint with userId in body
      const response = await this.client.post<BackendUser>('/users/add-points', {
        points,
        userId, // Include userId in request body
      });
      console.log(`✅ Backend add-points response: ${response.data.total_points}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to add points to backend, using local fallback');
      
      // Return a mock user response with the new total for local gameplay
      return {
        id: 'local_user',
        telegram_id: this.getCurrentUserId(),
        username: 'Local User',
        wallet_address: null,
        is_wallet_connected: false,
        total_points: points, // Just return the points added
        current_rank: 'BRONZE',
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
    try {
      const userId = this.getCurrentUserId();
      const response = await this.client.get<BackendQuest[]>(`/quests/user/${userId}`);
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to get quests from backend, using local fallback');
      // Return mock quests for local gameplay
      return [
        {
          id: 1,
          title: 'Follow on Twitter',
          description: 'Follow our official Twitter account @CedraQuest',
          type: 'SOCIAL',
          category: 'social',
          config: { url: 'https://twitter.com/intent/follow?screen_name=CedraQuest' },
          reward_amount: 100,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 2,
          title: 'Join Telegram Channel',
          description: 'Join our official Telegram channel for updates',
          type: 'SOCIAL',
          category: 'social',
          config: { url: 'https://t.me/cedra_quest_official' },
          reward_amount: 150,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 3,
          title: 'Like & Retweet',
          description: 'Like and retweet our pinned post',
          type: 'SOCIAL',
          category: 'social',
          config: { url: 'https://twitter.com/CedraQuest/status/1234567890' },
          reward_amount: 75,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 4,
          title: 'Daily Check-in',
          description: 'Check in daily to earn rewards',
          type: 'GAME',
          category: 'daily',
          config: {},
          reward_amount: 50,
          reward_type: 'POINT',
          frequency: 'DAILY',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 5,
          title: 'Complete First Game',
          description: 'Play and complete your first game session',
          type: 'GAME',
          category: 'achievement',
          config: {},
          reward_amount: 200,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 6,
          title: 'Hatch Your Pet Egg',
          description: 'Enter your birth year and hatch your first pet egg to start your journey',
          type: 'GAME',
          category: 'pet',
          config: { requiresBirthYear: true },
          reward_amount: 300,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 7,
          title: 'Follow on Twitter',
          description: 'Follow our official Twitter account @CedraQuest',
          type: 'SOCIAL',
          category: 'pet_task',
          config: { url: 'https://twitter.com/intent/follow?screen_name=CedraQuest' },
          reward_amount: 0,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 8,
          title: 'Join Telegram Group',
          description: 'Join our official Telegram channel for updates',
          type: 'SOCIAL',
          category: 'pet_task',
          config: { url: 'https://t.me/cedra_quest_official' },
          reward_amount: 0,
          reward_type: 'POINT',
          frequency: 'ONCE',
          is_active: true,
          user_status: 'NOT_STARTED',
        },
        {
          id: 9,
          title: 'Invite 1 Friend',
          description: 'Invite your first friend to join the game',
          type: 'GAME',
          category: 'pet_task',
          config: {},
          reward_amount: 0,
          reward_type: 'POINT',
          frequency: 'ONCE',
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
    try {
      const userId = this.getCurrentUserId();
      const response = await this.client.post(`/quests/${questId}/verify`, {
        proof_data: proofData || {},
        userId: userId, // Include userId in request body
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to verify quest via backend, using local fallback');
      
      // Special handling for pet hatching quest (ID 6)
      if (questId === 6 && proofData?.birthYear) {
        const birthYear = Number(proofData.birthYear);
        const currentYear = new Date().getFullYear();
        
        if (isNaN(birthYear) || birthYear < 1900 || birthYear > currentYear - 5) {
          return {
            success: false,
            message: 'Please enter a valid birth year',
          };
        }
        
        // Store birth year and hatched status locally for demo
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_birth_year', String(birthYear));
          localStorage.setItem('pet_hatched', 'true');
        }
        
        return {
          success: true,
          message: 'Pet egg hatched successfully! Your pet is now ready to grow.',
        };
      }
      
      // Return mock success for other quests
      return {
        success: true,
        message: 'Quest completed successfully (offline mode)',
      };
    }
  }

  /**
   * Claim quest reward
   */
  async claimQuestReward(questId: number): Promise<{ success: boolean; message: string; pointsEarned?: number }> {
    try {
      const userId = this.getCurrentUserId();
      const response = await this.client.post(`/quests/${questId}/claim`, {
        userId: userId, // Include userId in request body
      });
      return response.data;
    } catch (error) {
      console.log('⚠️ Failed to claim quest reward via backend, using local fallback');
      // Return mock success for local gameplay
      return {
        success: true,
        message: 'Quest reward claimed successfully (offline mode)',
        pointsEarned: 0,
      };
    }
  }

  /**
   * Get complete game dashboard with retry logic
   */
  async getGameDashboard(telegramId?: string): Promise<any> {
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

      console.log(`🎮 Loading game dashboard for user: ${userId}`);
      
      // Call the new backend dashboard endpoint
      const response = await this.client.get(`/game/dashboard/${userId}`);
      
      console.log('📊 Raw dashboard response:', response.data);
      
      // Check if response has data
      if (response.data && typeof response.data === 'object') {
        // If response has success flag and it's true
        if (response.data.success === true) {
          console.log('✅ Game dashboard loaded successfully with success flag');
          return response.data;
        }
        // If response has data but no success flag, assume it's valid data
        else if (response.data.pet || response.data.energy || response.data.ranking || response.data.gameStats) {
          console.log('✅ Game dashboard loaded successfully (no success flag but has data)');
          return {
            ...response.data,
            success: true, // Add success flag
          };
        }
        // If response is empty object or has error
        else {
          console.warn('⚠️ Dashboard response is empty or invalid:', response.data);
          throw new Error('Dashboard response is empty or invalid');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Failed to load game dashboard:', error);
      
      // Return fallback data structure matching the new backend
      return {
        pet: {
          level: 1,
          currentXp: 0,
          xpForNextLevel: 100,
          lastClaimTime: new Date(),
          pendingRewards: 0,
          canLevelUp: false,
          dailyFeedSpent: 0,
          dailyFeedLimit: 1000,
          feedCost: 50,
        },
        energy: {
          currentEnergy: 10,
          maxEnergy: 10,
          lastUpdate: new Date(),
          regenerationRate: 1,
          nextRegenTime: null,
        },
        ranking: {
          rank: 'BRONZE',
          position: 999,
          totalUsers: 1000,
          pointsToNextRank: 1000,
        },
        gameStats: {
          totalGamesPlayed: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          totalPointsEarned: 0,
        },
        success: false,
        error: 'Using offline mode - backend not available',
      };
    }
  }

  /**
   * Get pet status
   */
  async getPetStatus(telegramId?: string): Promise<any> {
    try {
      let userId = telegramId || this.getCurrentUserId();
      
      console.log(`🐾 Getting pet status for user: ${userId}`);
      const response = await this.client.get(`/game/pet/status/${userId}`);
      
      console.log('✅ Pet status loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get pet status:', error);
      
      // Return fallback pet data
      return {
        level: 1,
        currentXp: 0,
        xpForNextLevel: 100,
        lastClaimTime: new Date(),
        pendingRewards: 0,
        canLevelUp: false,
        dailyFeedSpent: 0,
        dailyFeedLimit: 1000,
        feedCost: 50,
      };
    }
  }

  /**
   * Claim pet rewards
   */
  async claimPetRewards(telegramId?: string): Promise<any> {
    try {
      let userId = telegramId || this.getCurrentUserId();
      
      console.log(`💰 Claiming pet rewards for user: ${userId}`);
      const response = await this.client.post(`/game/pet/claim/${userId}`);
      
      console.log('✅ Pet rewards claimed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to claim pet rewards:', error);
      
      return {
        success: false,
        pointsEarned: 0,
        newTotalPoints: 0,
        newLifetimePoints: 0,
        claimTime: new Date(),
        error: 'Failed to claim rewards (offline mode)',
      };
    }
  }

  /**
   * Feed pet
   */
  async feedPet(feedCount: number, telegramId?: string): Promise<any> {
    try {
      let userId = telegramId || this.getCurrentUserId();
      
      console.log(`🍖 Feeding pet for user: ${userId}, count: ${feedCount}`);
      const response = await this.client.post(`/game/pet/feed/${userId}`, {
        feedCount: feedCount,
      });
      
      console.log('✅ Pet fed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to feed pet:', error);
      
      return {
        success: false,
        pointsSpent: 0,
        xpGained: 0,
        newXp: 0,
        canLevelUp: false,
        dailySpentTotal: 0,
        error: 'Failed to feed pet (offline mode)',
      };
    }
  }

  /**
   * Get energy status
   */
  async getEnergyStatus(telegramId?: string): Promise<any> {
    try {
      let userId = telegramId || this.getCurrentUserId();
      
      console.log(`⚡ Getting energy status for user: ${userId}`);
      const response = await this.client.get(`/game/energy/status/${userId}`);
      
      console.log('✅ Energy status loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get energy status:', error);
      
      return {
        currentEnergy: 10,
        maxEnergy: 10,
        lastUpdate: new Date(),
        regenerationRate: 1,
        nextRegenTime: null,
      };
    }
  }

  /**
   * Complete game session
   */
  async completeGameSession(gameType: string, score: number, pointsEarned: number, telegramId?: string): Promise<any> {
    try {
      let userId = telegramId || this.getCurrentUserId();
      
      console.log(`🎮 Completing game session for user: ${userId}, type: ${gameType}, score: ${score}`);
      const response = await this.client.post(`/game/session/complete/${userId}`, {
        gameType: gameType,
        score: score,
        pointsEarned: pointsEarned,
        energyUsed: 1,
        duration: 60, // Default duration in seconds
      });
      
      console.log('✅ Game session completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to complete game session:', error);
      
      return {
        success: false,
        pointsEarned: 0,
        newTotalPoints: 0,
        energyUsed: 1,
        error: 'Failed to save game session (offline mode)',
      };
    }
  }

  /**
   * Get current user ID from various sources
   */
  private getCurrentUserId(): string {
    // Try to get from Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return String((window as any).Telegram.WebApp.initDataUnsafe.user.id);
    }
    
    // Try to get from stored user data
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('tg-mini-app-storage');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.state?.user?.telegramId) {
            return parsed.state.user.telegramId;
          }
        } catch (e) {
          console.warn('Failed to parse stored user data');
        }
      }
    }
    
    // Fallback to test ID
    console.warn('Using fallback test user ID');
    return '123456789';
  }
}

// Singleton instance
export const backendAPI = new BackendAPIService();