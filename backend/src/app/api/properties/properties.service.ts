import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-properties.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        address: dto.address,
        value: dto.value,
        purchaseDate: new Date(dto.purchaseDate),
        notes: dto.notes,
        userId: dto.userId,
      },
    });
  }

  async update(id: string, dto: UpdatePropertyDto) {
    return this.prisma.property.update({
      where: { id },
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.property.findMany({
      orderBy: { purchaseDate: 'desc' },
    });
  }
}
