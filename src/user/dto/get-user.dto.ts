import { IsNotEmpty, IsString } from 'class-validator';

export class GetUsersParamDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
