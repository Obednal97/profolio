import { Controller, Post, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('api/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Post()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.saveSettings(dto);
  }
}