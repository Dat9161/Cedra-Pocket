import { PrismaService } from '../prisma/prisma.service';
import { UserInfo } from '../common/interfaces/auth.interface';
import { RankingService } from '../game/services/ranking.service';
export declare class UserService {
    private prisma;
    private rankingService;
    private readonly logger;
    constructor(prisma: PrismaService, rankingService: RankingService);
    private safeToBigInt;
    createUser(userData: {
        telegram_id: string;
        username?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        total_points?: number;
        current_rank?: string;
        wallet_address?: string;
        public_key?: string;
    }): Promise<UserInfo>;
    private cleanWalletName;
    findUserByTelegramId(telegramId: string): Promise<UserInfo | null>;
    getUserProfile(telegramId: string): Promise<UserInfo | null>;
    checkWalletAddressExists(walletAddress: string): Promise<boolean>;
    addPoints(telegramId: string, points: number): Promise<UserInfo & {
        rankReward?: {
            rankUp: boolean;
            newRank?: string;
            coinsAwarded?: number;
        };
    }>;
    findUserByPublicKey(publicKey: string): Promise<UserInfo | null>;
}
