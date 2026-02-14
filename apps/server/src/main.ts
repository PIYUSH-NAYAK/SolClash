import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            credentials: true,
        },
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🚀 Clash Royale Server running on http://localhost:${port}`);
}

bootstrap();
