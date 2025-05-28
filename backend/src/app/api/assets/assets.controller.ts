import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    Query,
  } from '@nestjs/common';
  import { AssetsService } from './assets.service';
  import { CreateAssetDto } from './dto/create-asset.dto';
  import { UpdateAssetDto } from './dto/update-asset.dto';
  import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
  import { AuthGuard } from '../auth/guards/auth.guard';
  import { Request } from 'express';
  
  @ApiTags('assets')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Controller('assets')
  export class AssetsController {
    constructor(private readonly assetsService: AssetsService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new asset' })
    @ApiResponse({ status: 201, description: 'Asset created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    create(@Body() createAssetDto: CreateAssetDto, @Req() req: Request) {
      return this.assetsService.create({
        ...createAssetDto,
        userId: req.user.id,
      });
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all assets for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
    findAll(@Req() req: Request, @Query('type') type?: string) {
      return this.assetsService.findAllByUser(req.user.id, type);
    }
  
    @Get('summary')
    @ApiOperation({ summary: 'Get asset summary and statistics' })
    @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
    getSummary(@Req() req: Request) {
      return this.assetsService.getUserAssetSummary(req.user.id);
    }
  
    @Get('history')
    @ApiOperation({ summary: 'Get asset value history' })
    @ApiResponse({ status: 200, description: 'History retrieved successfully' })
    getHistory(
      @Req() req: Request,
      @Query('days') days?: string,
    ) {
      const daysNum = days ? parseInt(days, 10) : 30;
      return this.assetsService.getAssetHistory(req.user.id, daysNum);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a specific asset' })
    @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    findOne(@Param('id') id: string, @Req() req: Request) {
      return this.assetsService.findOne(id, req.user.id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update an asset' })
    @ApiResponse({ status: 200, description: 'Asset updated successfully' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    update(
      @Param('id') id: string,
      @Body() updateAssetDto: UpdateAssetDto,
      @Req() req: Request,
    ) {
      return this.assetsService.update(id, updateAssetDto, req.user.id);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an asset' })
    @ApiResponse({ status: 204, description: 'Asset deleted successfully' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    remove(@Param('id') id: string, @Req() req: Request) {
      return this.assetsService.remove(id, req.user.id);
    }
  }