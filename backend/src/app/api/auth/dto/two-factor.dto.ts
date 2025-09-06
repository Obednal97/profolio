import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupTwoFactorDto {
  @ApiProperty({ description: 'User password for verification' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty({ description: '6-digit TOTP code', example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;
}

export class CompleteTwoFactorDto {
  @ApiProperty({ description: 'Temporary verification token' })
  @IsString()
  @IsNotEmpty()
  verificationToken!: string;

  @ApiProperty({ description: '6-digit TOTP code or backup code' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({ description: 'User password for verification' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ description: '6-digit TOTP code for verification' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;
}

export class VerifyBackupCodeDto {
  @ApiProperty({ description: 'Temporary verification token' })
  @IsString()
  @IsNotEmpty()
  verificationToken!: string;

  @ApiProperty({ 
    description: 'Backup code in format XXXX-XXXX',
    example: 'A1B2-C3D4' 
  })
  @IsString()
  @Matches(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, { 
    message: 'Invalid backup code format' 
  })
  code!: string;
}

export class RegenerateBackupCodesDto {
  @ApiProperty({ description: 'User password for verification' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ description: '6-digit TOTP code for verification' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;
}