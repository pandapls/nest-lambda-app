export class ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;

  constructor(code: number, message: string, data?: T, error?: string) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = 'success'): ApiResponse<T> {
    return new ApiResponse(0, message, data);
  }

  static error(message = 'err', error?: string): ApiResponse {
    return new ApiResponse(-1, message, undefined, error);
  }
}

// 分页响应格式
export class PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  timestamp: string;

  constructor(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message = '获取数据成功',
  ) {
    this.success = true;
    this.message = message;
    this.data = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
    this.timestamp = new Date().toISOString();
  }
}
