import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaService } from './common/prisma.service';

@Module({
    imports: [UsersModule],
    providers: [PrismaService],
    exports: [PrismaService], // <-- this line is key
  })
export class AppModule {}
