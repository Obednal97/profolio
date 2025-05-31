"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeysModule = void 0;
const common_1 = require("@nestjs/common");
const api_keys_controller_1 = require("./api-keys.controller");
const api_keys_service_1 = require("./api-keys.service");
const prisma_service_1 = require("../../../common/prisma.service");
const crypto_service_1 = require("./crypto.service");
let ApiKeysModule = class ApiKeysModule {
};
exports.ApiKeysModule = ApiKeysModule;
exports.ApiKeysModule = ApiKeysModule = __decorate([
    (0, common_1.Module)({
        controllers: [api_keys_controller_1.ApiKeysController],
        providers: [api_keys_service_1.ApiKeysService, crypto_service_1.CryptoService, prisma_service_1.PrismaService],
        exports: [api_keys_service_1.ApiKeysService],
    })
], ApiKeysModule);
