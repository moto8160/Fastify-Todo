/**
 * アプリケーションエラー基底クラス
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * バリデーションエラー (400)
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/**
 * リソースが見つからない (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}
