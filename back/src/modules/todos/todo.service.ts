import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { TodoRepository } from './todo.repository.js';
import { CreateTodoDto, Todo, UpdateTodoDto } from './todo.types.js';

/**
 * TodoService - ビジネスロジック層
 */
export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * Todo 一覧取得
   */
  async getAllTodos(): Promise<Todo[]> {
    return await this.todoRepository.findAll();
  }

  /**
   * Todo 詳細取得
   */
  async getTodoById(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundError(`ID: ${id} のTodoが見つかりません`);
    }
    return todo;
  }

  /**
   * Todo 作成
   */
  async createTodo(data: CreateTodoDto): Promise<Todo> {
    // ビジネスルール: タイトルが空白のみでないかチェック
    if (data.title.trim().length === 0) {
      throw new ValidationError('タイトルは空白のみにできません');
    }

    return await this.todoRepository.create({
      title: data.title.trim(),
    });
  }

  /**
   * Todo 更新
   */
  async updateTodo(id: string, data: UpdateTodoDto): Promise<Todo> {
    // 存在チェック
    const existingTodo = await this.todoRepository.findById(id);
    if (!existingTodo) {
      throw new NotFoundError(`ID: ${id} のTodoが見つかりません`);
    }

    // ビジネスルール: タイトルが指定されている場合、空白のみでないかチェック
    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new ValidationError('タイトルは空白のみにできません');
    }

    const updateData: UpdateTodoDto = {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.completed !== undefined && { completed: data.completed }),
    };

    const updatedTodo = await this.todoRepository.update(id, updateData);
    if (!updatedTodo) {
      throw new NotFoundError(`ID: ${id} のTodoが見つかりません`);
    }

    return updatedTodo;
  }

  /**
   * Todo 削除
   */
  async deleteTodo(id: string): Promise<void> {
    const deleted = await this.todoRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`ID: ${id} のTodoが見つかりません`);
    }
  }
}
