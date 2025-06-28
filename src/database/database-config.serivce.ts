import { Injectable, Logger } from '@nestjs/common';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

@Injectable()
export class DatabaseConfigService {
  private readonly logger = new Logger(DatabaseConfigService.name);
  private ssmClient: SSMClient;

  constructor() {
    // 注意这里不使用 AWS_REGION 环境变量
    this.ssmClient = new SSMClient({
      region: process.env.AWS_LAMBDA_REGION || 'us-east-1',
    });
  }

  public isLocalDevelopment(): boolean {
    return (
      process.env.IS_LOCAL_DEV === 'true' ||
      process.env.NODE_ENV === 'development'
    );
  }

  // 获取 SSM 参数
  private async getSSMParameter(parameterName: string): Promise<string> {
    try {
      this.logger.log(`从 SSM 获取参数: ${parameterName}`);

      // 记录当前环境信息
      this.logger.debug(`当前环境: ${process.env.APP_ENV}`);
      this.logger.debug(
        `参数前缀: ${process.env.DB_PARAM_PREFIX || '/nest-app/database'}`,
      );

      const command = new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true,
      });

      const response = await this.ssmClient.send(command);

      if (!response.Parameter?.Value) {
        throw new Error(`SSM 参数 ${parameterName} 未返回值`);
      }

      return response.Parameter.Value;
    } catch (error) {
      this.logger.error(`获取 SSM 参数失败: ${parameterName}`, error);
      throw new Error(
        `获取 SSM 参数失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  // 生成Prisma数据库URL
  async getPrismaDatabaseUrl(): Promise<string> {
    // 本地开发环境
    if (this.isLocalDevelopment()) {
      const host =
        process.env.IS_SAM_LOCAL === 'true'
          ? 'host.docker.internal'
          : 'localhost';

      const localUrl = `postgresql://nest-protgres-local:123456@${host}:5433/postgres?sslmode=disable`;
      this.logger.log('使用本地数据库 URL');
      return localUrl;
    }

    // 优先使用环境变量中的完整URL
    if (process.env.DATABASE_URL) {
      this.logger.log('使用环境变量中的 DATABASE_URL');
      return process.env.DATABASE_URL;
    }

    // 生产环境：从SSM获取 - 固定路径以避免权限问题
    try {
      // 使用固定的参数名称
      const writeUrlParam = '/nest-app/database-write-url';
      const writeUrl = await this.getSSMParameter(writeUrlParam);

      this.logger.log('成功从 SSM 获取数据库 URL');
      return writeUrl;
    } catch (error) {
      this.logger.error('从 SSM 获取数据库 URL 失败:', error);
      throw new Error(
        `获取数据库 URL 失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  // 生成只读数据库URL
  async getPrismaReadDatabaseUrl(): Promise<string> {
    // 本地开发读写用同一个数据库
    if (this.isLocalDevelopment()) {
      return this.getPrismaDatabaseUrl();
    }

    // 优先使用环境变量
    if (process.env.DATABASE_READ_URL) {
      this.logger.log('使用环境变量中的 DATABASE_READ_URL');
      return process.env.DATABASE_READ_URL;
    }

    // 生产环境：从SSM获取 - 固定路径以避免权限问题
    try {
      // 使用固定的参数名称
      const readUrlParam = '/nest-app/database-read-url';

      try {
        // 尝试获取只读 URL
        const readUrl = await this.getSSMParameter(readUrlParam);
        this.logger.log('成功从 SSM 获取只读数据库 URL');
        return readUrl;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // 如果没有只读 URL，回退到写 URL
        this.logger.warn('没有找到只读 URL，回退到写 URL');
        return this.getPrismaDatabaseUrl();
      }
    } catch (error) {
      this.logger.error('从 SSM 获取只读数据库 URL 失败:', error);
      // 回退到写数据库 URL
      this.logger.warn('回退到写数据库 URL');
      return this.getPrismaDatabaseUrl();
    }
  }
}
