"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Enable CORS (adjust origins as needed)
    app.enableCors({
        origin: '*', // Change this to your frontend origin in production
    });
    // Global API prefix
    app.setGlobalPrefix('api');
    // Swagger setup
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Profolio API')
        .setDescription('API for managing users, assets, and liabilities')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(3000, '0.0.0.0');
}
bootstrap();
