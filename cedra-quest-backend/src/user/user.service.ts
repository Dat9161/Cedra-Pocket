import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserInfo } from '../common/interfaces/auth.interface';
import { RankingService } from '../game/services/ranking.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private rankingService: RankingService,
  ) {}

  /**
   * Safely convert userId to BigInt, handling both numeric and non-numeric strings
   */
  private safeToBigInt(userId: string): bigint {
    // If userId starts with 'anon_' or contains non-numeric characters, 
    // convert to a hash-based BigInt
    if (!/^\d+$/.test(userId)) {
      // Create a simple hash from the string
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      // Ensure positive BigInt and avoid conflicts with real telegram IDs
      return BigInt(Math.abs(hash) + 1000000000); // Add offset to avoid conflicts
    }
    
    try {
      return BigInt(userId);
    } catch (error) {
      this.logger.error(`Failed to convert userId to BigInt: ${userId}`, error);
      // Fallback to a default test user ID
      return BigInt('123456789');
    }
  }

  /**
   * Create new user with proper wallet
   * @param userData User data to create
   * @returns Created user info
   */
  async createUser(userData: {
    telegram_id: string;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    total_points?: number;
    current_rank?: string;
    wallet_address?: string;
    public_key?: string;
  }): Promise<UserInfo> {
    try {
      this.logger.log(`🆕 Creating new user: telegram_id=${userData.telegram_id}, username=${userData.username}`);
      
      // Generate wallet if not provided
      let walletAddress = userData.wallet_address;
      let publicKey = userData.public_key;
      let isWalletConnected = false;

      if (!walletAddress) {
        // Generate proper wallet name based on user info
        const baseName = userData.username || userData.first_name || `user${userData.telegram_id}`;
        const cleanName = this.cleanWalletName(baseName);
        walletAddress = `${cleanName}.hot.tg`;
        publicKey = `pk_${userData.telegram_id}_${Date.now()}`;
        isWalletConnected = true;
        this.logger.log(`🔑 Generated wallet: ${walletAddress}`);
      }

      // Create display name
      const displayName = userData.username || 
                         (userData.first_name && userData.last_name ? 
                          `${userData.first_name} ${userData.last_name}` : 
                          userData.first_name) || 
                         `User${userData.telegram_id}`;
      
      const user = await this.prisma.users.create({
        data: {
          telegram_id: this.safeToBigInt(userData.telegram_id),
          wallet_address: walletAddress,
          public_key: publicKey,
          username: displayName,
          username_at_creation: userData.username || null,
          total_points: userData.total_points || 0,
          lifetime_points: userData.total_points || 0,
          current_rank: 'RANK1',
          level: 1,
          current_xp: 0,
          is_wallet_connected: isWalletConnected,
          created_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          telegram_id: true,
          wallet_address: true,
          username: true,
          username_at_creation: true,
          total_points: true,
          lifetime_points: true,
          level: true,
          current_xp: true,
          current_rank: true,
          is_wallet_connected: true,
          created_at: true,
        },
      });

      this.logger.log(`✅ User created successfully: ${user.telegram_id.toString()} with wallet ${user.wallet_address}`);

      return {
        telegram_id: user.telegram_id.toString(),
        wallet_address: user.wallet_address,
        username: user.username,
        total_points: Number(user.total_points),
        level: user.level,
        current_xp: user.current_xp,
        current_rank: user.current_rank,
        created_at: user.created_at,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to create user: ${userData.telegram_id}`, error);
      throw error;
    }
  }

  /**
   * Clean wallet name for proper format
   */
  private cleanWalletName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 15) || 'user';
  }

  /**
   * Find existing user by Telegram ID
   * @param telegramId Telegram user ID
   * @returns User record or null if not found
   */
  async findUserByTelegramId(telegramId: string): Promise<UserInfo | null> {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          telegram_id: this.safeToBigInt(telegramId),
        },
        select: {
          telegram_id: true,
          wallet_address: true,
          username: true,
          total_points: true,
          level: true,
          current_xp: true,
          current_rank: true,
          created_at: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        telegram_id: user.telegram_id.toString(),
        wallet_address: user.wallet_address,
        username: user.username,
        total_points: Number(user.total_points),
        level: user.level,
        current_xp: user.current_xp,
        current_rank: user.current_rank,
        created_at: user.created_at,
      };
    } catch (error) {
      this.logger.error(`Failed to find user by Telegram ID: ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Get complete user profile with additional game data
   * @param telegramId Telegram user ID
   * @returns Complete user profile or null if not found
   */
  async getUserProfile(telegramId: string): Promise<UserInfo | null> {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          telegram_id: this.safeToBigInt(telegramId),
        },
        include: {
          pet: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        telegram_id: user.telegram_id.toString(),
        wallet_address: user.wallet_address,
        username: user.username,
        total_points: Number(user.total_points),
        level: user.level,
        current_xp: user.current_xp,
        current_rank: user.current_rank,
        created_at: user.created_at,
      };
    } catch (error) {
      this.logger.error(`Failed to get user profile: ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Check if wallet address exists in database
   * @param walletAddress Wallet address to check
   * @returns True if exists, false otherwise
   */
  async checkWalletAddressExists(walletAddress: string): Promise<boolean> {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          wallet_address: walletAddress,
        },
        select: {
          telegram_id: true,
        },
      });

      return !!user;
    } catch (error) {
      this.logger.error(`Failed to check wallet address: ${walletAddress}`, error);
      throw error;
    }
  }

  /**
   * Add points to user with rank reward system
   * @param telegramId Telegram user ID
   * @param points Points to add (can be negative for deduction)
   * @returns Updated user info with rank reward info
   */
  async addPoints(telegramId: string, points: number): Promise<UserInfo & { 
    rankReward?: { 
      rankUp: boolean; 
      newRank?: string; 
      coinsAwarded?: number; 
    } 
  }> {
    try {
      this.logger.log(`💰 Adding ${points} points to user: ${telegramId}`);
      
      // First, try to find existing user
      let user = await this.prisma.users.findUnique({
        where: {
          telegram_id: this.safeToBigInt(telegramId),
        },
      });

      if (!user) {
        // Create user if not exists
        this.logger.log(`🆕 User not found, creating new user: ${telegramId}`);
        const newUser = await this.createUser({
          telegram_id: telegramId,
          username: `user_${telegramId}`,
          total_points: Math.max(0, points), // Don't allow negative starting balance
        });
        
        return newUser;
      }

      // Store old points for rank comparison
      const oldLifetimePoints = Number(user.lifetime_points || 0);
      
      // Calculate new points
      const newTotalPoints = Math.max(0, Number(user.total_points) + points);
      const newLifetimePoints = Math.max(oldLifetimePoints, newTotalPoints);
      
      // Update user points with transaction
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        // Update user points
        const user = await tx.users.update({
          where: {
            telegram_id: this.safeToBigInt(telegramId),
          },
          data: {
            total_points: newTotalPoints,
            lifetime_points: newLifetimePoints,
            updated_at: new Date(),
          },
          select: {
            telegram_id: true,
            wallet_address: true,
            username: true,
            total_points: true,
            lifetime_points: true,
            level: true,
            current_xp: true,
            current_rank: true,
            created_at: true,
            updated_at: true,
          },
        });

        // Create transaction log
        if (points !== 0) {
          await tx.point_transactions.create({
            data: {
              user_id: this.safeToBigInt(telegramId),
              amount: points,
              type: 'ADMIN_ADJUSTMENT',
              description: `Points ${points > 0 ? 'added' : 'deducted'}: ${Math.abs(points)} points`,
              reference_id: `manual_${Date.now()}`,
            },
          });
        }

        return user;
      });

      // Check for rank rewards (only if points increased)
      let rankReward = { rankUp: false };
      if (points > 0 && newLifetimePoints > oldLifetimePoints) {
        try {
          rankReward = await this.rankingService.checkAndAwardRankRewards(
            telegramId, 
            oldLifetimePoints, 
            newLifetimePoints
          );
          
          if (rankReward.rankUp && 'coinsAwarded' in rankReward) {
            this.logger.log(`🎉 User ${telegramId} ranked up! Awarded ${rankReward.coinsAwarded} coins`);
          }
        } catch (rankError) {
          this.logger.error(`Failed to check rank rewards for user ${telegramId}`, rankError);
          // Don't fail the main operation if rank check fails
        }
      }

      this.logger.log(`✅ Points updated: ${user.total_points} → ${updatedUser.total_points}`);

      return {
        telegram_id: updatedUser.telegram_id.toString(),
        wallet_address: updatedUser.wallet_address,
        username: updatedUser.username,
        total_points: Number(updatedUser.total_points),
        level: updatedUser.level,
        current_xp: updatedUser.current_xp,
        current_rank: updatedUser.current_rank,
        created_at: updatedUser.created_at,
        rankReward,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to add points to user: ${telegramId}`, error);
      throw error;
    }
  }

  /**
   * Find user by public key
   * @param publicKey Public key to search for
   * @returns User info or null if not found
   */
  async findUserByPublicKey(publicKey: string): Promise<UserInfo | null> {
    try {
      const user = await this.prisma.users.findFirst({
        where: {
          public_key: publicKey,
        },
        select: {
          telegram_id: true,
          wallet_address: true,
          username: true,
          total_points: true,
          level: true,
          current_xp: true,
          current_rank: true,
          created_at: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        telegram_id: user.telegram_id.toString(),
        wallet_address: user.wallet_address,
        username: user.username,
        total_points: Number(user.total_points),
        level: user.level,
        current_xp: user.current_xp,
        current_rank: user.current_rank,
        created_at: user.created_at,
      };
    } catch (error) {
      this.logger.error(`Failed to find user by public key`, error);
      throw error;
    }
  }
}