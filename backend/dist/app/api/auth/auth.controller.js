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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const bcrypt_1 = require("bcrypt");
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma_service_1 = require("../../../common/prisma.service");
const auth_guard_1 = require("./guards/auth.guard"); // adjust path as needed
let AuthController = class AuthController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async signup(body) {
        var _a;
        const existingUser = await this.prisma.user.findUnique({
            where: { email: body.email },
        });
        if (existingUser) {
            return { error: 'User already exists' };
        }
        const hashedPassword = await (0, bcrypt_1.hash)(body.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: body.email,
                password: hashedPassword,
                name: (_a = body.name) !== null && _a !== void 0 ? _a : null,
            },
            select: {
                id: true,
                email: true,
            },
        });
        const token = (0, jsonwebtoken_1.sign)({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { token };
    }
    async signin(body) {
        const user = await this.prisma.user.findUnique({
            where: { email: body.email },
        });
        if (!user)
            return { error: 'Invalid credentials' };
        const validPassword = await (0, bcrypt_1.compare)(body.password, user.password);
        if (!validPassword)
            return { error: 'Invalid credentials' };
        const token = (0, jsonwebtoken_1.sign)({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { token };
    }
    signout(res) {
        res.clearCookie('token', { path: '/' });
        return { message: 'Signed out successfully' };
    }
    getUser(req) {
        var _a;
        return {
            id: req.user.id,
            email: req.user.email,
            name: (_a = req.user.name) !== null && _a !== void 0 ? _a : null,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('signin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signin", null);
__decorate([
    (0, common_1.Post)('signout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signout", null);
__decorate([
    (0, common_1.Get)('user'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getUser", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthController);
