import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostByIdDto } from './dto/get-post.dto';
import { ApiResponse } from '../common/dto/api-response.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async create(@Body() createPostDto: CreatePostDto) {
    const post = await this.postService.create(createPostDto);
    return ApiResponse.success(post, '文章创建成功');
  }

  @Get()
  findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.postService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get(':postId')
  findOne(@Param() getPostByIdDto: GetPostByIdDto) {
    const { postId } = getPostByIdDto;
    return this.postService.findOne(postId);
  }
}
