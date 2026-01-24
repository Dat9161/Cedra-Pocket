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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const telegram_auth_service_1 = require("./telegram-auth.service");
const user_service_1 = require("../user/user.service");
const wallet_name_service_1 = require("../wallet/wallet-name.service");
const wallet_service_1 = require("../wallet/wallet.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(telegramAuthService, userService, walletNameService, walletService) {
        this.telegramAuthService = telegramAuthService;
        this.userService = userService;
        this.walletNameService = walletNameService;
        this.walletService = walletService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async verifyAndCreateUser(initData) {
        try {
            this.logger.log('🔍 Starting user verification and creation process');
            this.logger.log('📱 Validating Telegram initData...');
            const telegramUser = await this.telegramAuthService.validateTelegramInitData(initData);
            this.logger.log(`✅ Telegram user validated: ID=${telegramUser.id}, username=${telegramUser.username || telegramUser.first_name}`);
            this.logger.log(`🔍 Checking if user exists in database: ${telegramUser.id}`);
            let existingUser = await this.userService.findUserByTelegramId(telegramUser.id);
            if (existingUser) {
                this.logger.log(`✅ Existing user found: ${telegramUser.id}`);
                return {
                    success: true,
                    user: existingUser,
                };
            }
            else {
                this.logger.log(`🆕 New user detected, creating account: ${telegramUser.id}`);
                try {
                    const newUser = await this.userService.createUser({
                        telegram_id: String(telegramUser.id),
                        username: telegramUser.username,
                        first_name: telegramUser.first_name,
                        last_name: telegramUser.last_name,
                        total_points: 0,
                        current_rank: 'RANK1',
                    });
                    this.logger.log(`✅ New user created successfully: ${newUser.telegram_id}`);
                    return {
                        success: true,
                        user: newUser,
                    };
                }
                catch (createError) {
                    this.logger.error('❌ Failed to auto-create user', createError);
                    return {
                        success: false,
                        error: 'Failed to create user account',
                    };
                }
            }
        }
        catch (error) {
            this.logger.error('❌ Authentication failed', error);
            return {
                success: false,
                error: error.message || 'Authentication failed',
            };
        }
    }
    async authenticateUser(initData) {
        try {
            const telegramUser = await this.telegramAuthService.validateTelegramInitData(initData);
            const existingUser = await this.userService.findUserByTelegramId(telegramUser.id);
            if (existingUser) {
                this.logger.log(`Existing user login: ${telegramUser.id}`);
                return {
                    success: true,
                    user: existingUser,
                };
            }
            else {
                this.logger.log(`New user registration: ${telegramUser.id}`);
                const suggestedWalletName = await this.walletNameService.generateSuggestedWalletName(telegramUser);
                return {
                    success: true,
                    suggestedWalletName,
                };
            }
        }
        catch (error) {
            this.logger.error('Authentication failed', error);
            return {
                success: false,
                error: error.message || 'Authentication failed',
            };
        }
    }
    async createWallet(walletData) {
        try {
            if (!this.walletNameService.validateWalletNameFormat(walletData.requested_address)) {
                return {
                    success: false,
                    error: 'Invalid wallet name format',
                };
            }
            const isTaken = await this.walletNameService.isWalletNameTaken(walletData.requested_address);
            if (isTaken) {
                return {
                    success: false,
                    error: 'Wallet name is no longer available',
                };
            }
            const blockchainResult = {
                success: true,
                transaction_hash: `0x${Date.now().toString(16)}`,
            };
            if (!blockchainResult.success) {
                return {
                    success: false,
                    error: 'Failed to create wallet on blockchain',
                };
            }
            const dbResult = await this.walletService.createUserWallet({
                telegram_id: walletData.telegram_id,
                requested_address: walletData.requested_address,
                public_key: walletData.public_key,
            });
            if (!dbResult.success) {
                return dbResult;
            }
            this.logger.log(`Wallet created successfully for user: ${walletData.telegram_id}`);
            return {
                success: true,
                wallet_address: walletData.requested_address,
                transaction_hash: blockchainResult.transaction_hash,
            };
        }
        catch (error) {
            this.logger.error('Wallet creation failed', error);
            return {
                success: false,
                error: 'Wallet creation failed',
            };
        }
    }
    async recoverWallet(recoveryData) {
        try {
            const user = await this.userService.findUserByPublicKey(recoveryData.public_key);
            if (!user) {
                return {
                    success: false,
                    error: 'No wallet found for this public key',
                };
            }
            this.logger.log(`Wallet recovered for user: ${user.telegram_id}`);
            return {
                success: true,
                user,
            };
        }
        catch (error) {
            this.logger.error('Wallet recovery failed', error);
            return {
                success: false,
                error: 'Wallet recovery failed',
            };
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [telegram_auth_service_1.TelegramAuthService,
        user_service_1.UserService,
        wallet_name_service_1.WalletNameService,
        wallet_service_1.WalletService])
], AuthService);
//# sourceMappingURL=auth.service.js.map