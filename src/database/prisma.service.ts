import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseConfigService } from './database-config.serivce';

/**
 * 健康检查结果类型
 */
interface HealthCheckResult {
  isHealthy: boolean;
  details?: {
    responseTime: number;
    error?: string;
  };
}

/**
 * Prisma 客户端配置接口
 */
interface PrismaClientOptions {
  datasources: {
    db: {
      url: string;
    };
  };
  log?: Array<{
    emit: 'event' | 'stdout';
    level: 'query' | 'error' | 'info' | 'warn';
  }>;
  errorFormat?: 'pretty' | 'colorless' | 'minimal';
}

/**
 * 扩展 PrismaClient 类型
 */
interface PrismaClientExtensions {
  $on: (eventType: string, callback: (arg: unknown) => void) => void;
}

/**
 * 扩展 PrismaClient 的类型，支持事件系统
 */
type ExtendedPrismaClient = PrismaClient & PrismaClientExtensions;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  // 读写客户端
  private writeClient: PrismaClient | null = null;
  private readClient: PrismaClient | null = null;

  // 数据库连接字符串
  private writeUrl: string | null = null;
  private readUrl: string | null = null;

  constructor(private readonly dbConfigService: DatabaseConfigService) {}

  /**
   * NestJS 生命周期钩子 - 初始化时连接数据库
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Prisma connections...');

    try {
      // 获取写库连接字符串
      this.writeUrl = await this.dbConfigService.getPrismaDatabaseUrl();
      if (!this.writeUrl) {
        throw new Error('Write database URL is empty or undefined');
      }

      // 获取读库连接字符串
      this.readUrl = await this.dbConfigService.getPrismaReadDatabaseUrl();
      if (!this.readUrl) {
        this.logger.warn(
          'Read database URL is empty, falling back to write database URL',
        );
        this.readUrl = this.writeUrl;
      }

      this.logger.debug(
        `Using write database URL pattern: ${this.maskDatabaseUrl(this.writeUrl)}`,
      );
      this.logger.debug(
        `Using read database URL pattern: ${this.maskDatabaseUrl(this.readUrl)}`,
      );

      // 初始化写客户端
      this.writeClient = this.createPrismaClient(this.writeUrl);
      await this.writeClient.$connect();

      // 初始化读客户端 (如果与写客户端不同)
      if (this.readUrl !== this.writeUrl) {
        this.readClient = this.createPrismaClient(this.readUrl);
        await this.readClient.$connect();
      } else {
        this.readClient = this.writeClient;
      }

      this.isConnected = true;
      this.logger.log('Database connections established successfully');
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error during Prisma initialization: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * NestJS 生命周期钩子 - 销毁时断开数据库连接
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing database connections...');

    if (this.isConnected) {
      // 断开写客户端
      if (this.writeClient) {
        await this.writeClient.$disconnect();
      }

      // 如果读客户端与写客户端不同，也需要断开
      if (this.readClient && this.readClient !== this.writeClient) {
        await this.readClient.$disconnect();
      }

      this.isConnected = false;
      this.logger.log('Database connections closed');
    }
  }

  /**
   * 获取写库客户端
   */
  getWriteClient(): PrismaClient {
    if (!this.writeClient) {
      throw new Error('Write database client is not initialized');
    }
    return this.writeClient;
  }

  /**
   * 获取读库客户端
   */
  getReadClient(): PrismaClient {
    if (!this.readClient) {
      throw new Error('Read database client is not initialized');
    }
    return this.readClient;
  }

  /**
   * 创建 Prisma 客户端实例
   */
  private createPrismaClient(databaseUrl: string): PrismaClient {
    const options: PrismaClientOptions = {
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
      errorFormat: 'pretty',
    };

    const client = new PrismaClient(options) as ExtendedPrismaClient;

    // 配置事件监听器
    client.$on('error', (error: unknown) => {
      const err = error as Error;
      this.logger.error(`Prisma error: ${err.message}`, err.stack);
    });

    client.$on('warn', (warning: unknown) => {
      const warn = warning as string;
      this.logger.warn(`Prisma warning: ${warn}`);
    });

    return client;
  }

  /**
   * 执行事务
   * 注意: 事务总是使用写客户端
   */
  async transaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const client = this.getWriteClient();
    return client.$transaction(async (tx) => {
      return fn(tx);
    });
  }

  /**
   * 执行健康检查
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // 检查写库连接
      const writeClient = this.getWriteClient();
      const writeResult = await writeClient.$queryRaw<
        Array<{ result: number }>
      >`SELECT 1 as result`;

      // 如果读库与写库不同，也检查读库连接
      let readHealthy = true;
      if (this.readClient && this.readClient !== this.writeClient) {
        const readResult = await this.readClient.$queryRaw<
          Array<{ result: number }>
        >`SELECT 1 as result`;
        readHealthy = Array.isArray(readResult) && readResult.length > 0;
      }

      const responseTime = Date.now() - startTime;

      return {
        isHealthy:
          Array.isArray(writeResult) && writeResult.length > 0 && readHealthy,
        details: {
          responseTime,
        },
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Database health check failed: ${err.message}`);

      return {
        isHealthy: false,
        details: {
          responseTime: Date.now() - startTime,
          error: err.message,
        },
      };
    }
  }

  /**
   * 隐藏数据库 URL 中的敏感信息
   */
  private maskDatabaseUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const username = parsedUrl.username ? '****' : '';
      const password = parsedUrl.password ? '****' : '';
      const auth = username || password ? `${username}:${password}@` : '';

      return `${parsedUrl.protocol}//${auth}${parsedUrl.host}${parsedUrl.pathname}`;
    } catch (error) {
      console.log(error);
      return 'Invalid database URL format';
    }
  }

  /**
   * 重试连接
   */
  async retryConnect(maxRetries = 5, delay = 1000): Promise<void> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // 获取新的连接 URL
        this.writeUrl = await this.dbConfigService.getPrismaDatabaseUrl();
        this.readUrl = await this.dbConfigService.getPrismaReadDatabaseUrl();

        // 断开现有连接
        if (this.writeClient) {
          await this.writeClient.$disconnect();
        }
        if (this.readClient && this.readClient !== this.writeClient) {
          await this.readClient.$disconnect();
        }

        // 创建新的客户端
        this.writeClient = this.createPrismaClient(this.writeUrl);
        await this.writeClient.$connect();

        if (this.readUrl !== this.writeUrl) {
          this.readClient = this.createPrismaClient(this.readUrl);
          await this.readClient.$connect();
        } else {
          this.readClient = this.writeClient;
        }

        this.isConnected = true;
        this.logger.log(
          `Database connections established after ${retries + 1} attempts`,
        );
        return;
      } catch (error) {
        const err = error as Error;
        retries++;
        this.logger.warn(
          `Connection attempt ${retries} failed: ${err.message}`,
        );

        if (retries >= maxRetries) {
          this.logger.error(`Failed to connect after ${maxRetries} attempts`);
          throw err;
        }

        // 等待一段时间后重试
        await new Promise((resolve) => setTimeout(resolve, delay));
        // 每次重试增加延迟时间
        delay = Math.floor(delay * 1.5);
      }
    }
  }

  /**
   * 执行原始SQL查询 (使用写客户端)
   */
  executeRawWriteQuery<T>(sql: string, ...values: unknown[]): Promise<T> {
    const client = this.getWriteClient();
    return client.$queryRawUnsafe(sql, ...values) as Promise<T>;
  }

  /**
   * 执行原始SQL查询 (使用读客户端)
   */
  executeRawReadQuery<T>(sql: string, ...values: unknown[]): Promise<T> {
    const client = this.getReadClient();
    return client.$queryRawUnsafe(sql, ...values) as Promise<T>;
  }
}
