import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersParamDto } from './dto/get-user.dto';
import { ApiResponse } from '../common/dto/api-response.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<User[]> {
    return this.userService.findUsers({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('/:userId')
  public getUser(@Param() getUserParamDto: GetUsersParamDto) {
    const { userId } = getUserParamDto;
    return this.userService.findUserById(userId);
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser({
      email: createUserDto.email,
      name: createUserDto.name,
    });
    return ApiResponse.success(user, '用户创建成功');
  }
}
