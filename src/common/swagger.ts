import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
    const config = new DocumentBuilder()
        .setTitle('Wallet Service')
        .setDescription('The Wallet Service API description')
        .setVersion('1.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'JWT-auth',
        )
        .addApiKey(
            {
                type: 'apiKey',
                name: 'x-api-key',
                in: 'header',
                description: 'Enter your API Key here (sk_live_...)'
            },
            'API-Key-auth',
        )
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
