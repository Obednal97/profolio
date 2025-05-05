import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    email!: string;
  
    @ApiProperty({ example: 'UK' })
    taxCountry!: string;
  
    @ApiProperty({ example: 2500, description: 'Tax rate in basis points. 0.25 = 2500' })
    taxRate!: number;
  }