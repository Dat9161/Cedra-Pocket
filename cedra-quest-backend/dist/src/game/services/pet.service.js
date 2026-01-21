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
var PetService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const game_constants_1 = require("../../common/constants/game.constants");
const game_cycle_service_1 = require("./game-cycle.service");
const blockchain_service_1 = require("../../blockchain/blockchain.service");
let PetService = PetService_1 = class PetService {
    constructor(prisma, gameCycleService, blockchainService) {
        this.prisma = prisma;
        this.gameCycleService = gameCycleService;
        this.blockchainService = blockchainService;
        this.logger = new common_1.Logger(PetService_1.name);
    }
    safeToBigInt(userId) {
        if (!/^\d+$/.test(userId)) {
            let hash = 0;
            for (let i = 0; i < userId.length; i++) {
                const char = userId.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return BigInt(Math.abs(hash) + 1000000000);
        }
        return BigInt(userId);
    }
    async getPetStatus(userId) {
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
                user = await this.prisma.users.findUnique({
                    where: { telegram_id: this.safeToBigInt(userId) },
                    select: {
                        pet_level: true,
                        pet_current_xp: true,
                        pet_last_claim_time: true,
                    },
                });
                if (!user) {
                    throw new common_1.BadRequestException('Failed to create user');
                }
            }
            const petLevel = user.pet_level || 1;
            const petCurrentXp = user.pet_current_xp || 0;
            const petLastClaimTime = user.pet_last_claim_time || new Date();
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
            const pendingRewards = await this.calculatePendingRewards(petLevel, petLastClaimTime);
            const canLevelUp = petCurrentXp >= game_constants_1.PET_CONSTANTS.XP_FOR_LEVEL_UP &&
                petLevel < game_constants_1.PET_CONSTANTS.MAX_LEVEL;
            return {
                level: petLevel,
                currentXp: petCurrentXp,
                xpForNextLevel: game_constants_1.PET_CONSTANTS.XP_FOR_LEVEL_UP,
                lastClaimTime: petLastClaimTime,
                pendingRewards,
                canLevelUp,
                dailyFeedSpent,
                dailyFeedLimit: game_constants_1.PET_CONSTANTS.MAX_DAILY_SPEND,
                feedCost: game_constants_1.PET_CONSTANTS.FEED_COST,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get pet status for user ${userId}`, error);
            throw error;
        }
    }
    async feedPet(userId, request) {
        try {
            const { feedCount } = request;
            if (feedCount <= 0 || feedCount > 30) {
                throw new common_1.BadRequestException('Invalid feed count (1-30)');
            }
            const totalCost = feedCount * game_constants_1.PET_CONSTANTS.FEED_COST;
            const totalXp = feedCount * game_constants_1.PET_CONSTANTS.XP_PER_FEED;
            return await this.prisma.$transaction(async (tx) => {
                const user = await tx.users.findUnique({
                    where: { telegram_id: this.safeToBigInt(userId) },
                    select: {
                        total_points: true,
                        pet_level: true,
                        pet_current_xp: true,
                    },
                });
                if (!user) {
                    throw new common_1.BadRequestException('User not found');
                }
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
                if (newDailySpent > game_constants_1.PET_CONSTANTS.MAX_DAILY_SPEND) {
                    return {
                        success: false,
                        pointsSpent: 0,
                        xpGained: 0,
                        newXp: user.pet_current_xp,
                        canLevelUp: false,
                        dailySpentTotal: currentDailySpent,
                        error: `Daily feeding limit exceeded (${game_constants_1.PET_CONSTANTS.MAX_DAILY_SPEND} points/day)`,
                    };
                }
                if (user.pet_level >= game_constants_1.PET_CONSTANTS.MAX_LEVEL) {
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
                const newXp = user.pet_current_xp + totalXp;
                const newLevel = newXp >= game_constants_1.PET_CONSTANTS.XP_FOR_LEVEL_UP && user.pet_level < game_constants_1.PET_CONSTANTS.MAX_LEVEL
                    ? user.pet_level + 1
                    : user.pet_level;
                const finalXp = newLevel > user.pet_level ? newXp - game_constants_1.PET_CONSTANTS.XP_FOR_LEVEL_UP : newXp;
                await tx.users.update({
                    where: { telegram_id: this.safeToBigInt(userId) },
                    data: {
                        total_points: { decrement: totalCost },
                        pet_current_xp: finalXp,
                        pet_level: newLevel,
                        updated_at: new Date(),
                    },
                });
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
                const canLevelUp = finalXp >= game_constants_1.PET_CONSTANTS.XP_FOR_LEVEL_UP && newLevel < game_constants_1.PET_CONSTANTS.MAX_LEVEL;
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
        }
        catch (error) {
            this.logger.error(`Failed to feed pet for user ${userId}`, error);
            throw error;
        }
    }
    async claimRewards(userId) {
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
                    throw new common_1.BadRequestException('User not found');
                }
                const rewards = await this.calculatePendingRewards(user.pet_level, user.pet_last_claim_time);
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
                const MIN_BLOCKCHAIN_CLAIM = 1000;
                if (user.wallet_address && rewards >= MIN_BLOCKCHAIN_CLAIM) {
                    try {
                        const nonce = Date.now();
                        const signature = await this.generateClaimSignature(user.wallet_address, rewards, nonce);
                        await this.blockchainService.claimReward(user.wallet_address, process.env.CEDRA_ADMIN_ADDRESS || '', rewards, nonce, signature);
                        this.logger.log(`Blockchain claim recorded for user ${userId}: ${rewards} points`);
                    }
                    catch (blockchainError) {
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
        }
        catch (error) {
            this.logger.error(`Failed to claim rewards for user ${userId}`, error);
            throw error;
        }
    }
    async calculatePendingRewards(petLevel, lastClaimTime) {
        try {
            const now = new Date();
            const elapsedMs = now.getTime() - lastClaimTime.getTime();
            const maxClaimMs = game_constants_1.PET_CONSTANTS.MAX_CLAIM_HOURS * game_constants_1.TIME_CONSTANTS.HOUR_IN_MS;
            const effectiveMs = Math.min(elapsedMs, maxClaimMs);
            if (effectiveMs <= 0) {
                return 0;
            }
            const cycle = await this.gameCycleService.getCurrentCycle();
            const pointsPerHour = petLevel * Number(cycle.growthRate);
            const hoursElapsed = effectiveMs / game_constants_1.TIME_CONSTANTS.HOUR_IN_MS;
            const rewards = Math.floor(hoursElapsed * pointsPerHour);
            return Math.max(0, rewards);
        }
        catch (error) {
            this.logger.error('Failed to calculate pending rewards', error);
            return 0;
        }
    }
    async generateClaimSignature(userAddress, amount, nonce) {
        const message = `${userAddress}:${amount}:${nonce}`;
        const hash = Buffer.from(message).toString('hex');
        return `0x${hash.padEnd(128, '0')}`;
    }
};
exports.PetService = PetService;
exports.PetService = PetService = PetService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        game_cycle_service_1.GameCycleService,
        blockchain_service_1.BlockchainService])
], PetService);
//# sourceMappingURL=pet.service.js.map