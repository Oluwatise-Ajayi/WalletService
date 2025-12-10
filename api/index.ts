import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/common/swagger';

let app;

export default async function handler(req, res) {
    if (!app) {
        app = await NestFactory.create(AppModule);
        app.enableCors(); // Don't forget CORS if main.ts had it
        setupSwagger(app);
        await app.init();
    }
    const instance = app.getHttpAdapter().getInstance();

    instance(req, res);
}
