import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { user_rank, pet_tier } from '@prisma/client';

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

      // Check if user exists, create if not
      const existingUser = await this.prisma.users.findUnique({
        where: { telegram_id: userIdBigInt },
      });

      if (!existingUser) {
        this.logger.log(`User ${userId} not found, creating new user`);
        // Create user with basic info
        await this.prisma.users.create({
          data: {
            telegram_id: userIdBigInt,
            wallet_address: `user_${userId}.hot.tg`,
            public_key: `pk_${userId}_${Date.now()}`,
            username: `User${userId}`,
            total_points: 0,
            lifetime_points: 0,
            current_rank: 'RANK1' as any,
            level: 1,
            current_xp: 0,
            is_wallet_connected: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        this.logger.log(`User ${userId} created successfully`);
      }

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

      // Check if user exists, create if not
      const existingUser = await this.prisma.users.findUnique({
        where: { telegram_id: userIdBigInt },
      });

      if (!existingUser) {
        this.logger.log(`User ${userId} not found, creating new user for quest verification`);
        await this.prisma.users.create({
          data: {
            telegram_id: userIdBigInt,
            wallet_address: `user_${userId}.hot.tg`,
            public_key: `pk_${userId}_${Date.now()}`,
            username: `User${userId}`,
            total_points: 0,
            lifetime_points: 0,
            current_rank: 'RANK1' as any,
            level: 1,
            current_xp: 0,
            is_wallet_connected: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

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
        // Special handling for pet hatching quest
        if (quest.category === 'pet' && (quest.config as any)?.requiresBirthYear) {
          // Check if birth year is provided in proof data
          if (!proofData?.birthYear) {
            return {
              success: false,
              message: 'Birth year is required to hatch your pet egg',
            };
          }

          const birthYear = Number(proofData.birthYear);
          const currentYear = new Date().getFullYear();
          
          // Validate birth year (must be between 1900 and current year - 5)
          if (isNaN(birthYear) || birthYear < 1900 || birthYear > currentYear - 5) {
            return {
              success: false,
              message: 'Please enter a valid birth year',
            };
          }

          // Update user with birth year and mark quest as completed
          await this.prisma.$transaction(async (tx) => {
            // Update user with birth year (cast to any to avoid TypeScript issues)
            await tx.users.update({
              where: {
                telegram_id: userIdBigInt,
              },
              data: {
                birth_year: birthYear,
              } as any,
            });

            // Create pet for user if not exists
            const existingPet = await tx.pets.findUnique({
              where: {
                user_id: userIdBigInt,
              },
            });

            if (!existingPet) {
              await tx.pets.create({
                data: {
                  user_id: userIdBigInt,
                  level: 1,
                  exp: 0,
                  max_exp: 100,
                  hunger: 100,
                  happiness: 100,
                  pending_coins: 0,
                  total_coins_earned: 0,
                  coin_rate: 1.0,
                  tier: 'RANK1' as any,
                },
              });
            }

            // Mark quest as completed
            await tx.user_quests.update({
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
          });

          return {
            success: true,
            message: 'Pet egg hatched successfully! Your pet is now ready to grow.',
          };
        }

        // Special handling for pet task quests (invite friend, etc.)
        if (quest.category === 'pet_task') {
          // For now, mark as completed (can add specific logic later)
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
            message: 'Pet task completed successfully',
          };
        }

        // For other game quests, mark as completed
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

      // Check if user exists, create if not
      const existingUser = await this.prisma.users.findUnique({
        where: { telegram_id: userIdBigInt },
      });

      if (!existingUser) {
        this.logger.log(`User ${userId} not found, creating new user for quest claim`);
        await this.prisma.users.create({
          data: {
            telegram_id: userIdBigInt,
            wallet_address: `user_${userId}.hot.tg`,
            public_key: `pk_${userId}_${Date.now()}`,
            username: `User${userId}`,
            total_points: 0,
            lifetime_points: 0,
            current_rank: 'RANK1' as any,
            level: 1,
            current_xp: 0,
            is_wallet_connected: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

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
        // Check if pet hatching quest exists
        const petQuest = await this.prisma.quests.findFirst({
          where: {
            title: 'Hatch Your Pet Egg',
          },
        });

        if (!petQuest) {
          // Add pet hatching quest and pet tasks if they don't exist
          await this.prisma.quests.createMany({
            data: [
              {
                title: 'Hatch Your Pet Egg',
                description: 'Enter your birth year and hatch your first pet egg to start your journey',
                type: 'GAME',
                category: 'pet',
                config: { requiresBirthYear: true },
                reward_amount: 300,
                reward_type: 'POINT',
                frequency: 'ONCE',
                is_active: true,
              },
              {
                title: 'Follow on Twitter',
                description: 'Follow our official Twitter account @CedraQuest',
                type: 'SOCIAL',
                category: 'pet_task',
                config: { url: 'https://twitter.com/intent/follow?screen_name=CedraQuest' },
                reward_amount: 0,
                reward_type: 'POINT',
                frequency: 'ONCE',
                is_active: true,
              },
              {
                title: 'Join Telegram Group',
                description: 'Join our official Telegram channel for updates',
                type: 'SOCIAL',
                category: 'pet_task',
                config: { url: 'https://t.me/cedra_quest_official' },
                reward_amount: 0,
                reward_type: 'POINT',
                frequency: 'ONCE',
                is_active: true,
              },
              {
                title: 'Invite 1 Friend',
                description: 'Invite your first friend to join the game',
                type: 'GAME',
                category: 'pet_task',
                config: {},
                reward_amount: 0,
                reward_type: 'POINT',
                frequency: 'ONCE',
                is_active: true,
              },
            ],
          });
          this.logger.log('Pet quests added successfully');
        }

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
        {
          title: 'Hatch Your Pet Egg',
          description: 'Enter your birth year and hatch your first pet egg to start your journey',
          type: 'GAME' as const,
          category: 'pet',
          config: { requiresBirthYear: true },
          reward_amount: 300,
          reward_type: 'POINT' as const,
          frequency: 'ONCE' as const,
          is_active: true,
        },
        {
          title: 'Follow on Twitter',
          description: 'Follow our official Twitter account @CedraQuest',
          type: 'SOCIAL' as const,
          category: 'pet_task',
          config: { url: 'https://twitter.com/intent/follow?screen_name=CedraQuest' },
          reward_amount: 0,
          reward_type: 'POINT' as const,
          frequency: 'ONCE' as const,
          is_active: true,
        },
        {
          title: 'Join Telegram Group',
          description: 'Join our official Telegram channel for updates',
          type: 'SOCIAL' as const,
          category: 'pet_task',
          config: { url: 'https://t.me/cedra_quest_official' },
          reward_amount: 0,
          reward_type: 'POINT' as const,
          frequency: 'ONCE' as const,
          is_active: true,
        },
        {
          title: 'Invite 1 Friend',
          description: 'Invite your first friend to join the game',
          type: 'GAME' as const,
          category: 'pet_task',
          config: {},
          reward_amount: 0,
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
