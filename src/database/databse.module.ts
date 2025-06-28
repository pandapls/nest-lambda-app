import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseConfigService } from './database-config.serivce';

@Global()
@Module({
  providers: [DatabaseConfigService, PrismaService],
  exports: [PrismaService, DatabaseConfigService],
})
export class PrismaModule {}
