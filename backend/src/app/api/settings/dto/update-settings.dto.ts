import { IsString, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  theme?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}