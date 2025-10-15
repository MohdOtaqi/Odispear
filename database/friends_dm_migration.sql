-- Migration for Friends and Direct Messages System
-- Run this after the main schema.sql

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Direct Message Channels table
CREATE TABLE IF NOT EXISTS dm_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) DEFAULT 'dm' CHECK (type IN ('dm', 'group_dm')),
  name VARCHAR(100), -- Only for group DMs
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DM Channel Participants table (supports 1-on-1 and group DMs)
CREATE TABLE IF NOT EXISTS dm_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dm_channel_id UUID NOT NULL REFERENCES dm_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_message_id UUID,
  UNIQUE(dm_channel_id, user_id)
);

CREATE INDEX idx_dm_participants_channel ON dm_participants(dm_channel_id);
CREATE INDEX idx_dm_participants_user ON dm_participants(user_id);

-- DM Messages table
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dm_channel_id UUID NOT NULL REFERENCES dm_channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES dm_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_dm_messages_channel ON dm_messages(dm_channel_id);
CREATE INDEX idx_dm_messages_author ON dm_messages(author_id);
CREATE INDEX idx_dm_messages_created ON dm_messages(created_at DESC);

-- DM Message Attachments table
CREATE TABLE IF NOT EXISTS dm_message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dm_attachments_message ON dm_message_attachments(message_id);

-- DM Message Reactions table
CREATE TABLE IF NOT EXISTS dm_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_dm_reactions_message ON dm_message_reactions(message_id);
CREATE INDEX idx_dm_reactions_user ON dm_message_reactions(user_id);

-- User Presence (for online status)
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  status_text VARCHAR(200),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_presence_status ON user_presence(status);

-- Apply updated_at triggers
CREATE TRIGGER update_friendships_updated_at 
  BEFORE UPDATE ON friendships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dm_channels_updated_at 
  BEFORE UPDATE ON dm_channels 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at 
  BEFORE UPDATE ON user_presence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create or get DM channel between two users
CREATE OR REPLACE FUNCTION get_or_create_dm_channel(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  channel_id UUID;
BEGIN
  -- Try to find existing DM channel
  SELECT dmc.id INTO channel_id
  FROM dm_channels dmc
  WHERE dmc.type = 'dm'
  AND EXISTS (
    SELECT 1 FROM dm_participants dp1
    WHERE dp1.dm_channel_id = dmc.id AND dp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM dm_participants dp2
    WHERE dp2.dm_channel_id = dmc.id AND dp2.user_id = user2_id
  )
  AND (SELECT COUNT(*) FROM dm_participants WHERE dm_channel_id = dmc.id) = 2
  LIMIT 1;

  -- If not found, create new DM channel
  IF channel_id IS NULL THEN
    INSERT INTO dm_channels (type) VALUES ('dm') RETURNING id INTO channel_id;
    INSERT INTO dm_participants (dm_channel_id, user_id) VALUES (channel_id, user1_id);
    INSERT INTO dm_participants (dm_channel_id, user_id) VALUES (channel_id, user2_id);
  END IF;

  RETURN channel_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get friend request count
CREATE OR REPLACE FUNCTION get_pending_friend_requests(for_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM friendships
    WHERE friend_id = for_user_id
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql;
