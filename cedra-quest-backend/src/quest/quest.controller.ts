import { Controller, Get, Post, Param, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { QuestService } from './quest.service';

@Controller('quests')
export class QuestController {
  private readonly logger = new Logger(QuestController.name);

  constructor(private readonly questService: QuestService) {}

  /**
   * Get all quests for authenticated user
   * GET /quests
   */
  @Get()
  async getQuests() {
    this.logger.log('Get quests request');
    
    // For now, use a default user ID
    // In production, this should come from JWT token
    const userId = '123456789';
    
    return await this.questService.getQuestsForUser(userId);
  }

  /**
   * Get quests for specific user
   * GET /quests/user/:userId
   */
  @Get('user/:userId')
  async getQuestsForUser(@Param('userId') userId: string) {
    this.logger.log(`Get quests for user: ${userId}`);
    
    return await this.questService.getQuestsForUser(userId);
  }

  /**
   * Verify/complete a quest
   * POST /quests/:questId/verify
   */
  @Post(':questId/verify')
  @HttpCode(HttpStatus.OK)
  async verifyQuest(
    @Param('questId') questId: string,
    @Body() body: { proof_data?: any; userId?: string }
  ) {
    const questIdNum = parseInt(questId, 10);
    if (isNaN(questIdNum)) {
      throw new Error('Invalid quest ID');
    }

    // For now, use userId from body or default
    // In production, this should come from JWT token
    const userId = body.userId || '123456789';
    
    this.logger.log(`Verify quest ${questIdNum} for user ${userId}`);
    
    return await this.questService.verifyQuest(userId, questIdNum, body.proof_data);
  }

  /**
   * Claim quest reward
   * POST /quests/:questId/claim
   */
  @Post(':questId/claim')
  @HttpCode(HttpStatus.OK)
  async claimQuestReward(
    @Param('questId') questId: string,
    @Body() body: { userId?: string }
  ) {
    const questIdNum = parseInt(questId, 10);
    if (isNaN(questIdNum)) {
      throw new Error('Invalid quest ID');
    }

    // For now, use userId from body or default
    // In production, this should come from JWT token
    const userId = body.userId || '123456789';
    
    this.logger.log(`Claim quest reward ${questIdNum} for user ${userId}`);
    
    return await this.questService.claimQuestReward(userId, questIdNum);
  }

  /**
   * Initialize default quests (admin only)
   * POST /quests/initialize
   */
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  async initializeQuests() {
    this.logger.log('Initialize default quests');
    
    await this.questService.initializeDefaultQuests();
    
    return {
      success: true,
      message: 'Default quests initialized successfully',
    };
  }
}