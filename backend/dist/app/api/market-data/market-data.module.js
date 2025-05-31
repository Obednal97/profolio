"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataModule = void 0;
const common_1 = require("@nestjs/common");
const market_data_service_1 = require("./market-data.service");
const yahoo_finance_service_1 = require("./yahoo-finance.service");
const price_sync_service_1 = require("./price-sync.service");
const prisma_service_1 = require("../../../common/prisma.service");
const api_keys_module_1 = require("../api-keys/api-keys.module");
let MarketDataModule = class MarketDataModule {
};
exports.MarketDataModule = MarketDataModule;
exports.MarketDataModule = MarketDataModule = __decorate([
    (0, common_1.Module)({
        imports: [api_keys_module_1.ApiKeysModule],
        providers: [
            market_data_service_1.MarketDataService,
            yahoo_finance_service_1.YahooFinanceService,
            price_sync_service_1.PriceSyncService,
            prisma_service_1.PrismaService,
        ],
        exports: [
            market_data_service_1.MarketDataService,
            yahoo_finance_service_1.YahooFinanceService,
            price_sync_service_1.PriceSyncService,
        ],
    })
], MarketDataModule);
