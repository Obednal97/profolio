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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/prisma.service");
const bcrypt_1 = require("bcrypt");
const jsonwebtoken_1 = require("jsonwebtoken");
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async signup(email, password, name) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await (0, bcrypt_1.hash)(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });
        const token = (0, jsonwebtoken_1.sign)({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { token };
    }
    async signin(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !(await (0, bcrypt_1.compare)(password, user.password))) {
            throw new Error('Invalid credentials');
        }
        const token = (0, jsonwebtoken_1.sign)({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { token };
    }
    signout() {
        return { message: 'Signed out successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
