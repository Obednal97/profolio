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
  import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
  import { AuthUser } from '@/common/auth/jwt.strategy';
  
  @ApiTags('assets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Controller('assets')
  export class AssetsController {
    constructor(private readonly assetsService: AssetsService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new asset' })
    @ApiResponse({ status: 201, description: 'Asset created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async create(@Body() createAssetDto: CreateAssetDto, @Req() req: { user: AuthUser }) {
      return this.assetsService.create({
        ...createAssetDto,
        userId: req.user.id,
      });
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all assets for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
    async findAll(@Req() req: { user: AuthUser }, @Query('type') type?: string) {
      return this.assetsService.findAllByUser(req.user.id, type);
    }
  
    @Get('summary')
    @ApiOperation({ summary: 'Get asset summary and statistics' })
    @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
    async getUserAssetSummary(@Req() req: { user: AuthUser }) {
      return this.assetsService.getUserAssetSummary(req.user.id);
    }
  
    @Get('history')
    @ApiOperation({ summary: 'Get asset value history' })
    @ApiResponse({ status: 200, description: 'History retrieved successfully' })
    async getAssetHistory(@Req() req: { user: AuthUser }, @Query('days') days?: string) {
      const daysNum = days ? parseInt(days, 10) : 30;
      return this.assetsService.getAssetHistory(req.user.id, daysNum);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a specific asset' })
    @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    async findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
      return this.assetsService.findOne(id, req.user.id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update an asset' })
    @ApiResponse({ status: 200, description: 'Asset updated successfully' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    async update(
      @Param('id') id: string,
      @Body() updateAssetDto: UpdateAssetDto,
      @Req() req: { user: AuthUser }
    ) {
      return this.assetsService.update(id, updateAssetDto, req.user.id);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an asset' })
    @ApiResponse({ status: 204, description: 'Asset deleted successfully' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    async remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
      return this.assetsService.remove(id, req.user.id);
    }
  }