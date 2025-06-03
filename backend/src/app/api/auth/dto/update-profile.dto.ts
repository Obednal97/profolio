import { IsString, IsOptional, IsEmail, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+1 (555) 123-4567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'United Kingdom', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'Software engineer passionate about fintech', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/profile.jpg', required: false })
  @IsString()
  @IsOptional()
  photoURL?: string;

  @ApiProperty({ example: 'London, UK', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'GBP', required: false })
  @IsString()
  @IsOptional()
  preferredCurrency?: string;

  @ApiProperty({ example: 'dark', required: false })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiProperty({ example: 'Europe/London', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'en', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ example: 'United Kingdom', required: false })
  @IsString()
  @IsOptional()
  taxCountry?: string;

  @ApiProperty({ example: 2000, description: 'Tax rate in basis points', required: false })
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({ example: 'firebase', required: false })
  @IsString()
  @IsOptional()
  provider?: string;
} 