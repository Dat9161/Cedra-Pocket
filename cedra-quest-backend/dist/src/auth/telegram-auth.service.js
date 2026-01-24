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
var TelegramAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let TelegramAuthService = TelegramAuthService_1 = class TelegramAuthService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TelegramAuthService_1.name);
        this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
        const isDevelopment = process.env.NODE_ENV !== 'production';
        if (!this.botToken || this.botToken === 'YOUR_REAL_BOT_TOKEN_HERE') {
            if (isDevelopment) {
                this.logger.warn('⚠️  TELEGRAM_BOT_TOKEN not configured - using development mode');
                this.logger.warn('🚧 Telegram signature validation will be bypassed for testing');
                this.botToken = 'development_mode';
            }
            else {
                this.logger.error('❌ TELEGRAM_BOT_TOKEN not configured properly in production');
                this.logger.error('📋 Please follow HOW_TO_GET_REAL_INITDATA.md to set up real Telegram authentication');
                throw new Error('TELEGRAM_BOT_TOKEN is required in production. Please check .env file and HOW_TO_GET_REAL_INITDATA.md');
            }
        }
    }
    async validateTelegramInitData(initData) {
        try {
            this.logger.debug('Validating Telegram initData...');
            const parsed = this.parseInitData(initData);
            this.logger.debug(`Parsed user ID: ${parsed.telegram_id}, username: ${parsed.username}`);
            const isDevelopment = process.env.NODE_ENV !== 'production';
            if (isDevelopment) {
                this.logger.warn('🚧 Development mode: Bypassing Telegram signature validation');
                this.logger.warn('⚠️  In production, real Telegram signature validation will be enforced');
                const user = {
                    id: parsed.telegram_id,
                    username: parsed.username,
                    first_name: parsed.first_name,
                    last_name: parsed.last_name,
                };
                this.logger.log(`Development user validated: ${user.id} (${user.username || user.first_name})`);
                return user;
            }
            if (!this.validateSignature(initData, parsed.hash)) {
                this.logger.warn('Telegram signature validation failed');
                throw new common_1.UnauthorizedException('Invalid Telegram signature');
            }
            this.logger.debug('Telegram signature validated successfully');
            const authDate = new Date(parsed.auth_date * 1000);
            const now = new Date();
            const timeDiff = now.getTime() - authDate.getTime();
            const maxAge = 5 * 60 * 1000;
            if (timeDiff > maxAge) {
                this.logger.warn(`Telegram auth data is too old: ${timeDiff}ms > ${maxAge}ms`);
                throw new common_1.UnauthorizedException('Telegram auth data is too old');
            }
            this.logger.debug(`Telegram auth data age: ${timeDiff}ms (valid)`);
            const user = {
                id: parsed.telegram_id,
                username: parsed.username,
                first_name: parsed.first_name,
                last_name: parsed.last_name,
            };
            this.logger.log(`Successfully validated Telegram user: ${user.id} (${user.username || user.first_name})`);
            return user;
        }
        catch (error) {
            this.logger.error('Failed to validate Telegram initData', error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid Telegram authentication data');
        }
    }
    parseInitData(initData) {
        const isDevelopment = process.env.NODE_ENV !== 'production';
        if (isDevelopment && (!initData || initData === 'test' || initData.length < 10)) {
            this.logger.warn('🚧 Development mode: Using mock user data for testing');
            return {
                telegram_id: '123456789',
                username: 'testuser',
                first_name: 'Test',
                last_name: 'User',
                auth_date: Math.floor(Date.now() / 1000),
                hash: 'mock_hash',
                query_id: 'mock_query_id',
            };
        }
        try {
            const params = new URLSearchParams(initData);
            const userStr = params.get('user');
            if (!userStr) {
                if (isDevelopment) {
                    this.logger.warn('🚧 Development mode: No user data found, using mock data');
                    return {
                        telegram_id: '123456789',
                        username: 'testuser',
                        first_name: 'Test',
                        last_name: 'User',
                        auth_date: Math.floor(Date.now() / 1000),
                        hash: 'mock_hash',
                        query_id: 'mock_query_id',
                    };
                }
                throw new Error('User data not found in initData');
            }
            let userData;
            try {
                userData = JSON.parse(userStr);
            }
            catch (error) {
                if (isDevelopment) {
                    this.logger.warn('🚧 Development mode: Invalid user data format, using mock data');
                    return {
                        telegram_id: '123456789',
                        username: 'testuser',
                        first_name: 'Test',
                        last_name: 'User',
                        auth_date: Math.floor(Date.now() / 1000),
                        hash: 'mock_hash',
                        query_id: 'mock_query_id',
                    };
                }
                throw new Error('Invalid user data format');
            }
            const authDate = params.get('auth_date');
            const hash = params.get('hash');
            if (!authDate || !hash) {
                if (isDevelopment) {
                    this.logger.warn('🚧 Development mode: Missing auth parameters, using current time and mock hash');
                    return {
                        telegram_id: userData.id?.toString() || '123456789',
                        username: userData.username || 'testuser',
                        first_name: userData.first_name || 'Test',
                        last_name: userData.last_name || 'User',
                        auth_date: Math.floor(Date.now() / 1000),
                        hash: 'mock_hash',
                        query_id: 'mock_query_id',
                    };
                }
                throw new Error('Missing required auth parameters');
            }
            return {
                telegram_id: userData.id?.toString(),
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name,
                auth_date: parseInt(authDate),
                hash: hash,
                query_id: params.get('query_id'),
            };
        }
        catch (error) {
            if (isDevelopment) {
                this.logger.warn('🚧 Development mode: Parse error, falling back to mock data');
                return {
                    telegram_id: '123456789',
                    username: 'testuser',
                    first_name: 'Test',
                    last_name: 'User',
                    auth_date: Math.floor(Date.now() / 1000),
                    hash: 'mock_hash',
                    query_id: 'mock_query_id',
                };
            }
            throw error;
        }
    }
    validateSignature(initData, hash) {
        try {
            const params = new URLSearchParams(initData);
            params.delete('hash');
            const sortedParams = Array.from(params.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = crypto
                .createHmac('sha256', 'WebAppData')
                .update(this.botToken)
                .digest();
            const expectedHash = crypto
                .createHmac('sha256', secretKey)
                .update(sortedParams)
                .digest('hex');
            return expectedHash === hash;
        }
        catch (error) {
            this.logger.error('Error validating signature', error);
            return false;
        }
    }
};
exports.TelegramAuthService = TelegramAuthService;
exports.TelegramAuthService = TelegramAuthService = TelegramAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelegramAuthService);
//# sourceMappingURL=telegram-auth.service.js.map