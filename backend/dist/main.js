"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("./common/prisma.service");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Enable CORS
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? ['http://192.168.1.27:3001']
            : true,
    });
    // Apply security headers
    app.use((0, helmet_1.default)());
    // Global validation
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // Global prefix
    app.setGlobalPrefix('api');
    // Swagger setup
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Profolio API')
        .setDescription('API for managing users, assets, and liabilities')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    // Graceful shutdown for Prisma
    const prismaService = app.get(prisma_service_1.PrismaService);
    await prismaService.enableShutdownHooks(app);
    await app.listen(3000, '0.0.0.0');
}
bootstrap();
