// pg types are provided at runtime; suppress type requirement for build
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Check if SSL is required (for AWS RDS)
const databaseUrl = process.env.DATABASE_URL || '';
const isSSL = databaseUrl.includes('sslmode=require') ||
  databaseUrl.includes('rds.amazonaws.com') ||
  databaseUrl.includes('ssl=true');

console.log('[Database] SSL mode:', isSSL ? 'enabled' : 'disabled');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Allow self-signed certificates for AWS RDS
  ssl: isSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err: any) => {
  console.error('Unexpected database error:', err);
});

export default pool;

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};
