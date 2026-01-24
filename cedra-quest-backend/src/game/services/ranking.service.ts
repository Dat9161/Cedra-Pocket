import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RankInfo } from '../../common/interfaces/game.interface';
import { RANK_THRESHOLDS, RANK_ORDER, RANK_REWARDS } from '../../common/constants/game.constants';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(private prisma: PrismaService) {}

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
   * Check and award rank up rewards when user's points increase
   */
  async checkAndAwardRankRewards(userId: string, oldPoints: number, newPoints: number): Promise<{
    rankUp: boolean;
    newRank?: string;
    coinsAwarded?: number;
  }> {
    try {
      const oldRank = this.calculateRank(oldPoints);
      const newRank = this.calculateRank(newPoints);
      
      if (oldRank !== newRank) {
        const coinsAwarded = RANK_REWARDS[newRank as keyof typeof RANK_REWARDS];
        
        this.logger.log(`🎉 User ${userId} ranked up from ${oldRank} to ${newRank}! Awarding ${coinsAwarded} coins`);
        
        // Award coins and update rank in transaction
        await this.prisma.$transaction(async (tx) => {
          // Update user's rank and add coins
          await tx.users.update({
            where: { telegram_id: this.safeToBigInt(userId) },
            data: {
              current_rank: newRank as any,
              total_points: { increment: coinsAwarded },
              lifetime_points: { increment: coinsAwarded },
              updated_at: new Date(),
            },
          });

          // Create transaction log for rank reward
          await tx.point_transactions.create({
            data: {
              user_id: this.safeToBigInt(userId),
              amount: coinsAwarded,
              type: 'RANK_REWARD',
              description: `Rank up reward: ${oldRank} → ${newRank}`,
              reference_id: `rank_${newRank}_${Date.now()}`,
            },
          });
        });

        return {
          rankUp: true,
          newRank,
          coinsAwarded,
        };
      }

      return { rankUp: false };
    } catch (error) {
      this.logger.error(`Failed to check rank rewards for user ${userId}`, error);
      return { rankUp: false };
    }
  }

  /**
   * Get user's rank information
   */
  async getUserRankInfo(userId: string): Promise<RankInfo> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { telegram_id: this.safeToBigInt(userId) },
        select: {
          lifetime_points: true,
          current_rank: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const lifetimePoints = Number(user.lifetime_points);
      const currentRank = this.calculateRank(lifetimePoints);

      // Update rank if it changed (but don't award coins here - only when points increase)
      if (currentRank !== user.current_rank) {
        await this.prisma.users.update({
          where: { telegram_id: this.safeToBigInt(userId) },
          data: { current_rank: currentRank as any },
        });
      }

      // Calculate next rank info
      const currentRankIndex = RANK_ORDER.indexOf(currentRank as any);
      const nextRank = currentRankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIndex + 1] : null;
      const nextRankThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : lifetimePoints;
      const pointsToNextRank = nextRank ? Math.max(0, nextRankThreshold - lifetimePoints) : 0;

      // Calculate progress percentage
      const currentRankThreshold = RANK_THRESHOLDS[currentRank as keyof typeof RANK_THRESHOLDS];
      const rankProgress = nextRank 
        ? Math.min(100, ((lifetimePoints - currentRankThreshold) / (nextRankThreshold - currentRankThreshold)) * 100)
        : 100;

      return {
        currentRank,
        lifetimePoints,
        nextRankThreshold,
        pointsToNextRank,
        rankProgress: Math.round(rankProgress),
      };
    } catch (error) {
      this.logger.error(`Failed to get rank info for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100, offset: number = 0): Promise<{
    users: Array<{
      telegram_id: string;
      username: string | null;
      lifetime_points: number;
      current_rank: string;
      position: number;
    }>;
    total: number;
  }> {
    try {
      const [users, total] = await Promise.all([
        this.prisma.users.findMany({
          select: {
            telegram_id: true,
            username: true,
            lifetime_points: true,
            current_rank: true,
          },
          orderBy: { lifetime_points: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.users.count(),
      ]);

      const leaderboard = users.map((user, index) => ({
        telegram_id: user.telegram_id.toString(),
        username: user.username,
        lifetime_points: Number(user.lifetime_points),
        current_rank: user.current_rank,
        position: offset + index + 1,
      }));

      return {
        users: leaderboard,
        total,
      };
    } catch (error) {
      this.logger.error('Failed to get leaderboard', error);
      // Return empty result instead of throwing
      return {
        users: [],
        total: 0,
      };
    }
  }

  /**
   * Get user's position in leaderboard
   */
  async getUserPosition(userId: string): Promise<number> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { telegram_id: this.safeToBigInt(userId) },
        select: { lifetime_points: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const position = await this.prisma.users.count({
        where: {
          lifetime_points: { gt: user.lifetime_points },
        },
      });

      return position + 1;
    } catch (error) {
      this.logger.error(`Failed to get position for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get rank statistics
   */
  async getRankStatistics(): Promise<Record<string, number>> {
    try {
      const stats = await this.prisma.users.groupBy({
        by: ['current_rank'],
        _count: { current_rank: true },
      });

      const rankStats: Record<string, number> = {};
      
      // Initialize all ranks with 0
      RANK_ORDER.forEach(rank => {
        rankStats[rank] = 0;
      });

      // Fill in actual counts
      stats.forEach(stat => {
        if (stat.current_rank && RANK_ORDER.includes(stat.current_rank as any)) {
          rankStats[stat.current_rank] = stat._count.current_rank;
        }
      });

      return rankStats;
    } catch (error) {
      this.logger.error('Failed to get rank statistics', error);
      // Return default stats instead of throwing
      const defaultStats: Record<string, number> = {};
      RANK_ORDER.forEach(rank => {
        defaultStats[rank] = 0;
      });
      return defaultStats;
    }
  }

  /**
   * Calculate rank based on lifetime points
   */
  private calculateRank(lifetimePoints: number): string {
    for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
      const rank = RANK_ORDER[i];
      if (lifetimePoints >= RANK_THRESHOLDS[rank]) {
        return rank;
      }
    }
    return 'RANK1';
  }
}