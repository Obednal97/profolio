

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';

@Injectable()
export class LiabilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateLiabilityDto) {
    return this.prisma.liability.create({ data });
  }

  findAllByUser(userId: string) {
    return this.prisma.liability.findMany({ where: { userId } });
  }

  findOne(id: string) {
    return this.prisma.liability.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateLiabilityDto) {
    return this.prisma.liability.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.liability.delete({ where: { id } });
  }
}