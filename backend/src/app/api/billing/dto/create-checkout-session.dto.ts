import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum PriceTier {
  CLOUD_MONTHLY = 'cloud_monthly',
  CLOUD_ANNUAL = 'cloud_annual',
}

export class CreateCheckoutSessionDto {
  @IsEnum(PriceTier)
  priceId!: PriceTier;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}