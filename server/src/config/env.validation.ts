import { plainToClass } from 'class-transformer';
import {
  IsString,
  IsNumber,
  validateSync,
  IsIn,
  IsUrl,
  IsOptional,
} from 'class-validator';

class EnvironmentVariables {
  // --- Database Configuration ---
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
  @IsOptional()
  @IsIn(['true', 'false'])
  DATABASE_SSL?: string;

  // --- JWT Configuration ---
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES: string;

  // --- Server Configuration ---
  @IsNumber()
  PORT: number;

  @IsString()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string;

  // --- Email Service ---
  @IsString()
  RESEND_API_KEY: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM_ADDRESS?: string;

  // Frontend URL for email links
  @IsUrl({
    require_tld: process.env.NODE_ENV === 'production',
    require_protocol: process.env.NODE_ENV === 'production',
    require_host: true,
    require_valid_protocol: true,
    protocols: ['http', 'https'],
  })
  FRONTEND_URL: string;

  // --- Fluxer OAuth2 Configuration ---
  // SECURITY: Required for Fluxer authentication to work
  @IsString()
  FLUXER_CLIENT_ID: string;

  @IsString()
  FLUXER_CLIENT_SECRET: string;

  @IsString()
  @IsUrl({
    require_tld: process.env.NODE_ENV === 'production',
    require_protocol: true,
    require_host: true,
    protocols: ['http', 'https'],
  })
  FLUXER_CALLBACK_URL: string;

  // Fluxer user ID for initial admin access
  @IsString()
  @IsOptional()
  ADMIN_FLUXER_ID?: string;

  // --- Fluxer Chat Bot ---
  @IsString()
  FLUXER_BOT_TOKEN: string;

  @IsString()
  FLUXER_CHAT_CHANNEL_ID: string;

  // --- Cloudflare R2 Storage ---
  // SECURITY: Required for media uploads to work
  @IsString()
  R2_ACCOUNT_ID: string;

  @IsString()
  R2_ACCESS_KEY_ID: string;

  @IsString()
  R2_SECRET_ACCESS_KEY: string;

  @IsString()
  R2_BUCKET_NAME: string;

  @IsString()
  R2_PUBLIC_URL: string;

  // --- Database Migration Controls ---
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  RUN_MIGRATIONS?: string;

  // WARNING: Schema sync can modify your database! Use 'false' in production.
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  ENABLE_SCHEMA_SYNC?: string;

  // --- Optional Integrations ---
  @IsString()
  @IsOptional()
  KOFI_WEBHOOK_TOKEN?: string;

  @IsString()
  @IsOptional()
  CORS_ALLOWED_ORIGINS?: string;

  // SECURITY: Required only in development for dev-login bypass
  // This should NEVER be set in production environments
  @IsString()
  @IsOptional()
  DEV_BYPASS_SECRET?: string;
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
