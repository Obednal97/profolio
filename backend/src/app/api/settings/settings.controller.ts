import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  ValidationPipe, 
  UsePipes,
  HttpException,
  HttpStatus,
  Get
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { AuthUser } from '@/common/auth/jwt.strategy';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSettings(@Body() dto: UpdateSettingsDto, @Req() req: { user: AuthUser }) {
    try {
      return await this.settingsService.saveSettings({
        ...dto,
        userId: req.user.id, // Ensure settings are tied to authenticated user
      });
    } catch (error) {
      throw new HttpException(
        'Failed to update settings',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSettings(@Req() req: { user: AuthUser }) {
    try {
      return await this.settingsService.getSettings(req.user.id);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch settings',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}