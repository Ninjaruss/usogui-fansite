import {
  IsString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class KofiWebhookDto {
  @IsString()
  verification_token: string;

  @IsString()
  message_id: string;

  @IsString()
  timestamp: string;

  @IsString()
  type: string; // 'Donation' or 'Subscription'

  @IsOptional()
  @IsString()
  is_public?: string; // 'true' or 'false'

  @IsString()
  from_name: string;

  @IsOptional()
  @IsString()
  message?: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  amount: number;

  @IsString()
  url: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  is_subscription_payment?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  is_first_subscription_payment?: string; // 'true' or 'false'

  @IsOptional()
  @IsString()
  kofi_transaction_id?: string;

  @IsOptional()
  @IsString()
  shop_items?: string; // JSON string of shop items

  @IsOptional()
  @IsString()
  tier_name?: string; // For memberships
}
