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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma.service");
const crypto_service_1 = require("./crypto.service");
let ApiKeysService = class ApiKeysService {
    constructor(prisma, cryptoService) {
        this.prisma = prisma;
        this.cryptoService = cryptoService;
    }
    async create(userId, createDto) {
        // Validate API key format
        this.validateApiKeyFormat(createDto.provider, createDto.user_api_key_raw_value);
        // Check for duplicates
        const existing = await this.prisma.apiKey.findFirst({
            where: {
                userId,
                provider: createDto.provider,
                user_api_key_display_name: createDto.user_api_key_display_name,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`API key with name "${createDto.user_api_key_display_name}" for ${createDto.provider} already exists`);
        }
        // Encrypt the API key
        const encryptedKey = await this.cryptoService.encrypt(createDto.user_api_key_raw_value);
        const apiKey = await this.prisma.apiKey.create({
            data: {
                userId,
                provider: createDto.provider,
                user_api_key_encrypted_value: encryptedKey,
                user_api_key_display_name: createDto.user_api_key_display_name,
                user_api_key_environment: createDto.user_api_key_environment || 'production',
                expiresAt: createDto.expiresAt,
                permissions: createDto.permissions || [],
            },
        });
        return this.toResponse(apiKey);
    }
    async findAllByUser(userId) {
        const apiKeys = await this.prisma.apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return apiKeys.map(key => this.toResponse(key));
    }
    async findByProvider(userId, provider) {
        const apiKeys = await this.prisma.apiKey.findMany({
            where: {
                userId,
                provider,
                isActive: true
            },
            orderBy: { createdAt: 'desc' },
        });
        return apiKeys.map(key => this.toResponse(key));
    }
    async findActiveByProvider(userId, provider) {
        const apiKey = await this.prisma.apiKey.findFirst({
            where: {
                userId,
                provider,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { testedAt: 'desc' }, // Prefer recently tested keys
        });
        if (!apiKey) {
            return null;
        }
        return await this.cryptoService.decrypt(apiKey.user_api_key_encrypted_value);
    }
    async update(userId, id, updateDto) {
        const existing = await this.prisma.apiKey.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('API key not found');
        }
        // Check for name conflicts if updating display name
        if (updateDto.user_api_key_display_name && updateDto.user_api_key_display_name !== existing.user_api_key_display_name) {
            const nameConflict = await this.prisma.apiKey.findFirst({
                where: {
                    userId,
                    provider: existing.provider,
                    user_api_key_display_name: updateDto.user_api_key_display_name,
                    id: { not: id },
                },
            });
            if (nameConflict) {
                throw new common_1.BadRequestException(`API key with name "${updateDto.user_api_key_display_name}" already exists for this provider`);
            }
        }
        const updated = await this.prisma.apiKey.update({
            where: { id },
            data: {
                user_api_key_display_name: updateDto.user_api_key_display_name,
                user_api_key_environment: updateDto.user_api_key_environment,
                isActive: updateDto.isActive,
                expiresAt: updateDto.expiresAt,
                permissions: updateDto.permissions,
                updatedAt: new Date(),
            },
        });
        return this.toResponse(updated);
    }
    async delete(userId, id) {
        const existing = await this.prisma.apiKey.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('API key not found');
        }
        await this.prisma.apiKey.delete({
            where: { id },
        });
    }
    async testConnection(userId, id) {
        const apiKey = await this.prisma.apiKey.findFirst({
            where: { id, userId },
        });
        if (!apiKey) {
            throw new common_1.NotFoundException('API key not found');
        }
        const decryptedKey = await this.cryptoService.decrypt(apiKey.user_api_key_encrypted_value);
        const result = await this.performApiTest(apiKey.provider, decryptedKey);
        // Update the test results
        await this.prisma.apiKey.update({
            where: { id },
            data: {
                testedAt: new Date(),
                testResult: result.success ? 'success' : 'invalid',
                rateLimitInfo: result.rateLimitInfo,
            },
        });
        return result;
    }
    async performApiTest(provider, apiKey) {
        try {
            switch (provider) {
                case 'ALPHA_VANTAGE':
                    return await this.testAlphaVantage(apiKey);
                case 'COINGECKO':
                    return await this.testCoinGecko(apiKey);
                case 'TWELVE_DATA':
                    return await this.testTwelveData(apiKey);
                case 'POLYGON_IO':
                    return await this.testPolygon(apiKey);
                case 'TRADING212':
                    return await this.testTrading212(apiKey);
                default:
                    return {
                        success: false,
                        provider,
                        message: 'Provider not supported for testing',
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                provider,
                message: `Test failed: ${error.message}`,
            };
        }
    }
    async testAlphaVantage(apiKey) {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data['Error Message']) {
            return {
                success: false,
                provider: 'ALPHA_VANTAGE',
                message: 'Invalid API key or exceeded rate limit',
            };
        }
        return {
            success: true,
            provider: 'ALPHA_VANTAGE',
            message: 'Connection successful',
            permissions: ['real-time', 'historical'],
            rateLimitInfo: {
                dailyLimit: 25,
                remainingCalls: 25, // Would need to track this
            },
        };
    }
    async testCoinGecko(apiKey) {
        const url = `https://api.coingecko.com/api/v3/ping`;
        const response = await fetch(url, {
            headers: { 'x-cg-demo-api-key': apiKey },
        });
        if (!response.ok) {
            return {
                success: false,
                provider: 'COINGECKO',
                message: 'Invalid API key',
            };
        }
        return {
            success: true,
            provider: 'COINGECKO',
            message: 'Connection successful',
            permissions: ['crypto-prices', 'market-data'],
        };
    }
    async testTwelveData(apiKey) {
        const url = `https://api.twelvedata.com/stocks?apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'error') {
            return {
                success: false,
                provider: 'TWELVE_DATA',
                message: data.message || 'Invalid API key',
            };
        }
        return {
            success: true,
            provider: 'TWELVE_DATA',
            message: 'Connection successful',
            permissions: ['stocks', 'forex', 'crypto'],
        };
    }
    async testPolygon(apiKey) {
        const url = `https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apikey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            return {
                success: false,
                provider: 'POLYGON_IO',
                message: 'Invalid API key or insufficient permissions',
            };
        }
        return {
            success: true,
            provider: 'POLYGON_IO',
            message: 'Connection successful',
            permissions: ['stocks', 'options', 'forex'],
        };
    }
    async testTrading212(apiKey) {
        // Trading212 API testing would go here
        // This is a placeholder as Trading212 API details would need to be researched
        return {
            success: true,
            provider: 'TRADING212',
            message: 'Trading212 API testing not yet implemented',
            permissions: ['account-info', 'trading'],
        };
    }
    validateApiKeyFormat(provider, key) {
        const patterns = {
            ALPHA_VANTAGE: /^[A-Z0-9]{16}$/,
            COINGECKO: /^CG-[a-zA-Z0-9-_]{20,}$/,
            TWELVE_DATA: /^[a-f0-9]{32}$/,
            POLYGON_IO: /^[a-zA-Z0-9_]{32}$/,
            COINMARKETCAP: /^[a-f0-9-]{36}$/,
            BINANCE: /^[a-zA-Z0-9]{64}$/,
            TRADING212: /^[a-zA-Z0-9-_]{20,}$/, // Placeholder pattern
        };
        const pattern = patterns[provider];
        if (pattern && !pattern.test(key)) {
            throw new common_1.BadRequestException(`Invalid API key format for ${provider}. Please check your key and try again.`);
        }
    }
    toResponse(apiKey) {
        // Mask the API key for display (show first 4 and last 4 characters)
        const maskedKey = this.maskApiKey(apiKey.user_api_key_encrypted_value);
        return {
            id: apiKey.id,
            provider: apiKey.provider,
            user_api_key_display_name: apiKey.user_api_key_display_name,
            user_api_key_environment: apiKey.user_api_key_environment,
            user_api_key_masked_value: maskedKey,
            isActive: apiKey.isActive,
            testedAt: apiKey.testedAt,
            testResult: apiKey.testResult,
            createdAt: apiKey.createdAt,
            expiresAt: apiKey.expiresAt,
            permissions: apiKey.permissions || [],
            rateLimitInfo: apiKey.rateLimitInfo,
        };
    }
    maskApiKey(encryptedKey) {
        if (encryptedKey.length <= 8) {
            return '*'.repeat(encryptedKey.length);
        }
        return encryptedKey.substring(0, 4) + '*'.repeat(encryptedKey.length - 8) + encryptedKey.substring(encryptedKey.length - 4);
    }
};
exports.ApiKeysService = ApiKeysService;
exports.ApiKeysService = ApiKeysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService])
], ApiKeysService);
