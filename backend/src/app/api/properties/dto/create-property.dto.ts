import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  address!: string;

  @IsNumber()
  value!: number;

  @IsDateString()
  purchaseDate!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  userId!: string;
}