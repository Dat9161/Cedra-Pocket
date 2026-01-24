"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANTI_CHEAT = exports.DATE_FORMAT = exports.TIME_CONSTANTS = exports.BLOCKCHAIN_CONSTANTS = exports.DEFAULT_CYCLE = exports.RANK_REWARDS = exports.RANK_ORDER = exports.RANK_THRESHOLDS = exports.GAME_CONSTANTS = exports.ENERGY_CONSTANTS = exports.PET_CONSTANTS = void 0;
exports.PET_CONSTANTS = {
    FEED_COST: 20,
    MAX_DAILY_SPEND: 600,
    XP_PER_FEED: 20,
    XP_FOR_LEVEL_UP: 1200,
    MAX_LEVEL: 10,
    MAX_CLAIM_HOURS: 4,
};
exports.ENERGY_CONSTANTS = {
    MAX_ENERGY: 10,
    REGEN_INTERVAL: 30 * 60 * 1000,
    REGEN_THRESHOLD: 5,
    ENERGY_PER_GAME: 1,
};
exports.GAME_CONSTANTS = {
    BASE_POINTS_PER_GAME: 0,
    SCORE_MULTIPLIER: 1.0,
    MAX_GAME_DURATION: 300,
};
exports.RANK_THRESHOLDS = {
    RANK1: 0,
    RANK2: 10000,
    RANK3: 25000,
    RANK4: 45000,
    RANK5: 60000,
    RANK6: 75000,
};
exports.RANK_ORDER = ['RANK1', 'RANK2', 'RANK3', 'RANK4', 'RANK5', 'RANK6'];
exports.RANK_REWARDS = {
    RANK1: 0,
    RANK2: 1000,
    RANK3: 2000,
    RANK4: 3000,
    RANK5: 4000,
    RANK6: 5000,
};
exports.DEFAULT_CYCLE = {
    cycleNumber: 1,
    growthRate: 0.8,
    maxSpeedCap: 8.0,
    isActive: true,
};
exports.BLOCKCHAIN_CONSTANTS = {
    MIN_CLAIM_AMOUNT: 1000,
    SIGNATURE_EXPIRY: 5 * 60 * 1000,
    MAX_NONCE_AGE: 24 * 60 * 60 * 1000,
    TREASURY_SEED: 'cedra_gamefi_treasury_v1',
    DECIMALS: 8,
    OCTAS_PER_CEDRA: 100000000,
};
exports.TIME_CONSTANTS = {
    HOUR_IN_MS: 60 * 60 * 1000,
    DAY_IN_MS: 24 * 60 * 60 * 1000,
    MINUTE_IN_MS: 60 * 1000,
};
exports.DATE_FORMAT = 'YYYY-MM-DD';
exports.ANTI_CHEAT = {
    MAX_FEEDS_PER_MINUTE: 30,
    MAX_GAMES_PER_MINUTE: 10,
    MIN_GAME_DURATION: 5,
};
//# sourceMappingURL=game.constants.js.map