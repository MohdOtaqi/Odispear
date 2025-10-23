-- First, check the actual structure of dm_channels table
\d dm_channels

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS get_or_create_dm_channel(UUID, UUID);

-- Create the corrected function based on actual table structure
CREATE OR REPLACE FUNCTION get_or_create_dm_channel(
  user1_id UUID,
  user2_id UUID
) RETURNS UUID AS $$
DECLARE
  channel_id UUID;
BEGIN
  -- Check if DM channel already exists using dm_participants table
  SELECT dmc.id INTO channel_id
  FROM dm_channels dmc
  JOIN dm_participants dp1 ON dp1.dm_channel_id = dmc.id
  JOIN dm_participants dp2 ON dp2.dm_channel_id = dmc.id
  WHERE dmc.type = 'dm'
    AND dp1.user_id = user1_id
    AND dp2.user_id = user2_id
  LIMIT 1;
  
  -- If not found, create new DM channel
  IF channel_id IS NULL THEN
    -- Create the channel
    INSERT INTO dm_channels (type, created_at, updated_at)
    VALUES ('dm', NOW(), NOW())
    RETURNING id INTO channel_id;
    
    -- Add both participants
    INSERT INTO dm_participants (dm_channel_id, user_id)
    VALUES 
      (channel_id, user1_id),
      (channel_id, user2_id);
  END IF;
  
  RETURN channel_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_dm_channel TO unity_app;

-- Test the function
SELECT proname FROM pg_proc WHERE proname = 'get_or_create_dm_channel';
