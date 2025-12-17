// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  console.log('Running database migrations...');

  // List of migration files in order
  const migrationFiles = [
    'schema.sql',
    'friends_dm_migration.sql',
    'guild_invites_migration.sql',
    'add_user_columns_migration.sql',
    'user_profile_enhancement_migration.sql',
    'soundboard_migration.sql',
    'voice_sessions.sql',
  ];

  const databasePath = path.join(__dirname, '../../../database');

  for (const file of migrationFiles) {
    const filePath = path.join(databasePath, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠ Migration file not found: ${file} - skipping`);
      continue;
    }

    try {
      const sql = fs.readFileSync(filePath, 'utf-8');
      await pool.query(sql);
      console.log(`✓ ${file} executed successfully`);
    } catch (error: unknown) {
      const pgError = error as { code?: string; message?: string };
      // Ignore "already exists" errors (42P07 for relations, 42710 for objects)
      if (pgError.code === '42P07' || pgError.code === '42710') {
        console.log(`✓ ${file} - tables already exist, skipping`);
      } else if (pgError.message?.includes('already exists')) {
        console.log(`✓ ${file} - objects already exist, skipping`);
      } else {
        console.error(`✗ ${file} failed:`, error);
        // Continue with other migrations instead of stopping
      }
    }
  }

  // Check if seed data should be loaded
  if (process.env.LOAD_SEED_DATA === 'true') {
    const seedPath = path.join(databasePath, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      try {
        const seed = fs.readFileSync(seedPath, 'utf-8');
        await pool.query(seed);
        console.log('✓ Seed data loaded successfully');
      } catch (error) {
        console.log('⚠ Seed data may already exist, skipping');
      }
    }
  }

  console.log('✓ All migrations completed');
  await pool.end();
}

runMigrations();
