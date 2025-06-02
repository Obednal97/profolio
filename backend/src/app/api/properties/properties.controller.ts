import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Req,
    ValidationPipe,
    ParseUUIDPipe,
    HttpException,
    HttpStatus,
    UsePipes
  } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-properties.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { AuthUser } from '@/common/auth/jwt.strategy';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('api/properties')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreatePropertyDto, @Req() req: { user: AuthUser }) {
    try {
      return await this.propertiesService.create({
        ...dto,
        userId: req.user.id, // Ensure property is tied to authenticated user
      });
    } catch (error) {
      throw new HttpException(
        'Failed to create property',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a property' })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your property' })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() dto: UpdatePropertyDto,
    @Req() req: { user: AuthUser }
  ) {
    try {
      return await this.propertiesService.update(id, dto, req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to update property',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a property' })
  @ApiResponse({ status: 204, description: 'Property deleted successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your property' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: AuthUser }
  ) {
    try {
      await this.propertiesService.delete(id, req.user.id);
      return { message: 'Property deleted successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to delete property',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties for authenticated user' })
  @ApiResponse({ status: 200, description: 'Properties retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Req() req: { user: AuthUser }, @Query('limit') limit?: string) {
    try {
      const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50; // Max 100 items
      return await this.propertiesService.findByUserId(req.user.id, limitNum);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch properties',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific property' })
  @ApiResponse({ status: 200, description: 'Property retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your property' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: AuthUser }
  ) {
    try {
      return await this.propertiesService.findOne(id, req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch property',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}