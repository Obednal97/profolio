import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MinLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Admin user creation.
 *
 * This class previously carried @ApiProperty decorators only - no validation
 * whatsoever - so the global ValidationPipe had nothing to enforce and any
 * shape was accepted, including a malformed email or a one-character password.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'UK' })
  @IsString()
  @Length(2, 2, { message: 'taxCountry must be a 2-letter ISO country code' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  taxCountry!: string;

  @ApiProperty({ example: 2500, description: 'Tax rate in basis points. 0.25 = 2500' })
  @IsInt({ message: 'taxRate must be an integer number of basis points' })
  @Min(0)
  @Max(10000, { message: 'taxRate cannot exceed 10000 basis points (100%)' })
  taxRate!: number;

  @ApiProperty({ description: 'User password. Hashed before storage.' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter and one number',
  })
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;
}
