import { IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateExpenseDto {
  @IsNumber()
  amount!: number;

  @IsString()
  category!: string;

  @IsDateString()
  date!: string;

  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}