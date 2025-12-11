import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: RedisClientType | null = null;
let redisEnabled = true;

// Only create Redis client if REDIS_URL is set and we're not explicitly disabling it
if (process.env.REDIS_URL && process.env.DISABLE_REDIS !== 'true') {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on('error', (err) => {
    console.warn('Redis Client Error (Redis features disabled):', err.message);
    redisEnabled = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis client connected');
    redisEnabled = true;
  });
}

export const connectRedis = async () => {
  if (!redisClient) {
    console.log('Redis not configured - running without Redis (some features may be limited)');
    return null;
  }
  
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    return redisClient;
  } catch (error) {
    console.warn('Failed to connect to Redis - running without Redis');
    redisEnabled = false;
    return null;
  }
};

export const isRedisEnabled = () => redisEnabled && redisClient?.isOpen;

export default redisClient;
