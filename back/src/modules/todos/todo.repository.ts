import { randomUUID } from 'node:crypto';
import { CreateTodoDto, Todo, UpdateTodoDto } from './todo.types.js';

/**
 * TodoRepository - データアクセス層
 */
export class TodoRepository {
  private todos: Todo[] = [];

  /**
   * 全件取得
   */
  async findAll(): Promise<Todo[]> {
    return [...this.todos]; //このクラスのインスタンス変数にアクセス
  }

  /**
   * ID で1件取得
   */
  async findById(id: string): Promise<Todo | null> {
    const todo = this.todos.find((t) => t.id === id);
    return todo ?? null;
  }

  /**
   * 新規作成
   */
  async create(data: CreateTodoDto): Promise<Todo> {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: randomUUID(),
      title: data.title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.push(todo);
    return todo;
  }

  /**
   * 更新
   */
  async update(id: string, data: UpdateTodoDto): Promise<Todo | null> {
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return null;
    }

    this.todos[index] = {
      ...this.todos[index],
      ...(data.title !== undefined && { title: data.title }),
      ...(data.completed !== undefined && { completed: data.completed }),
      updatedAt: new Date().toISOString(),
    };

    return this.todos[index];
  }

  /**
   * 削除
   */
  async delete(id: string): Promise<boolean> {
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return false;
    }

    this.todos.splice(index, 1);
    return true;
  }
}
