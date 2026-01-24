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
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserService = UserService_1 = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UserService_1.name);
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
        try {
            return BigInt(userId);
        }
        catch (error) {
            this.logger.error(`Failed to convert userId to BigInt: ${userId}`, error);
            return BigInt('123456789');
        }
    }
    async createUser(userData) {
        try {
            this.logger.log(`🆕 Creating new user: telegram_id=${userData.telegram_id}, username=${userData.username}`);
            let walletAddress = userData.wallet_address;
            let publicKey = userData.public_key;
            let isWalletConnected = false;
            if (!walletAddress) {
                const baseName = userData.username || userData.first_name || `user${userData.telegram_id}`;
                const cleanName = this.cleanWalletName(baseName);
                walletAddress = `${cleanName}.hot.tg`;
                publicKey = `pk_${userData.telegram_id}_${Date.now()}`;
                isWalletConnected = true;
                this.logger.log(`🔑 Generated wallet: ${walletAddress}`);
            }
            const displayName = userData.username ||
                (userData.first_name && userData.last_name ?
                    `${userData.first_name} ${userData.last_name}` :
                    userData.first_name) ||
                `User${userData.telegram_id}`;
            const user = await this.prisma.users.create({
                data: {
                    telegram_id: this.safeToBigInt(userData.telegram_id),
                    wallet_address: walletAddress,
                    public_key: publicKey,
                    username: displayName,
                    username_at_creation: userData.username || null,
                    total_points: userData.total_points || 0,
                    lifetime_points: userData.total_points || 0,
                    current_rank: 'BRONZE',
                    level: 1,
                    current_xp: 0,
                    is_wallet_connected: isWalletConnected,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                select: {
                    telegram_id: true,
                    wallet_address: true,
                    username: true,
                    username_at_creation: true,
                    total_points: true,
                    lifetime_points: true,
                    level: true,
                    current_xp: true,
                    current_rank: true,
                    is_wallet_connected: true,
                    created_at: true,
                },
            });
            this.logger.log(`✅ User created successfully: ${user.telegram_id.toString()} with wallet ${user.wallet_address}`);
            return {
                telegram_id: user.telegram_id.toString(),
                wallet_address: user.wallet_address,
                username: user.username,
                total_points: Number(user.total_points),
                level: user.level,
                current_xp: user.current_xp,
                current_rank: user.current_rank,
                created_at: user.created_at,
            };
        }
        catch (error) {
            this.logger.error(`❌ Failed to create user: ${userData.telegram_id}`, error);
            throw error;
        }
    }
    cleanWalletName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 15) || 'user';
    }
    async findUserByTelegramId(telegramId) {
        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    telegram_id: this.safeToBigInt(telegramId),
                },
                select: {
                    telegram_id: true,
                    wallet_address: true,
                    username: true,
                    total_points: true,
                    level: true,
                    current_xp: true,
                    current_rank: true,
                    created_at: true,
                },
            });
            if (!user) {
                return null;
            }
            return {
                telegram_id: user.telegram_id.toString(),
                wallet_address: user.wallet_address,
                username: user.username,
                total_points: Number(user.total_points),
                level: user.level,
                current_xp: user.current_xp,
                current_rank: user.current_rank,
                created_at: user.created_at,
            };
        }
        catch (error) {
            this.logger.error(`Failed to find user by Telegram ID: ${telegramId}`, error);
            throw error;
        }
    }
    async getUserProfile(telegramId) {
        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    telegram_id: this.safeToBigInt(telegramId),
                },
                include: {
                    pet: true,
                },
            });
            if (!user) {
                return null;
            }
            return {
                telegram_id: user.telegram_id.toString(),
                wallet_address: user.wallet_address,
                username: user.username,
                total_points: Number(user.total_points),
                level: user.level,
                current_xp: user.current_xp,
                current_rank: user.current_rank,
                created_at: user.created_at,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get user profile: ${telegramId}`, error);
            throw error;
        }
    }
    async checkWalletAddressExists(walletAddress) {
        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    wallet_address: walletAddress,
                },
                select: {
                    telegram_id: true,
                },
            });
            return !!user;
        }
        catch (error) {
            this.logger.error(`Failed to check wallet address: ${walletAddress}`, error);
            throw error;
        }
    }
    async addPoints(telegramId, points) {
        try {
            this.logger.log(`💰 Adding ${points} points to user: ${telegramId}`);
            let user = await this.prisma.users.findUnique({
                where: {
                    telegram_id: this.safeToBigInt(telegramId),
                },
            });
            if (!user) {
                this.logger.log(`🆕 User not found, creating new user: ${telegramId}`);
                const newUser = await this.createUser({
                    telegram_id: telegramId,
                    username: `user_${telegramId}`,
                    total_points: Math.max(0, points),
                });
                return newUser;
            }
            const newTotalPoints = Math.max(0, Number(user.total_points) + points);
            const newLifetimePoints = Math.max(Number(user.lifetime_points || 0), newTotalPoints);
            const updatedUser = await this.prisma.users.update({
                where: {
                    telegram_id: this.safeToBigInt(telegramId),
                },
                data: {
                    total_points: newTotalPoints,
                    lifetime_points: newLifetimePoints,
                    updated_at: new Date(),
                },
                select: {
                    telegram_id: true,
                    wallet_address: true,
                    username: true,
                    total_points: true,
                    lifetime_points: true,
                    level: true,
                    current_xp: true,
                    current_rank: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            this.logger.log(`✅ Points updated: ${user.total_points} → ${updatedUser.total_points}`);
            return {
                telegram_id: updatedUser.telegram_id.toString(),
                wallet_address: updatedUser.wallet_address,
                username: updatedUser.username,
                total_points: Number(updatedUser.total_points),
                level: updatedUser.level,
                current_xp: updatedUser.current_xp,
                current_rank: updatedUser.current_rank,
                created_at: updatedUser.created_at,
            };
        }
        catch (error) {
            this.logger.error(`❌ Failed to add points to user: ${telegramId}`, error);
            throw error;
        }
    }
    async findUserByPublicKey(publicKey) {
        try {
            const user = await this.prisma.users.findFirst({
                where: {
                    public_key: publicKey,
                },
                select: {
                    telegram_id: true,
                    wallet_address: true,
                    username: true,
                    total_points: true,
                    level: true,
                    current_xp: true,
                    current_rank: true,
                    created_at: true,
                },
            });
            if (!user) {
                return null;
            }
            return {
                telegram_id: user.telegram_id.toString(),
                wallet_address: user.wallet_address,
                username: user.username,
                total_points: Number(user.total_points),
                level: user.level,
                current_xp: user.current_xp,
                current_rank: user.current_rank,
                created_at: user.created_at,
            };
        }
        catch (error) {
            this.logger.error(`Failed to find user by public key`, error);
            throw error;
        }
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map