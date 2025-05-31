import { ApiProperty } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';

export class CreateAssetDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: AssetType })
  type!: AssetType;

  @ApiProperty({ required: false })
  symbol?: string;

  @ApiProperty()
  quantity!: number; // stored in micro-units

  @ApiProperty()
  currency!: string;

  @ApiProperty({ required: false })
  source?: string;

  @ApiProperty({ required: false })
  externalId?: string;

  @ApiProperty({ required: false })
  valueOverride?: number; // stored in pence/cents

  // Purchase tracking fields
  @ApiProperty({ required: false })
  purchasePrice?: number;

  @ApiProperty({ required: false })
  purchaseDate?: string;

  // Savings-specific fields
  @ApiProperty({ required: false })
  initialAmount?: number;

  @ApiProperty({ required: false })
  interestRate?: number; // stored as percentage, converted to basis points

  @ApiProperty({ required: false, enum: ['SIMPLE', 'COMPOUND'] })
  interestType?: 'SIMPLE' | 'COMPOUND';

  @ApiProperty({ required: false, enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY'] })
  paymentFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';

  @ApiProperty({ required: false })
  termLength?: number; // in months

  @ApiProperty({ required: false })
  maturityDate?: string;

  // Performance tracking
  @ApiProperty({ required: false, default: false })
  autoSync?: boolean;
}