export declare const PET_CONSTANTS: {
    FEED_COST: number;
    MAX_DAILY_SPEND: number;
    XP_PER_FEED: number;
    XP_FOR_LEVEL_UP: number;
    MAX_LEVEL: number;
    MAX_CLAIM_HOURS: number;
};
export declare const ENERGY_CONSTANTS: {
    MAX_ENERGY: number;
    REGEN_INTERVAL: number;
    REGEN_THRESHOLD: number;
    ENERGY_PER_GAME: number;
};
export declare const GAME_CONSTANTS: {
    BASE_POINTS_PER_GAME: number;
    SCORE_MULTIPLIER: number;
    MAX_GAME_DURATION: number;
};
export declare const RANK_THRESHOLDS: {
    readonly RANK1: 0;
    readonly RANK2: 10000;
    readonly RANK3: 25000;
    readonly RANK4: 45000;
    readonly RANK5: 60000;
    readonly RANK6: 75000;
};
export declare const RANK_ORDER: readonly ["RANK1", "RANK2", "RANK3", "RANK4", "RANK5", "RANK6"];
export declare const RANK_REWARDS: {
    readonly RANK1: 0;
    readonly RANK2: 1000;
    readonly RANK3: 2000;
    readonly RANK4: 3000;
    readonly RANK5: 4000;
    readonly RANK6: 5000;
};
export declare const DEFAULT_CYCLE: {
    cycleNumber: number;
    growthRate: number;
    maxSpeedCap: number;
    isActive: boolean;
};
export declare const BLOCKCHAIN_CONSTANTS: {
    MIN_CLAIM_AMOUNT: number;
    SIGNATURE_EXPIRY: number;
    MAX_NONCE_AGE: number;
    TREASURY_SEED: string;
    DECIMALS: number;
    OCTAS_PER_CEDRA: number;
};
export declare const TIME_CONSTANTS: {
    HOUR_IN_MS: number;
    DAY_IN_MS: number;
    MINUTE_IN_MS: number;
};
export declare const DATE_FORMAT = "YYYY-MM-DD";
export declare const ANTI_CHEAT: {
    MAX_FEEDS_PER_MINUTE: number;
    MAX_GAMES_PER_MINUTE: number;
    MIN_GAME_DURATION: number;
};
