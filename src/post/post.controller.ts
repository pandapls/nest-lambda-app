import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostByIdDto } from './dto/get-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
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
