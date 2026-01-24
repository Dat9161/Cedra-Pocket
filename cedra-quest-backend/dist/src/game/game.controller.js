"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GameController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const pet_service_1 = require("./services/pet.service");
const energy_service_1 = require("./services/energy.service");
const game_session_service_1 = require("./services/game-session.service");
const ranking_service_1 = require("./services/ranking.service");
const game_cycle_service_1 = require("./services/game-cycle.service");
const prisma_service_1 = require("../prisma/prisma.service");
const game_dto_1 = require("../common/dto/game.dto");
let GameController = GameController_1 = class GameController {
    constructor(petService, energyService, gameSessionService, rankingService, gameCycleService, prisma) {
        this.petService = petService;
        this.energyService = energyService;
        this.gameSessionService = gameSessionService;
        this.rankingService = rankingService;
        this.gameCycleService = gameCycleService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(GameController_1.name);
    }
    async getPetStatus(userId) {
        this.logger.log(`Getting pet status for user: ${userId}`);
        return await this.petService.getPetStatus(userId);
    }
    async feedPet(userId, feedPetDto) {
        this.logger.log(`Feeding pet for user: ${userId}, count: ${feedPetDto.feedCount}`);
        return await this.petService.feedPet(userId, feedPetDto);
    }
    async claimRewards(userId) {
        this.logger.log(`Claiming rewards for user: ${userId}`);
        return await this.petService.claimRewards(userId);
    }
    async getEnergyStatus(userId) {
        this.logger.log(`Getting energy status for user: ${userId}`);
        return await this.energyService.getEnergyStatus(userId);
    }
    async refillEnergy(userId, refillDto) {
        this.logger.log(`Refilling energy for user: ${userId}, amount: ${refillDto.energyAmount}`);
        return await this.energyService.refillEnergy(userId, refillDto.energyAmount);
    }
    async startGameSession(userId, startDto) {
        this.logger.log(`Starting game session for user: ${userId}, type: ${startDto.gameType}`);
        return await this.gameSessionService.startGameSession(userId, startDto.gameType);
    }
    async completeGameSession(userId, completeDto) {
        this.logger.log(`Completing game session for user: ${userId}, score: ${completeDto.score}`);
        return await this.gameSessionService.completeGameSession(userId, completeDto);
    }
    async getGameStats(userId) {
        this.logger.log(`Getting game stats for user: ${userId}`);
        return await this.gameSessionService.getGameStats(userId);
    }
    async getUserRankInfo(userId) {
        this.logger.log(`Getting rank info for user: ${userId}`);
        return await this.rankingService.getUserRankInfo(userId);
    }
    async getLeaderboard(query) {
        const limit = query.limit || 50;
        const offset = query.offset || 0;
        this.logger.log(`Getting leaderboard, limit: ${limit}, offset: ${offset}`);
        return await this.rankingService.getLeaderboard(limit, offset);
    }
    async getUserPosition(userId) {
        this.logger.log(`Getting position for user: ${userId}`);
        const position = await this.rankingService.getUserPosition(userId);
        return { position };
    }
    async getRankStatistics() {
        this.logger.log('Getting rank statistics');
        return await this.rankingService.getRankStatistics();
    }
    async getCurrentCycle() {
        this.logger.log('Getting current game cycle');
        return await this.gameCycleService.getCurrentCycle();
    }
    async getAllCycles() {
        this.logger.log('Getting all game cycles');
        return await this.gameCycleService.getAllCycles();
    }
    async createCycle(createDto) {
        this.logger.log(`Creating new cycle: ${createDto.cycleNumber}`);
        return await this.gameCycleService.createCycle({
            cycleNumber: createDto.cycleNumber,
            growthRate: createDto.growthRate,
            maxSpeedCap: createDto.maxSpeedCap,
            startDate: new Date(createDto.startDate),
            endDate: new Date(createDto.endDate),
        });
    }
    async activateCycle(cycleNumber) {
        this.logger.log(`Activating cycle: ${cycleNumber}`);
        await this.gameCycleService.activateCycle(parseInt(cycleNumber));
        return { success: true, message: `Cycle ${cycleNumber} activated` };
    }
    async getDashboard(userId) {
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
        }
        catch (error) {
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
};
exports.GameController = GameController;
__decorate([
    (0, common_1.Get)('pet/status/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getPetStatus", null);
__decorate([
    (0, common_1.Post)('pet/feed/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, game_dto_1.FeedPetDto]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "feedPet", null);
__decorate([
    (0, common_1.Post)('pet/claim/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "claimRewards", null);
__decorate([
    (0, common_1.Get)('energy/status/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getEnergyStatus", null);
__decorate([
    (0, common_1.Post)('energy/refill/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, game_dto_1.RefillEnergyDto]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "refillEnergy", null);
__decorate([
    (0, common_1.Post)('session/start/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, game_dto_1.GameSessionStartDto]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "startGameSession", null);
__decorate([
    (0, common_1.Post)('session/complete/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, game_dto_1.GameSessionCompleteDto]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "completeGameSession", null);
__decorate([
    (0, common_1.Get)('session/stats/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGameStats", null);
__decorate([
    (0, common_1.Get)('ranking/user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getUserRankInfo", null);
__decorate([
    (0, common_1.Get)('ranking/leaderboard'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [game_dto_1.LeaderboardQueryDto]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('ranking/position/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getUserPosition", null);
__decorate([
    (0, common_1.Get)('ranking/statistics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getRankStatistics", null);
__decorate([
    (0, common_1.Get)('cycle/current'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getCurrentCycle", null);
__decorate([
    (0, common_1.Get)('cycle/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getAllCycles", null);
__decorate([
    (0, common_1.Post)('admin/cycle/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [game_dto_1.CreateCycleDto]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createCycle", null);
__decorate([
    (0, common_1.Post)('admin/cycle/activate/:cycleNumber'),
    __param(0, (0, common_1.Param)('cycleNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "activateCycle", null);
__decorate([
    (0, common_1.Get)('dashboard/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getDashboard", null);
exports.GameController = GameController = GameController_1 = __decorate([
    (0, common_1.Controller)('game'),
    __metadata("design:paramtypes", [pet_service_1.PetService,
        energy_service_1.EnergyService,
        game_session_service_1.GameSessionService,
        ranking_service_1.RankingService,
        game_cycle_service_1.GameCycleService,
        prisma_service_1.PrismaService])
], GameController);
//# sourceMappingURL=game.controller.js.map