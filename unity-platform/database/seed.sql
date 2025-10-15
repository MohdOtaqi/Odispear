-- Sample data for development and testing

-- Insert sample users
INSERT INTO users (id, email, username, password_hash, display_name, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@unity.com', 'admin', '$2b$10$rKZHvJCq2rYTxQ5ij.gYHe5LqYXN5vGqH8kLM4JN5vL9QZo9Ng0rW', 'Admin User', 'online'),
('550e8400-e29b-41d4-a716-446655440001', 'user1@unity.com', 'gamer1', '$2b$10$rKZHvJCq2rYTxQ5ij.gYHe5LqYXN5vGqH8kLM4JN5vL9QZo9Ng0rW', 'Pro Gamer', 'online'),
('550e8400-e29b-41d4-a716-446655440002', 'user2@unity.com', 'designer', '$2b$10$rKZHvJCq2rYTxQ5ij.gYHe5LqYXN5vGqH8kLM4JN5vL9QZo9Ng0rW', 'Creative Designer', 'idle')
ON CONFLICT (id) DO NOTHING;

-- Insert sample guild
INSERT INTO guilds (id, name, description, owner_id, template_type) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'Unity Gaming Community', 'A place for gamers to connect and compete', '550e8400-e29b-41d4-a716-446655440000', 'esports')
ON CONFLICT (id) DO NOTHING;

-- Add guild members
INSERT INTO guild_members (guild_id, user_id) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (guild_id, user_id) DO NOTHING;

-- Create default roles
INSERT INTO roles (id, guild_id, name, permissions, position) VALUES
('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '@everyone', 3, 0),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', 'Moderator', 16383, 1),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', 'Admin', 8191, 2)
ON CONFLICT (id) DO NOTHING;

-- Assign roles
INSERT INTO role_assignments (guild_id, user_id, role_id) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440002'),
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Create sample channels
INSERT INTO channels (id, guild_id, name, type, topic, position) VALUES
('880e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'general', 'text', 'General discussion', 0),
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', 'announcements', 'text', 'Important announcements', 1),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', 'team-chat', 'text', 'Team coordination', 2),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440000', 'General Voice', 'voice', NULL, 3),
('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440000', 'Team Voice', 'voice', NULL, 4)
ON CONFLICT (id) DO NOTHING;

-- Insert sample messages
INSERT INTO messages (channel_id, author_id, content) VALUES
('880e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Welcome to Unity Gaming Community!'),
('880e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Thanks! Excited to be here!'),
('880e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Looking forward to the upcoming tournaments!');

-- Create sample event
INSERT INTO events (id, guild_id, creator_id, name, description, event_type, start_time, max_participants) VALUES
('990e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Weekly Tournament', 'Join us for our weekly esports tournament!', 'tournament', NOW() + INTERVAL '7 days', 32)
ON CONFLICT (id) DO NOTHING;
