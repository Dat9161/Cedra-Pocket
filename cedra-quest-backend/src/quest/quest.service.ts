import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QuestWithUserStatus {
  id: number;
  title: string;
  description: string | null;
  type: 'SOCIAL' | 'GAME';
  category: string | null;
  config: any;
  reward_amount: number | null;
  reward_type: 'POINT' | 'XP' | 'SPIN' | 'TOKEN';
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY';
  is_active: boolean | null;
  user_status?: 'NOT_STARTED' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CLAIMED';
  user_completed_at?: string;
  user_claimed_at?: string;
}

@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all active quests for a user
   */
  async getQuestsForUser(userId: string): Promise<QuestWithUserStatus[]> {
    try {
      const userIdBigInt = BigInt(userId);

      // Get all active quests with user progress
      const quests = await this.prisma.quests.findMany({
        where: {
          is_active: true,
        },
        include: {
          user_quests: {
            where: {
              user_id: userIdBigInt,
            },
          },
        },
        orderBy: [
          { type: 'asc' },
          { id: 'asc' },
        ],
      });

      // Transform to include user status
      return quests.map((quest) => {
        const userQuest = quest.user_quests[0];
        
        return {
          id: quest.id,
          title: quest.title,
          description: quest.description,
          type: quest.type,
          category: quest.category,
          config: quest.config,
          reward_amount: quest.reward_amount,
          reward_type: quest.reward_type || 'POINT',
          frequency: quest.frequency || 'ONCE',
          is_active: quest.is_active,
          user_status: userQuest ? this.mapPrismaStatusToAPI(userQuest.status) : 'NOT_STARTED',
          user_completed_at: userQuest?.completed_at?.toISOString(),
          user_claimed_at: userQuest?.claimed_at?.toISOString(),
        };
      });
    } catch (error) {
      this.logger.error('Failed to get quests for user:', error);
      throw new BadRequestException('Failed to get quests');
    }
  }

  /**
   * Verify/complete a quest for a user
   */
  async verifyQuest(userId: string, questId: number, proofData?: any): Promise<{ success: boolean; message: string }> {
    try {
      const userIdBigInt = BigInt(userId);

      // Check if quest exists and is active
      const quest = await this.prisma.quests.findFirst({
        where: {
          id: questId,
          is_active: true,
        },
      });

      if (!quest) {
        throw new NotFoundException('Quest not found or inactive');
      }

      // Check if user already has this quest
      let userQuest = await this.prisma.user_quests.findUnique({
        where: {
          user_id_quest_id: {
            user_id: userIdBigInt,
            quest_id: questId,
          },
        },
      });

      // If user quest doesn't exist, create it
      if (!userQuest) {
        userQuest = await this.prisma.user_quests.create({
          data: {
            user_id: userIdBigInt,
            quest_id: questId,
            status: 'PENDING',
            proof_data: proofData || {},
            progress: 0,
          },
        });
      }

      // If already completed or claimed, return success
      if (userQuest.status === 'COMPLETED' || userQuest.status === 'CLAIMED') {
        return {
          success: true,
          message: 'Quest already completed',
        };
      }

      // For social quests, mark as completed immediately (user clicked the link)
      if (quest.type === 'SOCIAL') {
        await this.prisma.user_quests.update({
          where: {
            id: userQuest.id,
          },
          data: {
            status: 'COMPLETED',
            completed_at: new Date(),
            progress: 100,
            proof_data: proofData || {},
          },
        });

        return {
          success: true,
          message: 'Social quest completed successfully',
        };
      }

      // For game quests, implement specific verification logic
      if (quest.type === 'GAME') {
        // For now, mark as completed
        await this.prisma.user_quests.update({
          where: {
            id: userQuest.id,
          },
          data: {
            status: 'COMPLETED',
            completed_at: new Date(),
            progress: 100,
            proof_data: proofData || {},
          },
        });

        return {
          success: true,
          message: 'Game quest completed successfully',
        };
      }

      return {
        success: false,
        message: 'Quest verification failed',
      };
    } catch (error) {
      this.logger.error('Failed to verify quest:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify quest');
    }
  }

  /**
   * Claim quest reward
   */
  async claimQuestReward(userId: string, questId: number): Promise<{ success: boolean; message: string; pointsEarned?: number }> {
    try {
      const userIdBigInt = BigInt(userId);

      // Get user quest
      const userQuest = await this.prisma.user_quests.findUnique({
        where: {
          user_id_quest_id: {
            user_id: userIdBigInt,
            quest_id: questId,
          },
        },
        include: {
          quests: true,
        },
      });

      if (!userQuest) {
        throw new NotFoundException('User quest not found');
      }

      if (userQuest.status === 'CLAIMED') {
        return {
          success: true,
          message: 'Reward already claimed',
          pointsEarned: 0,
        };
      }

      if (userQuest.status !== 'COMPLETED') {
        throw new BadRequestException('Quest not completed yet');
      }

      const quest = userQuest.quests;
      const rewardAmount = quest.reward_amount || 0;

      // Start transaction
      await this.prisma.$transaction(async (tx) => {
        // Mark quest as claimed
        await tx.user_quests.update({
          where: {
            id: userQuest.id,
          },
          data: {
            status: 'CLAIMED',
            claimed_at: new Date(),
          },
        });

        // Add points to user
        if (rewardAmount > 0) {
          await tx.users.update({
            where: {
              telegram_id: userIdBigInt,
            },
            data: {
              total_points: {
                increment: rewardAmount,
              },
              lifetime_points: {
                increment: rewardAmount,
              },
            },
          });

          // Log transaction
          await tx.point_transactions.create({
            data: {
              user_id: userIdBigInt,
              amount: rewardAmount,
              type: 'QUEST_REWARD',
              description: `Quest reward: ${quest.title}`,
              reference_id: `quest_${questId}`,
            },
          });
        }
      });

      return {
        success: true,
        message: 'Quest reward claimed successfully',
        pointsEarned: rewardAmount,
      };
    } catch (error) {
      this.logger.error('Failed to claim quest reward:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to claim quest reward');
    }
  }

  /**
   * Initialize default quests (run once)
   */
  async initializeDefaultQuests(): Promise<void> {
    try {
      // Check if quests already exist
      const existingQuests = await this.prisma.quests.count();
      if (existingQuests > 0) {
        this.logger.log('Quests already initialized');
        return;
      }

      // Create default quests
      const defaultQuests = [
        {
          title: 'Follow on Twitter',
          description: 'Follow our official Twitter account @CedraQuest',
          type: 'SOCIAL' as const,
          category: 'social',
          config: { url: 'https://twitter.com/intent/follow?screen_name=CedraQuest' },
          reward_amount: 100,
          reward_type: 'POINT' as const,
          frequency: 'ONCE' as const,
          is_active: true,
        },
        {
          title: 'Join Telegram Channel',
          description: 'Join our official Telegram channel for updates',
          type: 'SOCIAL' as const,
          category: 'social',
          config: { url: 'https://t.me/cedra_quest_official' },
          reward_amount: 150,
          reward_type: 'POINT' as const,
          frequency: 'ONCE' as const,
          is_active: true,
        },
        {
          title: 'Like & Retweet',
          description: 'Like and retweet our pinned post',
          type: 'SOCIAL' as const,
          category: 'social',
          config: { url: 'https://twitter.com/CedraQuest/status/1234567890' },
          reward_amount: 75,
          reward_type: 'POINT' as const,
          frequency: 'ONCE' as const,
          is_active: true,
        },
        {
          title: 'Daily Check-in',
          description: 'Check in daily to earn rewards',
          type: 'GAME' as const,
          category: 'daily',
          config: {},
          reward_amount: 50,
          reward_type: 'POINT' as const,
          frequency: 'DAILY' as const,
          is_active: true,
        },
        {
          title: 'Complete First Game',
          description: 'Play and complete your first game session',
          type: 'GAME' as const,
          category: 'achievement',
          config: {},
          reward_amount: 200,
          reward_type: 'POINT' as const,
          frequency: 'ONCE' as const,
          is_active: true,
        },
      ];

      await this.prisma.quests.createMany({
        data: defaultQuests,
      });

      this.logger.log('Default quests initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize default quests:', error);
      throw new BadRequestException('Failed to initialize default quests');
    }
  }

  /**
   * Map Prisma quest status to API status
   */
  private mapPrismaStatusToAPI(status: string | null): 'NOT_STARTED' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CLAIMED' {
    switch (status) {
      case 'PENDING':
        return 'PENDING';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'FAILED':
        return 'FAILED';
      case 'CLAIMED':
        return 'CLAIMED';
      default:
        return 'NOT_STARTED';
    }
  }
}