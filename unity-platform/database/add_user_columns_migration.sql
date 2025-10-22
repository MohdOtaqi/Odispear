-- Add missing columns to users table
-- Migration: Add last_seen and custom_status columns

-- Add last_seen column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_seen'
    ) THEN
        ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Column last_seen added to users table';
    ELSE
        RAISE NOTICE 'Column last_seen already exists';
    END IF;
END $$;

-- Add custom_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'custom_status'
    ) THEN
        ALTER TABLE users ADD COLUMN custom_status VARCHAR(200);
        RAISE NOTICE 'Column custom_status added to users table';
    ELSE
        RAISE NOTICE 'Column custom_status already exists';
    END IF;
END $$;

-- Create index on last_seen for better query performance
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Update existing users to have current timestamp as last_seen
UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE last_seen IS NULL;

COMMIT;
