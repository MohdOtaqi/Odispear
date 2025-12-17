-- Guild Invites Table Migration
-- Stores server invitation links

CREATE TABLE IF NOT EXISTS guild_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uses INTEGER DEFAULT 0,
    max_uses INTEGER, -- NULL means unlimited
    max_age INTEGER, -- Seconds until expiry, NULL means never
    temporary BOOLEAN DEFAULT FALSE, -- Kick after disconnect if true
    expires_at TIMESTAMP, -- Calculated from max_age
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guild_invites_code ON guild_invites(code);
CREATE INDEX idx_guild_invites_guild ON guild_invites(guild_id);
CREATE INDEX idx_guild_invites_creator ON guild_invites(creator_id);
CREATE INDEX idx_guild_invites_expires ON guild_invites(expires_at);
