import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { validate } from './config/env.validation';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

dotenv.config();
const validatedConfig = validate(process.env);
const configService = new ConfigService(validatedConfig);

// Create DB config manually to avoid TypeScript errors
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: [
    path.join(__dirname, 'entities', '**', '*.entity.{ts,js}'),
    path.join(__dirname, 'entities', 'translations', '*.entity.{ts,js}'),
  ],
  migrations: [path.join(__dirname, 'migrations', '**', '*{.ts,.js}')],
  migrationsTransactionMode: 'all',
  synchronize: false, // Don't enable synchronize in direct data source
  logging: ['error'],
});
