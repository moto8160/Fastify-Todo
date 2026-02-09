import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { CreateTodoInput, Todo } from '../types/todo';

// Todoの空配列を作成
let todos: Todo[] = [];
let id = 1;

export async function todoRoutes(app: FastifyInstance) {
  // GET /todos
  app.get('/todos', async () => {
    return todos;
  });

  // POST /todos
  app.post(
    '/todos',
    async (request: FastifyRequest<{ Body: CreateTodoInput }>, reply: FastifyReply) => {
      const { title } = request.body;

      const newTodo = {
        id: id++,
        title,
        completed: false,
      };

      todos.push(newTodo);
      reply.status(201).send(newTodo);
    },
  );

  // UPDATE /todos/:id
  app.put(
    '/todos/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const todoId = Number(request.params.id);

      if (!Number.isInteger(todoId)) {
        return reply.status(400).send({ message: 'Invalid id' });
      }

      const todo = todos.find((t) => t.id === todoId);

      if (!todo) {
        reply.status(404).send({ message: 'Todo not found' });
        return;
      }

      todo.completed = true;
      return todo;
    },
  );

  // DELETE /todos/:id
  app.delete(
    '/todos/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const todoId = Number(request.params.id);

      if (!Number.isInteger(todoId)) {
        return reply.status(400).send({ message: 'Invalid id' });
      }

      const todo = todos.find((t) => t.id === todoId);

      if (!todo) {
        reply.status(404).send({ message: 'Todo not found' });
        return;
      }

      todos = todos.filter((t) => t.id !== todoId);
      return reply.code(204).send();
    },
  );
}
