-- Voice Sessions Table
CREATE TABLE IF NOT EXISTS voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP,
    muted BOOLEAN DEFAULT false,
    deafened BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure user can only be in one session per channel at a time
    CONSTRAINT unique_active_session UNIQUE (channel_id, user_id, left_at)
);

-- Indexes for performance
CREATE INDEX idx_voice_sessions_channel ON voice_sessions(channel_id) WHERE left_at IS NULL;
CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_voice_sessions_active ON voice_sessions(channel_id, user_id) WHERE left_at IS NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_voice_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_sessions_updated_at
    BEFORE UPDATE ON voice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_session_timestamp();

-- Function to get active voice users in a channel
CREATE OR REPLACE FUNCTION get_voice_channel_users(p_channel_id UUID)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    avatar_url TEXT,
    muted BOOLEAN,
    deafened BOOLEAN,
    joined_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vs.user_id,
        u.username,
        u.avatar_url,
        vs.muted,
        vs.deafened,
        vs.joined_at
    FROM voice_sessions vs
    JOIN users u ON vs.user_id = u.id
    WHERE vs.channel_id = p_channel_id 
      AND vs.left_at IS NULL
    ORDER BY vs.joined_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old voice sessions (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_voice_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sessions older than 30 days
    DELETE FROM voice_sessions 
    WHERE left_at IS NOT NULL 
      AND left_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE voice_sessions IS 'Tracks users in voice channels with their audio states';
