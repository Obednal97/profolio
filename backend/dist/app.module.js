"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const users_module_1 = require("./app/api/admin/users/users.module");
const prisma_service_1 = require("./common/prisma.service");
const settings_module_1 = require("./app/api/settings/settings.module");
const assets_module_1 = require("./app/api/assets/assets.module");
const api_keys_module_1 = require("./app/api/api-keys/api-keys.module");
const market_data_module_1 = require("./app/api/market-data/market-data.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            settings_module_1.SettingsModule,
            users_module_1.UsersModule,
            assets_module_1.AssetsModule,
            api_keys_module_1.ApiKeysModule,
            market_data_module_1.MarketDataModule,
        ],
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], AppModule);
