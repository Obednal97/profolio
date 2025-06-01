import { IsString, IsNumber, IsDateString, IsOptional, IsDecimal, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePropertyDto {
  @IsString()
  userId!: string;

  // Address fields
  @IsString()
  address!: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  // Property details
  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsString()
  @IsOptional()
  ownershipType?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  squareFootage?: number;

  @IsNumber()
  @IsOptional()
  @Min(1800)
  @Max(new Date().getFullYear())
  yearBuilt?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  lotSize?: number;

  // Financial values (frontend sends as dollars, backend stores as cents)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  currentValue?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  purchasePrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  rentalIncome?: number;

  // Mortgage details
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  mortgageAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  mortgageRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  mortgageTerm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  monthlyPayment?: number;

  @IsString()
  @IsOptional()
  mortgageProvider?: string;

  @IsDateString()
  @IsOptional()
  mortgageStartDate?: string;

  // Additional costs (monthly, stored as cents)
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  propertyTaxes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  insurance?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  maintenanceCosts?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  hoa?: number;

  // Rental details
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  monthlyRent?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value ? Math.round(value * 100) : undefined)
  securityDeposit?: number;

  @IsDateString()
  @IsOptional()
  rentalStartDate?: string;

  @IsDateString()
  @IsOptional()
  rentalEndDate?: string;

  // Dates and metadata
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}