-- MOT Platform Complete Database Setup
-- Run this file to create all tables in PostgreSQL
-- Usage: psql -U postgres -d mot_platform -f complete_setup.sql

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  status_text VARCHAR(200),
  custom_status VARCHAR(200),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- ============================================
-- GUILDS (SERVERS) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guilds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_type VARCHAR(50) CHECK (template_type IN ('community', 'esports', 'study', 'custom')),
  verification_level INTEGER DEFAULT 0,
  default_message_notifications INTEGER DEFAULT 0,
  explicit_content_filter INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guilds_owner ON guilds(owner_id);

-- ============================================
-- GUILD MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guild_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(100),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  muted BOOLEAN DEFAULT FALSE,
  deafened BOOLEAN DEFAULT FALSE,
  UNIQUE(guild_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user ON guild_members(user_id);

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  position INTEGER DEFAULT 0,
  permissions BIGINT DEFAULT 0,
  mentionable BOOLEAN DEFAULT TRUE,
  hoisted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_guild ON roles(guild_id);

-- ============================================
-- ROLE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON role_assignments(role_id);

-- ============================================
-- CHANNELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'voice', 'stage', 'docs', 'category')),
  topic TEXT,
  position INTEGER DEFAULT 0,
  parent_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  nsfw BOOLEAN DEFAULT FALSE,
  rate_limit_per_user INTEGER DEFAULT 0,
  bitrate INTEGER,
  user_limit INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_channels_guild ON channels(guild_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_parent ON channels(parent_id);

-- ============================================
-- CHANNEL PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS channel_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  allow BIGINT DEFAULT 0,
  deny BIGINT DEFAULT 0,
  CONSTRAINT check_role_or_user CHECK ((role_id IS NOT NULL AND user_id IS NULL) OR (role_id IS NULL AND user_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_channel_permissions_channel ON channel_permissions(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_permissions_role ON channel_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_channel_permissions_user ON channel_permissions(user_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  pinned BOOLEAN DEFAULT FALSE,
  type VARCHAR(20) DEFAULT 'default' CHECK (type IN ('default', 'system', 'reply', 'thread_starter')),
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  thread_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);

-- ============================================
-- MESSAGE ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- ============================================
-- MESSAGE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);

-- ============================================
-- VOICE SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT,
  recording_url TEXT,
  muted BOOLEAN DEFAULT FALSE,
  deafened BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_channel ON voice_sessions(channel_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'general' CHECK (event_type IN ('general', 'tournament', 'meeting', 'stream')),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  location TEXT,
  max_participants INTEGER,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_guild ON events(guild_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- ============================================
-- EVENT RSVPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps(user_id);

-- ============================================
-- TOURNAMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  bracket_type VARCHAR(50) DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  team_size INTEGER DEFAULT 1,
  max_teams INTEGER,
  bracket_data JSONB,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tournaments_guild ON tournaments(guild_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_event ON tournaments(event_id);

-- ============================================
-- TOURNAMENT TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name VARCHAR(100) NOT NULL,
  captain_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seed INTEGER,
  eliminated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament ON tournament_teams(tournament_id);

-- ============================================
-- TOURNAMENT TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES tournament_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_team_members_team ON tournament_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_team_members_user ON tournament_team_members(user_id);

-- ============================================
-- TOURNAMENT MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  team1_id UUID REFERENCES tournament_teams(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES tournament_teams(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament_teams(id) ON DELETE SET NULL,
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  scheduled_time TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  voice_channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_teams ON tournament_matches(team1_id, team2_id);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_guild ON documents(guild_id);
CREATE INDEX IF NOT EXISTS idx_documents_channel ON documents(channel_id);

-- ============================================
-- INVITES TABLE (OLD - for backwards compatibility)
-- ============================================
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 0,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_guild ON invites(guild_id);

-- ============================================
-- GUILD INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guild_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uses INTEGER DEFAULT 0,
  max_uses INTEGER,
  max_age INTEGER,
  temporary BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guild_invites_code ON guild_invites(code);
CREATE INDEX IF NOT EXISTS idx_guild_invites_guild ON guild_invites(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_invites_creator ON guild_invites(creator_id);
CREATE INDEX IF NOT EXISTS idx_guild_invites_expires ON guild_invites(expires_at);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(100),
  target_id UUID,
  changes JSONB,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_guild ON audit_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- MODERATION ACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('warn', 'mute', 'kick', 'ban', 'timeout')),
  reason TEXT,
  expires_at TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_guild ON moderation_actions(guild_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user ON moderation_actions(user_id);

-- ============================================
-- BANNED USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_banned_users_guild ON banned_users(guild_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_user ON banned_users(user_id);

-- ============================================
-- WORD FILTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS word_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  action VARCHAR(50) DEFAULT 'delete' CHECK (action IN ('delete', 'warn', 'timeout')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_word_filters_guild ON word_filters(guild_id);

-- ============================================
-- WEBHOOKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhooks_guild ON webhooks(guild_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_channel ON webhooks(channel_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_token ON webhooks(token);

-- ============================================
-- BOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  public BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bots_user ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_owner ON bots(owner_id);
CREATE INDEX IF NOT EXISTS idx_bots_token ON bots(token);

-- ============================================
-- INTEGRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('twitch', 'youtube', 'github', 'google_calendar', 'custom')),
  name VARCHAR(100) NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_guild ON integrations(guild_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- FRIENDSHIPS TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- ============================================
-- DM CHANNELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dm_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) DEFAULT 'dm' CHECK (type IN ('dm', 'group_dm')),
  name VARCHAR(100),
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DM PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dm_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dm_channel_id UUID NOT NULL REFERENCES dm_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_message_id UUID,
  UNIQUE(dm_channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_participants_channel ON dm_participants(dm_channel_id);
CREATE INDEX IF NOT EXISTS idx_dm_participants_user ON dm_participants(user_id);

-- ============================================
-- DM MESSAGES TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_dm_messages_channel ON dm_messages(dm_channel_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_author ON dm_messages(author_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created ON dm_messages(created_at DESC);

-- ============================================
-- DM MESSAGE ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dm_message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dm_attachments_message ON dm_message_attachments(message_id);

-- ============================================
-- DM MESSAGE REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dm_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON dm_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_user ON dm_message_reactions(user_id);

-- ============================================
-- USER PRESENCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  status_text VARCHAR(200),
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);

-- ============================================
-- SOUNDBOARD SOUNDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS soundboard_sounds (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  emoji VARCHAR(10) DEFAULT '🔊',
  duration INTEGER DEFAULT 0,
  volume INTEGER DEFAULT 100,
  user_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(255),
  category VARCHAR(100) DEFAULT 'custom',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_soundboard_sounds_guild_id ON soundboard_sounds(guild_id);
CREATE INDEX IF NOT EXISTS idx_soundboard_sounds_user_id ON soundboard_sounds(user_id);

-- ============================================
-- SOUNDBOARD FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS soundboard_favorites (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  sound_id VARCHAR(255) NOT NULL REFERENCES soundboard_sounds(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_sound_favorite UNIQUE(user_id, sound_id)
);

CREATE INDEX IF NOT EXISTS idx_soundboard_favorites_user ON soundboard_favorites(user_id);

-- ============================================
-- SOUNDBOARD PLAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS soundboard_plays (
  id SERIAL PRIMARY KEY,
  sound_id VARCHAR(255) NOT NULL REFERENCES soundboard_sounds(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255),
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_soundboard_plays_sound ON soundboard_plays(sound_id);
CREATE INDEX IF NOT EXISTS idx_soundboard_plays_user ON soundboard_plays(user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DO $$
BEGIN
  -- Users
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Guilds
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_guilds_updated_at') THEN
    CREATE TRIGGER update_guilds_updated_at BEFORE UPDATE ON guilds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Channels
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_channels_updated_at') THEN
    CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Events
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_updated_at') THEN
    CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Friendships
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_friendships_updated_at') THEN
    CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- DM Channels
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dm_channels_updated_at') THEN
    CREATE TRIGGER update_dm_channels_updated_at BEFORE UPDATE ON dm_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- User Presence
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_presence_updated_at') THEN
    CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to get or create DM channel between two users
CREATE OR REPLACE FUNCTION get_or_create_dm_channel(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  channel_id UUID;
BEGIN
  SELECT dmc.id INTO channel_id
  FROM dm_channels dmc
  WHERE dmc.type = 'dm'
  AND EXISTS (SELECT 1 FROM dm_participants dp1 WHERE dp1.dm_channel_id = dmc.id AND dp1.user_id = user1_id)
  AND EXISTS (SELECT 1 FROM dm_participants dp2 WHERE dp2.dm_channel_id = dmc.id AND dp2.user_id = user2_id)
  AND (SELECT COUNT(*) FROM dm_participants WHERE dm_channel_id = dmc.id) = 2
  LIMIT 1;

  IF channel_id IS NULL THEN
    INSERT INTO dm_channels (type) VALUES ('dm') RETURNING id INTO channel_id;
    INSERT INTO dm_participants (dm_channel_id, user_id) VALUES (channel_id, user1_id);
    INSERT INTO dm_participants (dm_channel_id, user_id) VALUES (channel_id, user2_id);
  END IF;

  RETURN channel_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending friend requests count
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

-- ============================================
-- COMPLETE!
-- ============================================
SELECT 'MOT Platform database setup complete!' AS status;
