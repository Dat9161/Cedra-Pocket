import { Controller, Get, Post, Body, Param, Query, Logger, UseGuards } from '@nestjs/common';
import { PetService } from './services/pet.service';
import { EnergyService } from './services/energy.service';
import { GameSessionService } from './services/game-session.service';
import { RankingService } from './services/ranking.service';
import { GameCycleService } from './services/game-cycle.service';
import { PrismaService } from '../prisma/prisma.service';
import { 
  FeedPetDto, 
  GameSessionStartDto, 
  GameSessionCompleteDto, 
  RefillEnergyDto, 
  LeaderboardQueryDto,
  CreateCycleDto 
} from '../common/dto/game.dto';

@Controller('game')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(
    private petService: PetService,
    private energyService: EnergyService,
    private gameSessionService: GameSessionService,
    private rankingService: RankingService,
    private gameCycleService: GameCycleService,
    private prisma: PrismaService,
  ) {}

  // Pet Management Endpoints

  @Get('pet/status/:userId')
  async getPetStatus(@Param('userId') userId: string) {
    this.logger.log(`Getting pet status for user: ${userId}`);
    return await this.petService.getPetStatus(userId);
  }

  @Post('pet/feed/:userId')
  async feedPet(@Param('userId') userId: string, @Body() feedPetDto: FeedPetDto) {
    this.logger.log(`Feeding pet for user: ${userId}, count: ${feedPetDto.feedCount}`);
    return await this.petService.feedPet(userId, feedPetDto);
  }

  @Post('pet/claim/:userId')
  async claimRewards(@Param('userId') userId: string) {
    this.logger.log(`Claiming rewards for user: ${userId}`);
    return await this.petService.claimRewards(userId);
  }

  // Energy Management Endpoints

  @Get('energy/status/:userId')
  async getEnergyStatus(@Param('userId') userId: string) {
    this.logger.log(`Getting energy status for user: ${userId}`);
    return await this.energyService.getEnergyStatus(userId);
  }

  @Post('energy/refill/:userId')
  async refillEnergy(@Param('userId') userId: string, @Body() refillDto: RefillEnergyDto) {
    this.logger.log(`Refilling energy for user: ${userId}, amount: ${refillDto.energyAmount}`);
    return await this.energyService.refillEnergy(userId, refillDto.energyAmount);
  }

  // Game Session Endpoints

  @Post('session/start/:userId')
  async startGameSession(@Param('userId') userId: string, @Body() startDto: GameSessionStartDto) {
    this.logger.log(`Starting game session for user: ${userId}, type: ${startDto.gameType}`);
    return await this.gameSessionService.startGameSession(userId, startDto.gameType);
  }

  @Post('session/complete/:userId')
  async completeGameSession(@Param('userId') userId: string, @Body() completeDto: GameSessionCompleteDto) {
    this.logger.log(`Completing game session for user: ${userId}, score: ${completeDto.score}`);
    return await this.gameSessionService.completeGameSession(userId, completeDto);
  }

  @Get('session/stats/:userId')
  async getGameStats(@Param('userId') userId: string) {
    this.logger.log(`Getting game stats for user: ${userId}`);
    return await this.gameSessionService.getGameStats(userId);
  }

  // Ranking Endpoints

  @Get('ranking/user/:userId')
  async getUserRankInfo(@Param('userId') userId: string) {
    this.logger.log(`Getting rank info for user: ${userId}`);
    return await this.rankingService.getUserRankInfo(userId);
  }

  @Get('ranking/leaderboard')
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    this.logger.log(`Getting leaderboard, limit: ${limit}, offset: ${offset}`);
    return await this.rankingService.getLeaderboard(limit, offset);
  }

  @Get('ranking/position/:userId')
  async getUserPosition(@Param('userId') userId: string) {
    this.logger.log(`Getting position for user: ${userId}`);
    const position = await this.rankingService.getUserPosition(userId);
    return { position };
  }

  @Get('ranking/statistics')
  async getRankStatistics() {
    this.logger.log('Getting rank statistics');
    return await this.rankingService.getRankStatistics();
  }

  // Game Cycle Endpoints

  @Get('cycle/current')
  async getCurrentCycle() {
    this.logger.log('Getting current game cycle');
    return await this.gameCycleService.getCurrentCycle();
  }

  @Get('cycle/all')
  async getAllCycles() {
    this.logger.log('Getting all game cycles');
    return await this.gameCycleService.getAllCycles();
  }

  // Admin Endpoints (TODO: Add admin authentication)

  @Post('admin/cycle/create')
  async createCycle(@Body() createDto: CreateCycleDto) {
    this.logger.log(`Creating new cycle: ${createDto.cycleNumber}`);
    return await this.gameCycleService.createCycle({
      cycleNumber: createDto.cycleNumber,
      growthRate: createDto.growthRate,
      maxSpeedCap: createDto.maxSpeedCap,
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
    });
  }

  @Post('admin/cycle/activate/:cycleNumber')
  async activateCycle(@Param('cycleNumber') cycleNumber: string) {
    this.logger.log(`Activating cycle: ${cycleNumber}`);
    await this.gameCycleService.activateCycle(parseInt(cycleNumber));
    return { success: true, message: `Cycle ${cycleNumber} activated` };
  }

  // Dashboard Endpoint (Combined data for frontend)

  @Get('dashboard/:userId')
  async getDashboard(@Param('userId') userId: string) {
    this.logger.log(`Getting dashboard data for user: ${userId}`);
    
    try {
      const [petStatus, energyStatus, rankInfo, gameStats, userProfile] = await Promise.all([
        this.petService.getPetStatus(userId).catch(err => {
          this.logger.error('Failed to get pet status', err);
          return null;
        }),
        this.energyService.getEnergyStatus(userId).catch(err => {
          this.logger.error('Failed to get energy status', err);
          return null;
        }),
        this.rankingService.getUserRankInfo(userId).catch(err => {
          this.logger.error('Failed to get rank info', err);
          return null;
        }),
        this.gameSessionService.getGameStats(userId).catch(err => {
          this.logger.error('Failed to get game stats', err);
          return null;
        }),
        // Get user profile to include current points
        this.prisma.users.findUnique({
          where: { telegram_id: BigInt(userId) },
          select: {
            telegram_id: true,
            total_points: true,
            lifetime_points: true,
            current_rank: true,
            username: true,
          }
        }).catch(err => {
          this.logger.error('Failed to get user profile', err);
          return null;
        }),
      ]);

      return {
        pet: petStatus,
        energy: energyStatus,
        ranking: rankInfo,
        gameStats,
        user: userProfile,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard for user ${userId}`, error);
      return {
        pet: null,
        energy: null,
        ranking: null,
        gameStats: null,
        user: null,
        success: false,
        error: 'Failed to load dashboard data',
      };
    }
  }
}