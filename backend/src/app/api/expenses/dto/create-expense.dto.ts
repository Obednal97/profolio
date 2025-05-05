

import { IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  amount!: number;

  @IsString()
  category!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  userId!: string;
}