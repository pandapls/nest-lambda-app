import { Module, Global } from '@nestjs/common';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Global()
@Module({
  providers: [ResponseInterceptor, HttpExceptionFilter],
  exports: [ResponseInterceptor, HttpExceptionFilter],
})
export class CommonModule {}
