-- Unity Platform - SQL Fix for DM Creation

-- 1. Check if the function exists
SELECT proname FROM pg_proc WHERE proname = 'get_or_create_dm_channel';

-- 2. If it doesn't exist, create it
CREATE OR REPLACE FUNCTION get_or_create_dm_channel(
  user1_id UUID,
  user2_id UUID
) RETURNS UUID AS $$
DECLARE
  channel_id UUID;
BEGIN
  -- Check if DM channel already exists
  SELECT id INTO channel_id
  FROM dm_channels
  WHERE type = 'dm'
    AND ((user1_id = ANY(participant_ids) AND user2_id = ANY(participant_ids)))
  LIMIT 1;
  
  -- If not found, create new DM channel
  IF channel_id IS NULL THEN
    INSERT INTO dm_channels (type, participant_ids, created_at, updated_at)
    VALUES ('dm', ARRAY[user1_id, user2_id], NOW(), NOW())
    RETURNING id INTO channel_id;
  END IF;
  
  RETURN channel_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION get_or_create_dm_channel TO unity_app;

-- 4. Check friendships table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'friendships'
);

-- 5. If friendships table doesn't exist, create it
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- 7. Add some test friendships (optional - for testing)
-- Replace with actual user IDs from your database
-- INSERT INTO friendships (user_id, friend_id, status)
-- SELECT u1.id, u2.id, 'accepted'
-- FROM users u1, users u2
-- WHERE u1.username = 'YOUR_USERNAME' 
-- AND u2.username = 'FRIEND_USERNAME'
-- ON CONFLICT DO NOTHING;
