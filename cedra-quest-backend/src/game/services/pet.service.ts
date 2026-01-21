import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PetStatus, FeedPetRequest, FeedPetResult, ClaimRewardsResult } from '../../common/interfaces/game.interface';
import { PET_CONSTANTS, TIME_CONSTANTS } from '../../common/constants/game.constants';
import { GameCycleService } from './game-cycle.service';
import { BlockchainService } from '../../blockchain/blockchain.service';

@Injectable()
export class PetService {
  private readonly logger = new Logger(PetService.name);

  constructor(
    private prisma: PrismaService,
    private gameCycleService: GameCycleService,
    private blockchainService: BlockchainService,
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
    return BigInt(userId);
  }

  /**
   * Get pet status for a user
   */
  async getPetStatus(userId: string): Promise<PetStatus> {
    try {
      let user = await this.prisma.users.findUnique({
        where: { telegram_id: this.safeToBigInt(userId) },
        select: {
          pet_level: true,
          pet_current_xp: true,
          pet_last_claim_time: true,
        },
      });

      if (!user) {
        // Create user with default pet data if not exists
        this.logger.log(`Creating new user with pet data for userId: ${userId}`);
        await this.prisma.users.create({
          data: {
            telegram_id: this.safeToBigInt(userId),
            username: `user_${userId}`,
            wallet_address: `temp_wallet_${userId}`,
            public_key: `temp_key_${userId}`,
            pet_level: 1,
            pet_current_xp: 0,
            pet_last_claim_time: new Date(),
          },
        });

        // Fetch the newly created user
        user = await this.prisma.users.findUnique({
          where: { telegram_id: this.safeToBigInt(userId) },
          select: {
            pet_level: true,
            pet_current_xp: true,
            pet_last_claim_time: true,
          },
        });

        if (!user) {
          throw new BadRequestException('Failed to create user');
        }
      }

      // Ensure pet data has default values
      const petLevel = user.pet_level || 1;
      const petCurrentXp = user.pet_current_xp || 0;
      const petLastClaimTime = user.pet_last_claim_time || new Date();

      // Get daily feeding spent
      const today = new Date().toISOString().split('T')[0];
      const feedingLog = await this.prisma.pet_feeding_logs.findUnique({
        where: {
          user_id_feed_date: {
            user_id: this.safeToBigInt(userId),
            feed_date: today,
          },
        },
      });

      const dailyFeedSpent = feedingLog?.total_daily_spent || 0;

      // Calculate pending rewards
      const pendingRewards = await this.calculatePendingRewards(
        petLevel,
        petLastClaimTime,
      );

      // Check if can level up
      const canLevelUp = petCurrentXp >= PET_CONSTANTS.XP_FOR_LEVEL_UP && 
                        petLevel < PET_CONSTANTS.MAX_LEVEL;

      return {
        level: petLevel,
        currentXp: petCurrentXp,
        xpForNextLevel: PET_CONSTANTS.XP_FOR_LEVEL_UP,
        lastClaimTime: petLastClaimTime,
        pendingRewards,
        canLevelUp,
        dailyFeedSpent,
        dailyFeedLimit: PET_CONSTANTS.MAX_DAILY_SPEND,
        feedCost: PET_CONSTANTS.FEED_COST,
      };
    } catch (error) {
      this.logger.error(`Failed to get pet status for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Feed pet to gain XP
   */
  async feedPet(userId: string, request: FeedPetRequest): Promise<FeedPetResult> {
    try {
      const { feedCount } = request;

      if (feedCount <= 0 || feedCount > 30) {
        throw new BadRequestException('Invalid feed count (1-30)');
      }

      const totalCost = feedCount * PET_CONSTANTS.FEED_COST;
      const totalXp = feedCount * PET_CONSTANTS.XP_PER_FEED;

      return await this.prisma.$transaction(async (tx) => {
        // Get user data
        const user = await tx.users.findUnique({
          where: { telegram_id: this.safeToBigInt(userId) },
          select: {
            total_points: true,
            pet_level: true,
            pet_current_xp: true,
          },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        // Check if user has enough points
        if (Number(user.total_points) < totalCost) {
          return {
            success: false,
            pointsSpent: 0,
            xpGained: 0,
            newXp: user.pet_current_xp,
            canLevelUp: false,
            dailySpentTotal: 0,
            error: 'Insufficient points',
          };
        }

        // Check daily feeding limit
        const today = new Date().toISOString().split('T')[0];
        const feedingLog = await tx.pet_feeding_logs.findUnique({
          where: {
            user_id_feed_date: {
              user_id: this.safeToBigInt(userId),
              feed_date: today,
            },
          },
        });

        const currentDailySpent = feedingLog?.total_daily_spent || 0;
        const newDailySpent = currentDailySpent + totalCost;

        if (newDailySpent > PET_CONSTANTS.MAX_DAILY_SPEND) {
          return {
            success: false,
            pointsSpent: 0,
            xpGained: 0,
            newXp: user.pet_current_xp,
            canLevelUp: false,
            dailySpentTotal: currentDailySpent,
            error: `Daily feeding limit exceeded (${PET_CONSTANTS.MAX_DAILY_SPEND} points/day)`,
          };
        }

        // Check if pet is at max level
        if (user.pet_level >= PET_CONSTANTS.MAX_LEVEL) {
          return {
            success: false,
            pointsSpent: 0,
            xpGained: 0,
            newXp: user.pet_current_xp,
            canLevelUp: false,
            dailySpentTotal: currentDailySpent,
            error: 'Pet is at maximum level',
          };
        }

        // Update user points and pet XP
        const newXp = user.pet_current_xp + totalXp;
        const newLevel = newXp >= PET_CONSTANTS.XP_FOR_LEVEL_UP && user.pet_level < PET_CONSTANTS.MAX_LEVEL
          ? user.pet_level + 1
          : user.pet_level;
        const finalXp = newLevel > user.pet_level ? newXp - PET_CONSTANTS.XP_FOR_LEVEL_UP : newXp;

        await tx.users.update({
          where: { telegram_id: this.safeToBigInt(userId) },
          data: {
            total_points: { decrement: totalCost },
            pet_current_xp: finalXp,
            pet_level: newLevel,
            updated_at: new Date(),
          },
        });

        // Update feeding log
        await tx.pet_feeding_logs.upsert({
          where: {
            user_id_feed_date: {
              user_id: this.safeToBigInt(userId),
              feed_date: today,
            },
          },
          update: {
            points_spent: { increment: totalCost },
            xp_gained: { increment: totalXp },
            total_daily_spent: newDailySpent,
          },
          create: {
            user_id: this.safeToBigInt(userId),
            points_spent: totalCost,
            xp_gained: totalXp,
            feed_date: today,
            total_daily_spent: newDailySpent,
          },
        });

        const canLevelUp = finalXp >= PET_CONSTANTS.XP_FOR_LEVEL_UP && newLevel < PET_CONSTANTS.MAX_LEVEL;

        this.logger.log(`User ${userId} fed pet ${feedCount} times, gained ${totalXp} XP`);

        return {
          success: true,
          pointsSpent: totalCost,
          xpGained: totalXp,
          newXp: finalXp,
          newLevel: newLevel > user.pet_level ? newLevel : undefined,
          canLevelUp,
          dailySpentTotal: newDailySpent,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to feed pet for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Claim mining rewards with blockchain integration
   */
  async claimRewards(userId: string): Promise<ClaimRewardsResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.users.findUnique({
          where: { telegram_id: this.safeToBigInt(userId) },
          select: {
            total_points: true,
            lifetime_points: true,
            pet_level: true,
            pet_last_claim_time: true,
            wallet_address: true,
          },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        // Calculate rewards
        const rewards = await this.calculatePendingRewards(
          user.pet_level,
          user.pet_last_claim_time,
        );

        if (rewards <= 0) {
          return {
            success: false,
            pointsEarned: 0,
            newTotalPoints: Number(user.total_points),
            newLifetimePoints: Number(user.lifetime_points),
            claimTime: new Date(),
            error: 'No rewards to claim',
          };
        }

        // Update user points
        const newTotalPoints = Number(user.total_points) + rewards;
        const newLifetimePoints = Number(user.lifetime_points) + rewards;

        await tx.users.update({
          where: { telegram_id: this.safeToBigInt(userId) },
          data: {
            total_points: newTotalPoints,
            lifetime_points: newLifetimePoints,
            pet_last_claim_time: new Date(),
            updated_at: new Date(),
          },
        });

        // Optional: Record on blockchain for transparency (large rewards only)
        const MIN_BLOCKCHAIN_CLAIM = 1000; // Only record claims >= 1000 points on blockchain
        
        if (user.wallet_address && rewards >= MIN_BLOCKCHAIN_CLAIM) {
          try {
            // Generate signature for blockchain claim
            const nonce = Date.now();
            const signature = await this.generateClaimSignature(user.wallet_address, rewards, nonce);
            
            // Submit to blockchain (this is optional and can fail without affecting the game)
            await this.blockchainService.claimReward(
              user.wallet_address,
              process.env.CEDRA_ADMIN_ADDRESS || '',
              rewards,
              nonce,
              signature
            );
            
            this.logger.log(`Blockchain claim recorded for user ${userId}: ${rewards} points`);
          } catch (blockchainError) {
            // Log but don't fail the game operation
            this.logger.warn(`Blockchain claim failed for user ${userId}:`, blockchainError.message);
          }
        }

        this.logger.log(`User ${userId} claimed ${rewards} points from pet mining`);

        return {
          success: true,
          pointsEarned: rewards,
          newTotalPoints,
          newLifetimePoints,
          claimTime: new Date(),
        };
      });
    } catch (error) {
      this.logger.error(`Failed to claim rewards for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Calculate pending mining rewards
   */
  private async calculatePendingRewards(petLevel: number, lastClaimTime: Date): Promise<number> {
    try {
      const now = new Date();
      const elapsedMs = now.getTime() - lastClaimTime.getTime();
      
      // Cap at maximum claim hours
      const maxClaimMs = PET_CONSTANTS.MAX_CLAIM_HOURS * TIME_CONSTANTS.HOUR_IN_MS;
      const effectiveMs = Math.min(elapsedMs, maxClaimMs);

      if (effectiveMs <= 0) {
        return 0;
      }

      // Get current game cycle
      const cycle = await this.gameCycleService.getCurrentCycle();
      
      // Calculate points per hour based on pet level and cycle growth rate
      const pointsPerHour = petLevel * Number(cycle.growthRate);
      
      // Calculate total rewards
      const hoursElapsed = effectiveMs / TIME_CONSTANTS.HOUR_IN_MS;
      const rewards = Math.floor(hoursElapsed * pointsPerHour);

      return Math.max(0, rewards);
    } catch (error) {
      this.logger.error('Failed to calculate pending rewards', error);
      return 0;
    }
  }

  /**
   * Generate signature for blockchain claim (placeholder implementation)
   * In production, this should use proper cryptographic signing with server's private key
   */
  private async generateClaimSignature(userAddress: string, amount: number, nonce: number): Promise<string> {
    // This is a placeholder - in production, you would use proper cryptographic signing
    // The signature should be generated using the server's private key
    const message = `${userAddress}:${amount}:${nonce}`;
    const hash = Buffer.from(message).toString('hex');
    return `0x${hash.padEnd(128, '0')}`; // Mock signature
  }
}