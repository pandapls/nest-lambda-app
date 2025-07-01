import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { PrismaModule } from './database/databse.module';
import { ConfigModule } from '@nestjs/config';
import { GithubModule } from './github/github.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 设为全局模块，这样在其他模块中无需再导入
      envFilePath: '.env.development', // 指定环境变量文件路径
      expandVariables: true, // 支持变量扩展，例如 ${PORT}
    }),
    PrismaModule,
    UserModule,
    PostModule,
    GithubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
