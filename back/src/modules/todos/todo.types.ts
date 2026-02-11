/**
 * Todo エンティティ
 */
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Todo 作成用 DTO
 */
export interface CreateTodoDto {
  title: string;
}

/**
 * Todo 更新用 DTO
 */
export interface UpdateTodoDto {
  title?: string;
  completed?: boolean;
}
