import { PrismaService } from '../../prisma/prisma.service';
import { RankInfo } from '../../common/interfaces/game.interface';
export declare class RankingService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private safeToBigInt;
    checkAndAwardRankRewards(userId: string, oldPoints: number, newPoints: number): Promise<{
        rankUp: boolean;
        newRank?: string;
        coinsAwarded?: number;
    }>;
    getUserRankInfo(userId: string): Promise<RankInfo>;
    getLeaderboard(limit?: number, offset?: number): Promise<{
        users: Array<{
            telegram_id: string;
            username: string | null;
            lifetime_points: number;
            current_rank: string;
            position: number;
        }>;
        total: number;
    }>;
    getUserPosition(userId: string): Promise<number>;
    getRankStatistics(): Promise<Record<string, number>>;
    private calculateRank;
}
