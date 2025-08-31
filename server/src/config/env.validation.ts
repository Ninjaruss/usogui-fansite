import { plainToClass } from 'class-transformer';
import {
  IsString,
  IsNumber,
  validateSync,
  IsIn,
  IsUrl,
  IsBoolean,
  IsOptional,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES: string;

  @IsNumber()
  PORT: number;

  @IsString()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string;

  @IsString()
  RESEND_API_KEY: string;

  // Frontend URL for email links
  @IsUrl({
    require_tld: process.env.NODE_ENV === 'production',
    require_protocol: process.env.NODE_ENV === 'production',
    require_host: true,
    require_valid_protocol: true,
    protocols: ['http', 'https'],
  })
  FRONTEND_URL: string;

  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  RUN_MIGRATIONS?: string;

  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  ENABLE_SCHEMA_SYNC?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
