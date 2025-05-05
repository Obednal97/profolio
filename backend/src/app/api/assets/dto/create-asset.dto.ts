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
}