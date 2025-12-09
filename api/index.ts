import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let app;

export default async function handler(req, res) {
    if (!app) {
        app = await NestFactory.create(AppModule);
        app.enableCors(); 
        await app.init();
    }
    const instance = app.getHttpAdapter().getInstance();

    instance(req, res);
}
