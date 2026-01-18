import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        // Enable raw body for Stripe webhook verification
        rawBody: true,
    });

    // Raw body middleware for Stripe webhooks
    app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:3000',
            'http://localhost:3002',
            'http://127.0.0.1:3002',
            'http://localhost:3003',
            'http://127.0.0.1:3003',
            // Allow ngrok/tunnel origins if user uses them
            /^https:\/\/.*\.ngrok-free\.app$/,
            /^https:\/\/.*\.ngrok\.io$/,
            // Production domains
            /^https:\/\/.*\.centri\.ai$/,
            /^https:\/\/.*\.vercel\.app$/,
        ],
        credentials: true,
    });

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    const config = new DocumentBuilder()
        .setTitle('Centri.ai API')
        .setDescription('API for Centri.ai Dashboard')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`API is running on http://localhost:${port}`);
}
bootstrap();
