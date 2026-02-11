import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { TodoController } from './todo.controller.js';
import { TodoRepository } from './todo.repository.js';
import {
  createTodoSchema,
  CreateTodoInput,
  todoIdParamSchema,
  TodoIdParam,
  updateTodoSchema,
  UpdateTodoInput,
} from './todo.schema.js';
import { TodoService } from './todo.service.js';

/**
 * Todo 繝ｫ繝ｼ繝育匳骭ｲ
 */
export async function todoRoutes(app: FastifyInstance): Promise<void> {
  const todoRepository = new TodoRepository();
  const todoService = new TodoService(todoRepository);
  const todoController = new TodoController(todoService);

  const server = app.withTypeProvider<ZodTypeProvider>();

  // GET /api/todos - 荳隕ｧ蜿門ｾ・
  server.get('/api/todos', async (request, reply) => {
    return todoController.getTodos(request, reply);
  });

  // GET /api/todos/:id - 隧ｳ邏ｰ蜿門ｾ・
  server.get<{ Params: TodoIdParam }>(
    '/api/todos/:id',
    {
      schema: {
        params: todoIdParamSchema,
      },
    },
    async (request, reply) => {
      return todoController.getTodoById(request, reply);
    },
  );

  // POST /api/todos - 菴懈・
  server.post<{ Body: CreateTodoInput }>(
    '/api/todos',
    {
      schema: {
        body: createTodoSchema,
      },
    },
    async (request, reply) => {
      return todoController.createTodo(request, reply);
    },
  );

  // PATCH /api/todos/:id - 譖ｴ譁ｰ
  server.patch<{ Params: TodoIdParam; Body: UpdateTodoInput }>(
    '/api/todos/:id',
    {
      schema: {
        params: todoIdParamSchema,
        body: updateTodoSchema,
      },
    },
    async (request, reply) => {
      return todoController.updateTodo(request, reply);
    },
  );

  // DELETE /api/todos/:id - 蜑企勁
  server.delete<{ Params: TodoIdParam }>(
    '/api/todos/:id',
    {
      schema: {
        params: todoIdParamSchema,
      },
    },
    async (request, reply) => {
      return todoController.deleteTodo(request, reply);
    },
  );
}

