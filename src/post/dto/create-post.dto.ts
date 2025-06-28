import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsString()
  @IsNotEmpty()
  authorId: string;
}
