import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async saveSettings(dto: UpdateSettingsDto) {
    const { userId, theme, currency, timezone } = dto;
    return this.prisma.settings.upsert({
      where: { userId },
      update: { theme, currency, timezone },
      create: { userId, theme, currency, timezone },
    });
  }
}