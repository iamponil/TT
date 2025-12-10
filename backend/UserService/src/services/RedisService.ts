import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export const createRedisClient = async (): Promise<RedisClientType> => {
  if (client) return client;
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  client = createClient({
    socket: { host, port },
    password: password || undefined,
  });

  client.on('error', (err) => console.error('Redis Client Error', err));
  await client.connect();
  return client;
};

export const getRedisClient = (): RedisClientType => {
  if (!client) throw new Error('Redis client not initialized');
  return client;
};
