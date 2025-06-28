/**
 * 这个文件包含 Prisma 相关的类型定义
 * 放在单独的文件中可以让代码更清晰
 */

/**
 * 健康检查结果类型
 */
export interface HealthCheckResult {
  isHealthy: boolean;
  details?: {
    responseTime: number;
    error?: string;
  };
}

/**
 * Prisma 错误类型
 */
export interface PrismaError extends Error {
  code?: string;
  clientVersion?: string;
  meta?: Record<string, unknown>;
}

/**
 * Prisma 事件类型
 */
export type PrismaEventType = 'query' | 'info' | 'warn' | 'error';

/**
 * Prisma 事件回调类型
 */
export type PrismaEventCallback<T extends PrismaEventType> = T extends 'query'
  ? (e: {
      query: string;
      params: string;
      duration: number;
      target: string;
    }) => void
  : T extends 'info' | 'warn'
    ? (e: string) => void
    : T extends 'error'
      ? (e: PrismaError) => void
      : never;

/**
 * 扩展 PrismaClient 类型
 */
export interface ExtendedPrismaClient {
  $on<T extends PrismaEventType>(
    eventType: T,
    callback: PrismaEventCallback<T>,
  ): void;
}

/**
 * 数据库模型定义
 */
export interface PrismaModelDefinition {
  name: string;
  fields: Array<{
    name: string;
    relationName?: string;
    isRequired: boolean;
    isList: boolean;
    kind: string;
  }>;
}

/**
 * 简化的 Prisma DMMF 类型
 * (DMMF = DataModel MetaFormat)
 */
export interface PrismaDMMF {
  datamodel: {
    models: PrismaModelDefinition[];
    enums: unknown[];
    types: unknown[];
  };
}
