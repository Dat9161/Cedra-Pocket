import { PrismaService } from '../../prisma/prisma.service';
import { PetStatus, FeedPetRequest, FeedPetResult, ClaimRewardsResult } from '../../common/interfaces/game.interface';
import { GameCycleService } from './game-cycle.service';
import { BlockchainService } from '../../blockchain/blockchain.service';
import { RankingService } from './ranking.service';
export declare class PetService {
    private prisma;
    private gameCycleService;
    private blockchainService;
    private rankingService;
    private readonly logger;
    constructor(prisma: PrismaService, gameCycleService: GameCycleService, blockchainService: BlockchainService, rankingService: RankingService);
    private safeToBigInt;
    getPetStatus(userId: string): Promise<PetStatus>;
    private updatePendingCoins;
    feedPet(userId: string, request: FeedPetRequest): Promise<FeedPetResult>;
    claimRewards(userId: string): Promise<ClaimRewardsResult & {
        rankReward?: {
            rankUp: boolean;
            newRank?: string;
            coinsAwarded?: number;
        };
    }>;
    private calculatePendingRewards;
    private generateClaimSignature;
}
