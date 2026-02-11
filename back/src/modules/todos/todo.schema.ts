import { z } from 'zod';

/**
 * Todo 作成用スキーマ
 */
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

/**
 * Todo 更新用スキーマ
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは1文字以上必要です')
    .max(200, 'タイトルは200文字以内で入力してください')
    .optional(),
  completed: z.boolean().optional(),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

/**
 * Todo ID パラメータスキーマ
 */
export const todoIdParamSchema = z.object({
  id: z.string().uuid('有効なUUIDを指定してください'),
});

export type TodoIdParam = z.infer<typeof todoIdParamSchema>;
