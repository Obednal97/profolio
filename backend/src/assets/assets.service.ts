import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAssetDto) {
    return this.prisma.asset.create({ data });
  }

  findAllByUser(userId: string) {
    return this.prisma.asset.findMany({ where: { userId } });
  }

  findOne(id: string) {
    return this.prisma.asset.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateAssetDto) {
    return this.prisma.asset.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.asset.delete({ where: { id } });
  }
}