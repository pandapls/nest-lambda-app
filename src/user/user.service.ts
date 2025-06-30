import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createUser(params: { email: string; name: string }) {
    const writeClient = this.prisma.getWriteClient();
    const res = await writeClient.user.create({
      data: {
        email: params.email,
        name: params.name,
        updatedAt: new Date(),
      },
    });

    return res;
  }
  // 查询用户列表 - 使用读库
  async findUsers(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = params;
    const readClient = this.prisma.getReadClient();

    return readClient.user.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        posts: true,
      },
    });
  }

  async findUserById(userId: string) {
    const readClient = this.prisma.getReadClient();

    return readClient.user.findUnique({
      where: {
        id: userId,
      },
    });
  }
}
