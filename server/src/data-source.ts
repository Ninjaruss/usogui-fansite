import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    path.join(__dirname, 'entities', '**', '*.entity.{ts,js}'),
    path.join(__dirname, 'entities', 'translations', '*.entity.{ts,js}')
  ],
  migrations: [path.join(__dirname, 'migrations', '**', '*{.ts,.js}')],
  migrationsRun: false,
  synchronize: false,
  ssl: process.env.NODE_ENV === 'production'
});
