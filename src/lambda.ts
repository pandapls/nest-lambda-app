import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import awsLambdaFastify from '@fastify/aws-lambda';
import type {
  Handler,
  APIGatewayProxyEvent,
  Context,
  Callback,
  APIGatewayProxyResult,
} from 'aws-lambda';
import type { FastifyInstance } from 'fastify';

// 定义强类型 Lambda 适配函数
type LambdaFastifyHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>,
) => void | Promise<APIGatewayProxyResult>;

let cachedServer: LambdaFastifyHandler | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cachedApp: NestFastifyApplication | undefined;

async function bootstrap(): Promise<LambdaFastifyHandler> {
  if (!cachedServer) {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: false,
        disableRequestLogging: true,
        ignoreTrailingSlash: true,
      }),
    );

    cachedApp = app;

    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        stopAtFirstError: true,
        exceptionFactory: (errors) =>
          new UnprocessableEntityException(
            errors.map((e) => {
              const rule = Object.keys(e.constraints!)[0];
              return e.constraints![rule];
            })[0],
          ),
      }),
    );

    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders:
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    await app.init();

    const instance = app.getHttpAdapter().getInstance() as FastifyInstance;
    cachedServer = awsLambdaFastify(instance) as LambdaFastifyHandler;
  }

  return cachedServer;
}

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback?: Callback<APIGatewayProxyResult>,
) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const server = await bootstrap();

    // 始终传递 callback（即使为 undefined 占位，避免 TS 报错）
    return server(event, context, callback as Callback<APIGatewayProxyResult>);
  } catch (error) {
    console.error('Lambda handler error:', error);

    const errorResponse: APIGatewayProxyResult = {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };

    if (callback) {
      callback(null, errorResponse);
    }

    return errorResponse;
  }
};

export default handler;
