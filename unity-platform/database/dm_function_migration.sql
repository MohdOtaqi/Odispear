-- Migration: Create get_or_create_dm_channel function
-- Date: 2024-10-23
-- Purpose: Fix DM creation by adding database function for channel management

-- Drop old function if exists
DROP FUNCTION IF EXISTS get_or_create_dm_channel(UUID, UUID);

-- Create the function to get or create DM channels
CREATE OR REPLACE FUNCTION get_or_create_dm_channel(
  user1_id UUID,
  user2_id UUID
) RETURNS UUID AS $$
DECLARE
  channel_id UUID;
BEGIN
  -- Check if DM channel already exists between these two users
  SELECT dmc.id INTO channel_id
  FROM dm_channels dmc
  JOIN dm_participants dp1 ON dp1.dm_channel_id = dmc.id
  JOIN dm_participants dp2 ON dp2.dm_channel_id = dmc.id
  WHERE dmc.type = 'dm'
    AND dp1.user_id = user1_id
    AND dp2.user_id = user2_id
  LIMIT 1;
  
  -- If no existing channel found, create a new one
  IF channel_id IS NULL THEN
    -- Create the DM channel
    INSERT INTO dm_channels (type, created_at, updated_at)
    VALUES ('dm', NOW(), NOW())
    RETURNING id INTO channel_id;
    
    -- Add both participants to the channel
    INSERT INTO dm_participants (dm_channel_id, user_id, joined_at)
    VALUES 
      (channel_id, user1_id, NOW()),
      (channel_id, user2_id, NOW());
  END IF;
  
  RETURN channel_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to the application user
GRANT EXECUTE ON FUNCTION get_or_create_dm_channel TO unity_app;

-- Verify the function was created
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'get_or_create_dm_channel';
