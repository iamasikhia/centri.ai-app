import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:3000',
            'http://localhost:3002',
            'http://127.0.0.1:3002',
            // Allow ngrok/tunnel origins if user uses them
            /^https:\/\/.*\.ngrok-free\.app$/,
            /^https:\/\/.*\.ngrok\.io$/
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

    await app.listen(3001);
    console.log('API is running on http://localhost:3001');
}
bootstrap();
