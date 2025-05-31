import { ApiProperty } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';

export class CreateAssetDto {
  // userId is injected by controller from JWT token, not included in DTO

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: AssetType })
  @IsEnum(AssetType)
  type!: AssetType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiProperty()
  @IsNumber()
  quantity!: number; // Will be stored as Decimal in database

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalId?: string;

  // Current value field (maps to frontend current_value)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  current_value?: number; // Will be stored in cents

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  valueOverride?: number; // Manual override, stored in cents

  // Purchase tracking fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  purchase_price?: number; // Purchase price per unit, stored in cents

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  // Savings-specific fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  initialAmount?: number; // Stored in cents

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  interestRate?: number; // Stored as percentage (5.25% = 5.25)

  @ApiProperty({ required: false, enum: ['SIMPLE', 'COMPOUND'] })
  @IsOptional()
  @IsEnum(['SIMPLE', 'COMPOUND'])
  interestType?: 'SIMPLE' | 'COMPOUND';

  @ApiProperty({ required: false, enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY'] })
  @IsOptional()
  @IsEnum(['MONTHLY', 'QUARTERLY', 'ANNUALLY'])
  paymentFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  termLength?: number; // in months

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  maturityDate?: string;

  // Stock options fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  vesting_start_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  vesting_end_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  vesting_schedule?: any; // JSON data

  // Additional fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // Performance tracking
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;
}