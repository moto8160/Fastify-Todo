import { createApp } from './app.js';
import { env } from './config/env.js';

/**
 * サーバー起動
 */
async function start() {
  try {
    const app = await createApp();

    await app.listen({
      port: env.port,
      host: env.host,
    });

    console.log(`
🚀 Server is running!
   - Environment: ${env.nodeEnv}
   - URL: http://${env.host}:${env.port}
   - Health: http://${env.host}:${env.port}/health
    `);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Server shutting down...');
  process.exit(0);
});

start();
