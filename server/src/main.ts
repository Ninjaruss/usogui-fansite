import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // allows cross-origin requests (useful for frontend)
  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
}
bootstrap();
