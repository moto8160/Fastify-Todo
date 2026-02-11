/**
 * API レスポンスの共通型
 */
export interface ApiResponse<T = unknown> {
  data: T;
}

/**
 * エラーレスポンスの型
 */
export interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
  };
}
