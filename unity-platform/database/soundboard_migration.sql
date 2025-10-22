-- Soundboard Tables Migration
-- Create soundboard sounds table
CREATE TABLE IF NOT EXISTS soundboard_sounds (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    emoji VARCHAR(10) DEFAULT '🔊',
    duration INTEGER DEFAULT 0,
    volume INTEGER DEFAULT 100,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guild_id VARCHAR(255) REFERENCES guilds(id) ON DELETE CASCADE,
    category VARCHAR(100) DEFAULT 'custom',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT unique_sound_name_per_guild UNIQUE(name, guild_id)
);

-- Create soundboard favorites table
CREATE TABLE IF NOT EXISTS soundboard_favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sound_id VARCHAR(255) NOT NULL REFERENCES soundboard_sounds(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_sound_favorite UNIQUE(user_id, sound_id)
);

-- Create soundboard plays tracking table
CREATE TABLE IF NOT EXISTS soundboard_plays (
    id SERIAL PRIMARY KEY,
    sound_id VARCHAR(255) NOT NULL REFERENCES soundboard_sounds(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id VARCHAR(255),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_soundboard_sounds_guild_id ON soundboard_sounds(guild_id);
CREATE INDEX IF NOT EXISTS idx_soundboard_sounds_user_id ON soundboard_sounds(user_id);
CREATE INDEX IF NOT EXISTS idx_soundboard_sounds_deleted ON soundboard_sounds(deleted_at);
CREATE INDEX IF NOT EXISTS idx_soundboard_favorites_user ON soundboard_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_soundboard_plays_sound ON soundboard_plays(sound_id);
CREATE INDEX IF NOT EXISTS idx_soundboard_plays_user ON soundboard_plays(user_id);

-- Add some default sounds for testing
INSERT INTO soundboard_sounds (id, name, url, emoji, duration, user_id, category) 
VALUES 
    ('default-1', 'Airhorn', '/sounds/airhorn.mp3', '📯', 2, 'system', 'default'),
    ('default-2', 'Applause', '/sounds/applause.mp3', '👏', 3, 'system', 'default'),
    ('default-3', 'Laugh', '/sounds/laugh.mp3', '😂', 2, 'system', 'default'),
    ('default-4', 'Sad Trombone', '/sounds/sad-trombone.mp3', '🎺', 3, 'system', 'default'),
    ('default-5', 'Victory', '/sounds/victory.mp3', '🎉', 2, 'system', 'default')
ON CONFLICT DO NOTHING;