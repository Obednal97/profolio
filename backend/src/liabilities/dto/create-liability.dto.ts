import { ApiProperty } from '@nestjs/swagger';

export class CreateLiabilityDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  balance!: number; // in pence/cents

  @ApiProperty()
  interestRate!: number; // in basis points (e.g. 2500 = 25%)

  @ApiProperty({ required: false })
  dueDate?: Date;
}
