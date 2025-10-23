-- Migration: Add bio and banner_url to users table
-- This enables users to customize their profiles with biographical information and banner images

-- Add bio column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'bio'
    ) THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
        RAISE NOTICE 'Column bio added to users table';
    ELSE
        RAISE NOTICE 'Column bio already exists';
    END IF;
END $$;

-- Add banner_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'banner_url'
    ) THEN
        ALTER TABLE users ADD COLUMN banner_url TEXT;
        RAISE NOTICE 'Column banner_url added to users table';
    ELSE
        RAISE NOTICE 'Column banner_url already exists';
    END IF;
END $$;

COMMIT;
