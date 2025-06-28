import { IsNotEmpty, IsString } from 'class-validator';

export class GetPostByIdDto {
  @IsNotEmpty()
  @IsString()
  postId: string;
}
