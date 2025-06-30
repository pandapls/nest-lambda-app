import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto) {
    const writeClient = this.prisma.getWriteClient();
    const { title, content, published, authorId } = createPostDto;
    const res = await writeClient.post.create({
      data: {
        title,
        content,
        published,
        authorId,
        updatedAt: new Date(),
      },
    });
    return res.id;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, where, orderBy } = params;
    const readClient = this.prisma.getReadClient();

    return readClient.post.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        author: true,
      },
    });
  }
  async findOne(id: string) {
    const readClient = this.prisma.getReadClient();
    const res = readClient.post.findUnique({
      where: {
        id,
      },
    });
    return res;
  }
}
