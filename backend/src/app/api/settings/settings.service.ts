import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async saveSettings(dto: UpdateSettingsDto & { userId: string }) {
    const { userId, theme, currency, timezone } = dto;
    return this.prisma.settings.upsert({
      where: { userId },
      update: { theme, currency, timezone },
      create: { userId, theme, currency, timezone },
    });
  }

  async getSettings(userId: string) {
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });

    // Return default settings if none exist
    if (!settings) {
      return {
        userId,
        theme: 'light',
        currency: 'USD',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return settings;
  }
}