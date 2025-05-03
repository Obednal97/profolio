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
  import { AssetsService } from './assets.service';
  import { CreateAssetDto } from './dto/create-asset.dto';
  import { UpdateAssetDto } from './dto/update-asset.dto';
  import { ApiTags } from '@nestjs/swagger';
  
  @ApiTags('assets')
  @Controller('assets')
  export class AssetsController {
    constructor(private readonly assetsService: AssetsService) {}
  
    @Post()
    create(@Body() createAssetDto: CreateAssetDto) {
      return this.assetsService.create(createAssetDto);
    }
  
    @Get()
    findAllByUser(@Query('userId') userId: string) {
      return this.assetsService.findAllByUser(userId);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.assetsService.findOne(id);
    }
  
    @Patch(':id')
    update(
      @Param('id') id: string,
      @Body() updateAssetDto: UpdateAssetDto,
    ) {
      return this.assetsService.update(id, updateAssetDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.assetsService.remove(id);
    }
  }