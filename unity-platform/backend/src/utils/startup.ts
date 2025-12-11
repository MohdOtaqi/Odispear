import pool from '../config/database';
import redisClient, { isRedisEnabled } from '../config/redis';
import logger from '../config/logger';

export async function performStartupChecks(): Promise<boolean> {
  logger.info('Performing startup checks...');

  let allPassed = true;

  // Check database connection
  try {
    await pool.query('SELECT NOW()');
    logger.info('✓ Database connection successful');
  } catch (error) {
    logger.error('✗ Database connection failed:', error);
    allPassed = false;
  }

  // Check Redis connection (optional)
  if (redisClient && process.env.DISABLE_REDIS !== 'true') {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await redisClient.ping();
      logger.info('✓ Redis connection successful');
    } catch (error) {
      logger.warn('⚠ Redis connection failed (running without Redis):', error);
      // Don't fail startup - Redis is optional for local dev
    }
  } else {
    logger.info('⚠ Redis disabled - running without Redis caching');
  }

  // Check required tables exist
  try {
    const tables = ['users', 'guilds', 'channels', 'messages'];
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      if (!result.rows[0].exists) {
        logger.error(`✗ Required table '${table}' does not exist`);
        allPassed = false;
      }
    }
    if (allPassed) {
      logger.info('✓ All required database tables exist');
    }
  } catch (error) {
    logger.error('✗ Table check failed:', error);
    allPassed = false;
  }

  return allPassed;
}
