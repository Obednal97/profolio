import { ApiProperty } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsDateString,
  Length,
  Min,
  Max,
  Matches,
  IsUUID,
  IsISO8601,
  ValidateIf
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAssetDto {
  // userId is injected by controller from JWT token, not included in DTO

  @ApiProperty({ minLength: 1, maxLength: 200 })
  @IsString()
  @Length(1, 200, { message: 'Asset name must be between 1 and 200 characters' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  name!: string;

  @ApiProperty({ enum: AssetType })
  @IsEnum(AssetType, { message: 'Invalid asset type' })
  type!: AssetType;

  @ApiProperty({ required: false, maxLength: 20 })
  @IsOptional()
  @IsString()
  @Length(1, 20, { message: 'Symbol must be between 1 and 20 characters' })
  @Matches(/^[A-Z0-9.-]+$/, { message: 'Symbol must contain only uppercase letters, numbers, dots, and hyphens' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  symbol?: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber({}, { message: 'Quantity must be a valid number' })
  @Min(0, { message: 'Quantity cannot be negative' })
  @Max(999999999, { message: 'Quantity is too large' })
  quantity!: number;

  @ApiProperty({ required: false, default: 'USD', maxLength: 3 })
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'Currency must be exactly 3 characters (ISO 4217)' })
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a valid ISO 4217 code (e.g., USD, EUR, GBP)' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  currency?: string;

  @ApiProperty({ required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Source must be between 1 and 100 characters' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  source?: string;

  @ApiProperty({ required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'External ID must be between 1 and 100 characters' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  externalId?: string;

  // Current value field (maps to frontend current_value)
  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Current value must be a valid number' })
  @Min(0, { message: 'Current value cannot be negative' })
  @Max(9999999999, { message: 'Current value is too large' })
  current_value?: number;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Value override must be a valid number' })
  @Min(0, { message: 'Value override cannot be negative' })
  @Max(9999999999, { message: 'Value override is too large' })
  valueOverride?: number;

  // Purchase tracking fields
  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Purchase price must be a valid number' })
  @Min(0, { message: 'Purchase price cannot be negative' })
  @Max(9999999999, { message: 'Purchase price is too large' })
  purchase_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601({}, { message: 'Purchase date must be a valid ISO 8601 date' })
  purchase_date?: string;

  // Savings-specific fields
  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Initial amount must be a valid number' })
  @Min(0, { message: 'Initial amount cannot be negative' })
  @Max(9999999999, { message: 'Initial amount is too large' })
  @ValidateIf(o => o.type === AssetType.SAVINGS)
  initialAmount?: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber({}, { message: 'Interest rate must be a valid number' })
  @Min(0, { message: 'Interest rate cannot be negative' })
  @Max(100, { message: 'Interest rate cannot exceed 100%' })
  @ValidateIf(o => o.type === AssetType.SAVINGS)
  interestRate?: number;

  @ApiProperty({ required: false, enum: ['SIMPLE', 'COMPOUND'] })
  @IsOptional()
  @IsEnum(['SIMPLE', 'COMPOUND'], { message: 'Interest type must be SIMPLE or COMPOUND' })
  @ValidateIf(o => o.type === AssetType.SAVINGS)
  interestType?: 'SIMPLE' | 'COMPOUND';

  @ApiProperty({ required: false, enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY'] })
  @IsOptional()
  @IsEnum(['MONTHLY', 'QUARTERLY', 'ANNUALLY'], { message: 'Payment frequency must be MONTHLY, QUARTERLY, or ANNUALLY' })
  @ValidateIf(o => o.type === AssetType.SAVINGS)
  paymentFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

  @ApiProperty({ required: false, minimum: 1, maximum: 600 })
  @IsOptional()
  @IsNumber({}, { message: 'Term length must be a valid number' })
  @Min(1, { message: 'Term length must be at least 1 month' })
  @Max(600, { message: 'Term length cannot exceed 600 months (50 years)' })
  @ValidateIf(o => o.type === AssetType.SAVINGS)
  termLength?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601({}, { message: 'Maturity date must be a valid ISO 8601 date' })
  @ValidateIf(o => o.type === AssetType.SAVINGS)
  maturityDate?: string;

  // Stock/Equity options fields (use EQUITY instead of STOCK_OPTIONS)
  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601({}, { message: 'Vesting start date must be a valid ISO 8601 date' })
  @ValidateIf(o => o.type === AssetType.EQUITY)
  vesting_start_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601({}, { message: 'Vesting end date must be a valid ISO 8601 date' })
  @ValidateIf(o => o.type === AssetType.EQUITY)
  vesting_end_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateIf(o => o.type === AssetType.EQUITY)
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  vesting_schedule?: Record<string, unknown>; // JSON data - would need custom validator in production

  // Additional fields
  @ApiProperty({ required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: 'Notes cannot exceed 1000 characters' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  notes?: string;

  // Performance tracking
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'Auto sync must be a boolean value' })
  autoSync?: boolean;
}