import Fastify from 'fastify';
import { todoRoutes } from './routes/todo';

// Fastifyのインスタンスを作成
const app = Fastify({ logger: true });

// Todoのルーティングを登録
app.register(todoRoutes);

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: '0.0.0.0' });