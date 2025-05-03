

import { PartialType } from '@nestjs/swagger';
import { CreateLiabilityDto } from './create-liability.dto';

export class UpdateLiabilityDto extends PartialType(CreateLiabilityDto) {}