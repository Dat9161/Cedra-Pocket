import { PetService } from './services/pet.service';
import { EnergyService } from './services/energy.service';
import { GameSessionService } from './services/game-session.service';
import { RankingService } from './services/ranking.service';
import { GameCycleService } from './services/game-cycle.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeedPetDto, GameSessionStartDto, GameSessionCompleteDto, RefillEnergyDto, LeaderboardQueryDto, CreateCycleDto } from '../common/dto/game.dto';
export declare class GameController {
    private petService;
    private energyService;
    private gameSessionService;
    private rankingService;
    private gameCycleService;
    private prisma;
    private readonly logger;
    constructor(petService: PetService, energyService: EnergyService, gameSessionService: GameSessionService, rankingService: RankingService, gameCycleService: GameCycleService, prisma: PrismaService);
    getPetStatus(userId: string): Promise<import("../common/interfaces/game.interface").PetStatus>;
    feedPet(userId: string, feedPetDto: FeedPetDto): Promise<import("../common/interfaces/game.interface").FeedPetResult>;
    claimRewards(userId: string): Promise<import("../common/interfaces/game.interface").ClaimRewardsResult>;
    getEnergyStatus(userId: string): Promise<import("../common/interfaces/game.interface").EnergyStatus>;
    refillEnergy(userId: string, refillDto: RefillEnergyDto): Promise<{
        success: boolean;
        pointsCost: number;
        newEnergy: number;
        error?: string;
    }>;
    startGameSession(userId: string, startDto: GameSessionStartDto): Promise<{
        success: boolean;
        energyUsed: number;
        error?: string;
    }>;
    completeGameSession(userId: string, completeDto: GameSessionCompleteDto): Promise<import("../common/interfaces/game.interface").GameSessionResult>;
    getGameStats(userId: string): Promise<{
        totalGamesPlayed: number;
        totalPointsEarned: number;
        averageScore: number;
        favoriteGameType: string;
        todayGamesPlayed: number;
    }>;
    getUserRankInfo(userId: string): Promise<import("../common/interfaces/game.interface").RankInfo>;
    getLeaderboard(query: LeaderboardQueryDto): Promise<{
        users: Array<{
            telegram_id: string;
            username: string | null;
            lifetime_points: number;
            current_rank: string;
            position: number;
        }>;
        total: number;
    }>;
    getUserPosition(userId: string): Promise<{
        position: number;
    }>;
    getRankStatistics(): Promise<Record<string, number>>;
    getCurrentCycle(): Promise<import("../common/interfaces/game.interface").GameCycleInfo>;
    getAllCycles(): Promise<import("../common/interfaces/game.interface").GameCycleInfo[]>;
    createCycle(createDto: CreateCycleDto): Promise<import("../common/interfaces/game.interface").GameCycleInfo>;
    activateCycle(cycleNumber: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getDashboard(userId: string): Promise<{
        pet: any;
        energy: any;
        ranking: any;
        gameStats: any;
        user: any;
        success: boolean;
        error?: undefined;
    } | {
        pet: any;
        energy: any;
        ranking: any;
        gameStats: any;
        user: any;
        success: boolean;
        error: string;
    }>;
}
