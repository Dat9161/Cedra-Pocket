import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DailyQuestService {
  private readonly logger = new Logger(DailyQuestService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Reset daily quests at midnight (00:00) every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyQuests(): Promise<void> {
    try {
      this.logger.log('🌙 Starting daily quest reset at midnight...');

      // Get all daily quests
      const dailyQuests = await this.prisma.quests.findMany({
        where: {
          frequency: 'DAILY',
          is_active: true,
        },
      });

      if (dailyQuests.length === 0) {
        this.logger.log('No daily quests found to reset');
        return;
      }

      // Reset all user_quests for daily quests that were claimed yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      for (const quest of dailyQuests) {
        // Delete user_quests records for this daily quest that were claimed yesterday
        const deletedCount = await this.prisma.user_quests.deleteMany({
          where: {
            quest_id: quest.id,
            status: 'CLAIMED',
            claimed_at: {
              gte: yesterday,
              lte: endOfYesterday,
            },
          },
        });

        this.logger.log(`Reset ${deletedCount.count} user records for daily quest: ${quest.title}`);
      }

      this.logger.log('✅ Daily quest reset completed successfully');
    } catch (error) {
      this.logger.error('❌ Failed to reset daily quests:', error);
    }
  }

  /**
   * Check if user can claim daily quest today
   */
  async canClaimDailyQuest(userId: string, questId: number): Promise<boolean> {
    try {
      const userIdBigInt = BigInt(userId);
      
      // Check if user has already claimed this daily quest today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingClaim = await this.prisma.user_quests.findFirst({
        where: {
          user_id: userIdBigInt,
          quest_id: questId,
          status: 'CLAIMED',
          claimed_at: {
            gte: today,
          },
        },
      });

      return !existingClaim; // Can claim if no existing claim today
    } catch (error) {
      this.logger.error(`Failed to check daily quest eligibility for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get daily quest status for user
   */
  async getDailyQuestStatus(userId: string, questId: number): Promise<'claimable' | 'completed'> {
    try {
      const canClaim = await this.canClaimDailyQuest(userId, questId);
      return canClaim ? 'claimable' : 'completed';
    } catch (error) {
      this.logger.error(`Failed to get daily quest status for user ${userId}:`, error);
      return 'claimable'; // Default to claimable on error
    }
  }

  /**
   * Manual reset for testing (admin only)
   */
  async manualResetDailyQuests(): Promise<{ success: boolean; message: string }> {
    try {
      await this.resetDailyQuests();
      return {
        success: true,
        message: 'Daily quests reset successfully',
      };
    } catch (error) {
      this.logger.error('Manual daily quest reset failed:', error);
      return {
        success: false,
        message: 'Failed to reset daily quests',
      };
    }
  }
}