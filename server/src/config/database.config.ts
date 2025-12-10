import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { LoggerOptions } from 'typeorm';

export const getDatabaseConfig = (configService: ConfigService) => {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const isDevelopment = nodeEnv === 'development';
  const isTest = nodeEnv === 'test';

  // Define the logging levels
  const loggingOptions: LoggerOptions = isDevelopment
    ? ['query', 'error']
    : ['error'];

  return {
    type: 'postgres' as const,
    host: configService.get<string>('DATABASE_HOST'),
    port: parseInt(configService.get<string>('DATABASE_PORT') || '5432'),
    username: configService.get<string>('DATABASE_USERNAME'),
    password: configService.get<string>('DATABASE_PASSWORD'),
    database: configService.get<string>('DATABASE_NAME'),
    entities: [
      path.join(__dirname, '..', 'entities', '**', '*.entity.{ts,js}'),
      path.join(
        __dirname,
        '..',
        'entities',
        'translations',
        '*.entity.{ts,js}',
      ),
    ],
    migrations: [path.join(__dirname, '..', 'migrations', '**', '*{.ts,.js}')],
    migrationsRun: configService.get('RUN_MIGRATIONS') === 'true',
    // Only enable synchronize in development or test environments
    synchronize:
      (isDevelopment || isTest) &&
      configService.get('ENABLE_SCHEMA_SYNC') === 'true',
    // Ensure schema sync is never run if migrations exist - additional safety
    migrationsTransactionMode: 'all' as const,
    ssl: nodeEnv === 'production',
    logging: loggingOptions,
    // Add auto retry on lost connections
    retryAttempts: 5,
    retryDelay: 3000,
  };
};
