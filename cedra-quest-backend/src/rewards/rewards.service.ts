import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RewardType } from '../common/types/quest.types';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  /**
   * Process reward directly (without queue for now)
   * Can be upgraded to use queue later when BullMQ supports NestJS 11
   */
  async queueReward(userId: string, quest: any) {
    // Process reward directly instead of queueing
    await this.processReward({
      userId,
      questId: quest.id,
      rewardType: quest.reward_type,
      rewardAmount: Number(quest.reward_amount),
    });
  }

  async processReward(data: {
    userId: string;
    questId: number;
    rewardType: string;
    rewardAmount: number;
  }) {
    try {
      if (data.rewardType === RewardType.POINT || data.rewardType === RewardType.XP) {
        // Add points directly to user
        await this.usersService.addPoints(BigInt(data.userId), data.rewardAmount);
        
        this.logger.log(`Added ${data.rewardAmount} points to user ${data.userId}`);
      } else if (data.rewardType === RewardType.TOKEN) {
        // For token rewards, log for now (implement blockchain payout later)
        this.logger.log(`Token reward queued for user ${data.userId}: ${data.rewardAmount}`);
      } else if (data.rewardType === RewardType.SPIN) {
        // Add spins to user
        this.logger.log(`Spin reward for user ${data.userId}: ${data.rewardAmount}`);
      }

      // Update quest claim status
      await this.prisma.user_quests.updateMany({
        where: {
          user_id: BigInt(data.userId),
          quest_id: data.questId,
        },
        data: {
          claimed_at: new Date(),
        },
      });

    } catch (error) {
      this.logger.error(`Reward processing failed: ${error.message}`);
      throw error;
    }
  }
}
