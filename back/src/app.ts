import Fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { AppError } from './shared/errors.js';
import { ErrorResponse } from './shared/types.js';
import { todoRoutes } from './modules/todos/todo.routes.js';

/**
 * Fastify アプリケーション作成
 */
export async function createApp() {
  const app = Fastify({
    logger: {
      level: env.nodeEnv === 'production' ? 'info' : 'debug',
    },
  });

  // Zod バリデーション設定
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // CORS 設定
  await app.register(cors, {
    origin: env.corsOrigin,
    credentials: true,
  });

  // エラーハンドリング
  app.setErrorHandler(
    async (error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) => {
      request.log.error(error);

      // カスタムエラー
      if (error instanceof AppError) {
        const response: ErrorResponse = {
          error: {
            message: error.message,
            statusCode: error.statusCode,
          },
        };
        return reply.status(error.statusCode).send(response);
      }

      // バリデーションエラー
      if (error.validation) {
        const response: ErrorResponse = {
          error: {
            message: 'バリデーションエラー',
            statusCode: 400,
          },
        };
        return reply.status(400).send(response);
      }

      // その他のエラー
      const response: ErrorResponse = {
        error: {
          message: '内部サーバーエラーが発生しました',
          statusCode: 500,
        },
      };
      return reply.status(500).send(response);
    },
  );

  // ヘルスチェック
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // ルート登録
  await app.register(todoRoutes);

  return app;
}
