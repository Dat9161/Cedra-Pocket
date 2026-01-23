-- Cedra Quest Database Initialization Script
-- This script creates all tables, enums, and initial data for the Cedra Quest project

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS pet_feeding_logs CASCADE;
DROP TABLE IF EXISTS user_energy CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS spin_history CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS daily_rewards CASCADE;
DROP TABLE IF EXISTS referral_logs CASCADE;
DROP TABLE IF EXISTS game_cycles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS pet_tier CASCADE;
DROP TYPE IF EXISTS quest_frequency CASCADE;
DROP TYPE IF EXISTS quest_status CASCADE;
DROP TYPE IF EXISTS quest_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS reward_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_rank CASCADE;

-- Create enums
CREATE TYPE pet_tier AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');
CREATE TYPE quest_frequency AS ENUM ('ONCE', 'DAILY', 'WEEKLY');
CREATE TYPE quest_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CLAIMED');
CREATE TYPE quest_type AS ENUM ('SOCIAL', 'ONCHAIN');
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'BANNED', 'SUSPENDED');
CREATE TYPE reward_type AS ENUM ('POINT', 'XP', 'SPIN', 'TOKEN');
CREATE TYPE transaction_type AS ENUM ('QUEST_REWARD', 'SPIN_REWARD', 'DAILY_REWARD', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT', 'WITHDRAWAL', 'PET_CLAIM', 'PET_FEED', 'PET_PLAY');
CREATE TYPE user_rank AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- Create users table
CREATE TABLE users (
    telegram_id BIGINT PRIMARY KEY,
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    public_key VARCHAR(255) NOT NULL,
    username_at_creation VARCHAR(255),
    username VARCHAR(255),
    is_wallet_connected BOOLEAN DEFAULT true,
    total_points BIGINT DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referrer_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    avatar_url VARCHAR(500),
    current_xp INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_daily_claim TIMESTAMPTZ,
    last_spin_reset TIMESTAMPTZ,
    level INTEGER DEFAULT 1,
    role user_role DEFAULT 'USER',
    spins_left INTEGER DEFAULT 3,
    status user_status DEFAULT 'ACTIVE',
    current_rank user_rank DEFAULT 'BRONZE',
    lifetime_points BIGINT DEFAULT 0,
    pet_current_xp INTEGER DEFAULT 0,
    pet_last_claim_time TIMESTAMPTZ DEFAULT NOW(),
    pet_level INTEGER DEFAULT 1,
    FOREIGN KEY (referrer_id) REFERENCES users(telegram_id)
);

-- Create indexes for users table
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_total_points ON users(total_points DESC);
CREATE INDEX idx_users_lifetime_points ON users(lifetime_points DESC);
CREATE INDEX idx_wallet_address ON users(wallet_address);

-- Create quests table
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type quest_type NOT NULL,
    category VARCHAR(50),
    config JSON DEFAULT '{}',
    reward_amount INTEGER DEFAULT 0,
    frequency quest_frequency DEFAULT 'ONCE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    icon_url VARCHAR(500),
    max_completions INTEGER,
    start_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    xp_reward INTEGER DEFAULT 0,
    reward_type reward_type DEFAULT 'POINT'
);

-- Create indexes for quests table
CREATE INDEX idx_quests_category ON quests(category);
CREATE INDEX idx_quests_is_active ON quests(is_active);
CREATE INDEX idx_quests_type ON quests(type);

-- Create user_quests table
CREATE TABLE user_quests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    quest_id INTEGER NOT NULL,
    status quest_status DEFAULT 'PENDING',
    proof_data JSON,
    completed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, quest_id),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

-- Create indexes for user_quests table
CREATE INDEX idx_user_quests_quest_id ON user_quests(quest_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);

-- Create pets table
CREATE TABLE pets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    max_exp INTEGER DEFAULT 100,
    hunger INTEGER DEFAULT 100,
    happiness INTEGER DEFAULT 100,
    last_coin_time TIMESTAMPTZ DEFAULT NOW(),
    pending_coins INTEGER DEFAULT 0,
    total_coins_earned BIGINT DEFAULT 0,
    coin_rate DECIMAL(10,2) DEFAULT 1.0,
    last_feed_time TIMESTAMPTZ,
    last_play_time TIMESTAMPTZ,
    tier pet_tier DEFAULT 'BRONZE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

-- Create indexes for pets table
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_last_coin_time ON pets(last_coin_time);

-- Create user_energy table
CREATE TABLE user_energy (
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    current_energy INTEGER DEFAULT 10,
    max_energy INTEGER DEFAULT 10,
    last_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

-- Create indexes for user_energy table
CREATE INDEX idx_user_energy_user_id ON user_energy(user_id);
CREATE INDEX idx_user_energy_last_update ON user_energy(last_update);

-- Create game_sessions table
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    energy_used INTEGER DEFAULT 1,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

-- Create indexes for game_sessions table
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at);

-- Create pet_feeding_logs table
CREATE TABLE pet_feeding_logs (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points_spent INTEGER NOT NULL,
    xp_gained INTEGER NOT NULL,
    feed_date VARCHAR(10) NOT NULL,
    total_daily_spent INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feed_date),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

-- Create indexes for pet_feeding_logs table
CREATE INDEX idx_pet_feeding_logs_user_id ON pet_feeding_logs(user_id);
CREATE INDEX idx_pet_feeding_logs_feed_date ON pet_feeding_logs(feed_date);

-- Create referral_logs table
CREATE TABLE referral_logs (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT NOT NULL,
    referee_id BIGINT NOT NULL,
    commission_amount INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    bonus_type VARCHAR(50)
);

-- Create indexes for referral_logs table
CREATE INDEX idx_referral_logs_created_at ON referral_logs(created_at);
CREATE INDEX idx_referral_logs_referee_id ON referral_logs(referee_id);
CREATE INDEX idx_referral_logs_referrer_id ON referral_logs(referrer_id);

-- Create daily_rewards table
CREATE TABLE daily_rewards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    day_number INTEGER NOT NULL,
    reward_amount INTEGER NOT NULL,
    reward_type reward_type DEFAULT 'POINT',
    claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for daily_rewards table
CREATE INDEX idx_daily_rewards_claimed_at ON daily_rewards(claimed_at);
CREATE INDEX idx_daily_rewards_user_id ON daily_rewards(user_id);

-- Create point_transactions table
CREATE TABLE point_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount INTEGER NOT NULL,
    type transaction_type NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for point_transactions table
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);

-- Create spin_history table
CREATE TABLE spin_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reward_amount INTEGER NOT NULL,
    reward_type reward_type DEFAULT 'POINT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for spin_history table
CREATE INDEX idx_spin_history_created_at ON spin_history(created_at);
CREATE INDEX idx_spin_history_user_id ON spin_history(user_id);

-- Create game_cycles table
CREATE TABLE game_cycles (
    id SERIAL PRIMARY KEY,
    cycle_number INTEGER UNIQUE NOT NULL,
    growth_rate DECIMAL(10,4) NOT NULL,
    max_speed_cap DECIMAL(10,4) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for game_cycles table
CREATE INDEX idx_game_cycles_is_active ON game_cycles(is_active);
CREATE INDEX idx_game_cycles_cycle_number ON game_cycles(cycle_number);

-- Insert initial data
INSERT INTO quests (title, description, type, category, config, reward_amount, reward_type, frequency, is_active) VALUES
('Follow Cedra on Twitter', 'Follow our official Twitter account to stay updated', 'SOCIAL', 'twitter', '{"platform": "twitter", "action": "follow", "target_id": "@cedra_network", "url": "https://twitter.com/cedra_network"}', 100, 'POINT', 'ONCE', true),
('Join Cedra Telegram Channel', 'Join our official Telegram channel for updates', 'SOCIAL', 'telegram', '{"platform": "telegram", "action": "join_channel", "target_id": "@cedra_official", "url": "https://t.me/cedra_official"}', 150, 'POINT', 'ONCE', true),
('Hold 1000 CEDRA Tokens', 'Hold at least 1000 CEDRA tokens in your wallet', 'ONCHAIN', 'holding', '{"chain_id": 1, "contract_address": "0x...", "token_symbol": "CEDRA", "min_amount": "1000", "action": "hold", "duration_hours": 24}', 500, 'POINT', 'ONCE', true),
('Daily Login', 'Login to the app daily to earn rewards', 'SOCIAL', 'daily', '{"action": "daily_login"}', 50, 'POINT', 'DAILY', true),
('Share on Social Media', 'Share Cedra Quest on your social media', 'SOCIAL', 'share', '{"platform": "any", "action": "share"}', 75, 'POINT', 'ONCE', true);

-- Insert initial game cycle
INSERT INTO game_cycles (cycle_number, growth_rate, max_speed_cap, start_date, end_date, is_active) VALUES
(1, 1.0500, 2.0000, NOW(), NOW() + INTERVAL '30 days', true);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_energy_updated_at BEFORE UPDATE ON user_energy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_cycles_updated_at BEFORE UPDATE ON game_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;