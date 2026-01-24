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
var RankingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const game_constants_1 = require("../../common/constants/game.constants");
let RankingService = RankingService_1 = class RankingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RankingService_1.name);
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
    async checkAndAwardRankRewards(userId, oldPoints, newPoints) {
        try {
            const oldRank = this.calculateRank(oldPoints);
            const newRank = this.calculateRank(newPoints);
            if (oldRank !== newRank) {
                const coinsAwarded = game_constants_1.RANK_REWARDS[newRank];
                this.logger.log(`🎉 User ${userId} ranked up from ${oldRank} to ${newRank}! Awarding ${coinsAwarded} coins`);
                await this.prisma.$transaction(async (tx) => {
                    await tx.users.update({
                        where: { telegram_id: this.safeToBigInt(userId) },
                        data: {
                            current_rank: newRank,
                            total_points: { increment: coinsAwarded },
                            lifetime_points: { increment: coinsAwarded },
                            updated_at: new Date(),
                        },
                    });
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
        }
        catch (error) {
            this.logger.error(`Failed to check rank rewards for user ${userId}`, error);
            return { rankUp: false };
        }
    }
    async getUserRankInfo(userId) {
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
            if (currentRank !== user.current_rank) {
                await this.prisma.users.update({
                    where: { telegram_id: this.safeToBigInt(userId) },
                    data: { current_rank: currentRank },
                });
            }
            const currentRankIndex = game_constants_1.RANK_ORDER.indexOf(currentRank);
            const nextRank = currentRankIndex < game_constants_1.RANK_ORDER.length - 1 ? game_constants_1.RANK_ORDER[currentRankIndex + 1] : null;
            const nextRankThreshold = nextRank ? game_constants_1.RANK_THRESHOLDS[nextRank] : lifetimePoints;
            const pointsToNextRank = nextRank ? Math.max(0, nextRankThreshold - lifetimePoints) : 0;
            const currentRankThreshold = game_constants_1.RANK_THRESHOLDS[currentRank];
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
        }
        catch (error) {
            this.logger.error(`Failed to get rank info for user ${userId}`, error);
            throw error;
        }
    }
    async getLeaderboard(limit = 100, offset = 0) {
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
        }
        catch (error) {
            this.logger.error('Failed to get leaderboard', error);
            return {
                users: [],
                total: 0,
            };
        }
    }
    async getUserPosition(userId) {
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
        }
        catch (error) {
            this.logger.error(`Failed to get position for user ${userId}`, error);
            throw error;
        }
    }
    async getRankStatistics() {
        try {
            const stats = await this.prisma.users.groupBy({
                by: ['current_rank'],
                _count: { current_rank: true },
            });
            const rankStats = {};
            game_constants_1.RANK_ORDER.forEach(rank => {
                rankStats[rank] = 0;
            });
            stats.forEach(stat => {
                if (stat.current_rank && game_constants_1.RANK_ORDER.includes(stat.current_rank)) {
                    rankStats[stat.current_rank] = stat._count.current_rank;
                }
            });
            return rankStats;
        }
        catch (error) {
            this.logger.error('Failed to get rank statistics', error);
            const defaultStats = {};
            game_constants_1.RANK_ORDER.forEach(rank => {
                defaultStats[rank] = 0;
            });
            return defaultStats;
        }
    }
    calculateRank(lifetimePoints) {
        for (let i = game_constants_1.RANK_ORDER.length - 1; i >= 0; i--) {
            const rank = game_constants_1.RANK_ORDER[i];
            if (lifetimePoints >= game_constants_1.RANK_THRESHOLDS[rank]) {
                return rank;
            }
        }
        return 'RANK1';
    }
};
exports.RankingService = RankingService;
exports.RankingService = RankingService = RankingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RankingService);
//# sourceMappingURL=ranking.service.js.map