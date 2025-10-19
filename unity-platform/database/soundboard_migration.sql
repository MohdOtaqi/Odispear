-- Soundboard Tables Migration
-- Run this after the main schema.sql

-- Soundboard sounds table
CREATE TABLE IF NOT EXISTS soundboard_sounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    emoji VARCHAR(10) DEFAULT '🔊',
    duration DECIMAL(10,2) DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
    category VARCHAR(50) DEFAULT 'custom',
    volume INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT check_volume CHECK (volume >= 0 AND volume <= 200)
);

-- Soundboard favorites table
CREATE TABLE IF NOT EXISTS soundboard_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sound_id UUID NOT NULL REFERENCES soundboard_sounds(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, sound_id)
);

-- Soundboard play history
CREATE TABLE IF NOT EXISTS soundboard_plays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sound_id UUID NOT NULL REFERENCES soundboard_sounds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    played_at TIMESTAMP DEFAULT NOW()
);

-- Server boost table
CREATE TABLE IF NOT EXISTS guild_boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier INTEGER DEFAULT 1,
    started_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    active BOOLEAN DEFAULT true,
    CONSTRAINT check_tier CHECK (tier >= 1 AND tier <= 3)
);

-- Server templates improvements
CREATE TABLE IF NOT EXISTS server_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    icon_url TEXT,
    is_official BOOLEAN DEFAULT false,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guild_snapshot JSONB NOT NULL,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled events improvements
CREATE TABLE IF NOT EXISTS scheduled_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'stage', 'voice', 'external'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location TEXT,
    cover_image TEXT,
    interested_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Event attendees
CREATE TABLE IF NOT EXISTS event_attendees (
    event_id UUID NOT NULL REFERENCES scheduled_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- 'interested', 'going', 'maybe'
    responded_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- Custom keybinds
CREATE TABLE IF NOT EXISTS user_keybinds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    keybind VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, action)
);

-- AutoMod rules
CREATE TABLE IF NOT EXISTS automod_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'keyword', 'spam', 'caps', 'links', 'invites'
    trigger_config JSONB NOT NULL,
    action_config JSONB NOT NULL,
    exempt_roles UUID[] DEFAULT '{}',
    exempt_channels UUID[] DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AutoMod actions log
CREATE TABLE IF NOT EXISTS automod_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES automod_rules(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    message_id UUID,
    action_type VARCHAR(50) NOT NULL, -- 'delete', 'timeout', 'warn', 'kick', 'ban'
    reason TEXT,
    content TEXT,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_soundboard_guild ON soundboard_sounds(guild_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_soundboard_user ON soundboard_sounds(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_soundboard_favorites_user ON soundboard_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_soundboard_plays_sound ON soundboard_plays(sound_id);
CREATE INDEX IF NOT EXISTS idx_guild_boosts_guild ON guild_boosts(guild_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_guild_boosts_user ON guild_boosts(user_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_events_guild ON scheduled_events(guild_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_start ON scheduled_events(start_time);
CREATE INDEX IF NOT EXISTS idx_automod_rules_guild ON automod_rules(guild_id) WHERE enabled = true;
