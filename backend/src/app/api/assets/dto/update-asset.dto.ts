import { PartialType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  userId?: string; // Make userId optional for updates
}