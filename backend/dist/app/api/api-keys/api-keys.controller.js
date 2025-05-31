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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_keys_service_1 = require("./api-keys.service");
let ApiKeysController = class ApiKeysController {
    constructor(apiKeysService) {
        this.apiKeysService = apiKeysService;
    }
    async createApiKey(createDto, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'demo-user-id';
        return this.apiKeysService.createApiKey(userId, createDto);
    }
    async findAllApiKeys(req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'demo-user-id';
        return this.apiKeysService.findAllByUser(userId);
    }
    async findByProvider(provider, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'demo-user-id';
        return this.apiKeysService.findByProvider(userId, provider);
    }
    async testApiKey(provider, body, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'demo-user-id';
        const isValid = await this.apiKeysService.testApiKey(userId, provider, body.apiKey);
        return { isValid };
    }
    async updateApiKey(id, updateDto, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'demo-user-id';
        return this.apiKeysService.updateApiKey(userId, id, updateDto);
    }
    async deleteApiKey(id, req) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'demo-user-id';
        await this.apiKeysService.deleteApiKey(userId, id);
        return { message: 'API key deleted successfully' };
    }
    async getProviderInfo() {
        return {
            providers: [
                {
                    id: 'ALPHA_VANTAGE',
                    name: 'Alpha Vantage',
                    description: 'Free stock, forex, and crypto data API',
                    website: 'https://www.alphavantage.co/',
                    signupUrl: 'https://www.alphavantage.co/support/#api-key',
                    docs: 'https://www.alphavantage.co/documentation/',
                    rateLimit: '25 requests/day (free tier)',
                    supports: ['stocks', 'forex', 'crypto', 'technical indicators']
                },
                {
                    id: 'COINGECKO',
                    name: 'CoinGecko',
                    description: 'Comprehensive cryptocurrency data API',
                    website: 'https://www.coingecko.com/',
                    signupUrl: 'https://www.coingecko.com/en/api/pricing',
                    docs: 'https://www.coingecko.com/en/api/documentation',
                    rateLimit: '30 calls/minute (free tier)',
                    supports: ['crypto', 'market data', 'historical data']
                },
                {
                    id: 'TWELVE_DATA',
                    name: 'Twelve Data',
                    description: 'Stock market data API with real-time and historical data',
                    website: 'https://twelvedata.com/',
                    signupUrl: 'https://twelvedata.com/pricing',
                    docs: 'https://twelvedata.com/docs',
                    rateLimit: '800 requests/day (free tier)',
                    supports: ['stocks', 'forex', 'crypto', 'technical indicators']
                },
                {
                    id: 'POLYGON_IO',
                    name: 'Polygon.io',
                    description: 'Real-time and historical market data',
                    website: 'https://polygon.io/',
                    signupUrl: 'https://polygon.io/pricing',
                    docs: 'https://polygon.io/docs',
                    rateLimit: '5 calls/minute (free tier)',
                    supports: ['stocks', 'options', 'forex', 'crypto']
                }
            ]
        };
    }
};
exports.ApiKeysController = ApiKeysController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new API key' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'API key created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "createApiKey", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all API keys for user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API keys retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "findAllApiKeys", null);
__decorate([
    (0, common_1.Get)('provider/:provider'),
    (0, swagger_1.ApiOperation)({ summary: 'Get API keys by provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API keys retrieved successfully' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "findByProvider", null);
__decorate([
    (0, common_1.Post)('test/:provider'),
    (0, swagger_1.ApiOperation)({ summary: 'Test an API key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key test result' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "testApiKey", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an API key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "updateApiKey", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an API key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "deleteApiKey", null);
__decorate([
    (0, common_1.Get)('providers/info'),
    (0, swagger_1.ApiOperation)({ summary: 'Get information about supported API providers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider information retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "getProviderInfo", null);
exports.ApiKeysController = ApiKeysController = __decorate([
    (0, swagger_1.ApiTags)('api-keys'),
    (0, common_1.Controller)('api-keys'),
    __metadata("design:paramtypes", [api_keys_service_1.ApiKeysService])
], ApiKeysController);
