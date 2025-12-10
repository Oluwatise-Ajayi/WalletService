import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
    const config = new DocumentBuilder()
        .setTitle('Wallet Service API')
        .setDescription('API documentation for the Wallet Service')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Auth')
        .addTag('Wallet')
        .addTag('Health')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
        customSiteTitle: 'Wallet Service Docs',
        customJs: [
            'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
            'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
        ],
        customCssUrl: [
            'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css',
        ],
    });
}
