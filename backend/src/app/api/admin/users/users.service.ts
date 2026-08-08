import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * Fields the admin API is allowed to return.
 *
 * findAll/findOne previously returned whole User rows, which include the
 * bcrypt password hash, the Stripe customer and subscription ids, and every
 * other column. An admin listing users had all of that delivered to the
 * browser. Only what an admin screen actually needs is selected here.
 */
const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerified: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
  lastSignIn: true,
  subscriptionStatus: true,
  subscriptionTier: true,
} as const;

export type AdminUserView = Pick<User, keyof typeof ADMIN_USER_SELECT>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<AdminUserView[]> {
    return this.prisma.user.findMany({
      select: ADMIN_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<AdminUserView | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: ADMIN_USER_SELECT,
    });
  }

  async create(data: CreateUserDto): Promise<AdminUserView> {
    return this.prisma.user.create({ data, select: ADMIN_USER_SELECT });
  }

  async delete(id: string): Promise<AdminUserView> {
    return this.prisma.user.delete({
      where: { id },
      select: ADMIN_USER_SELECT,
    });
  }
}
