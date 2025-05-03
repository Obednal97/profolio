import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { LiabilitiesService } from './liabilities.service';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('liabilities')
@Controller('liabilities')
export class LiabilitiesController {
  constructor(private readonly liabilitiesService: LiabilitiesService) {}

  @Post()
  create(@Body() createLiabilityDto: CreateLiabilityDto) {
    return this.liabilitiesService.create(createLiabilityDto);
  }

  @Get()
  findAllByUser(@Query('userId') userId: string) {
    return this.liabilitiesService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.liabilitiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLiabilityDto: UpdateLiabilityDto,
  ) {
    return this.liabilitiesService.update(id, updateLiabilityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.liabilitiesService.remove(id);
  }
}
