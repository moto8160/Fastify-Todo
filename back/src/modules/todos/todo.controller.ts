import { FastifyReply, FastifyRequest } from 'fastify';
import { ApiResponse } from '../../shared/types.js';
import { TodoService } from './todo.service.js';

/**
 * TodoController - 表現層
 */
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  /**
   * GET /api/todos - Todo一覧取得
   */
  async getTodos(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const todos = await this.todoService.getAllTodos();
    const response: ApiResponse = { data: todos };
    reply.status(200).send(response);
  }

  /**
   * GET /api/todos/:id - Todo詳細取得
   */
  async getTodoById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const todo = await this.todoService.getTodoById(id);
    const response: ApiResponse = { data: todo };
    reply.status(200).send(response);
  }

  /**
   * POST /api/todos - Todo作成
   */
  async createTodo(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as { title: string };
    const todo = await this.todoService.createTodo(body);
    const response: ApiResponse = { data: todo };
    reply.status(201).send(response);
  }

  /**
   * PATCH /api/todos/:id - Todo更新
   */
  async updateTodo(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const body = request.body as { title?: string; completed?: boolean };
    const todo = await this.todoService.updateTodo(id, body);
    const response: ApiResponse = { data: todo };
    reply.status(200).send(response);
  }

  /**
   * DELETE /api/todos/:id - Todo削除
   */
  async deleteTodo(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    await this.todoService.deleteTodo(id);
    reply.status(204).send();
  }
}
