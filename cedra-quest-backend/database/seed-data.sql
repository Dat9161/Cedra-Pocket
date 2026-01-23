-- Cedra Quest Database Seed Data
-- This script inserts sample data for testing and development

-- Insert sample users
INSERT INTO users (
    telegram_id, 
    wallet_address, 
    public_key, 
    username_at_creation, 
    username, 
    total_points, 
    referral_code, 
    current_xp, 
    level, 
    lifetime_points,
    current_rank
) VALUES 
(123456789, '0x1234567890abcdef1234567890abcdef12345678', '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890', 'testuser1', 'testuser1', 1500, 'REF001', 250, 3, 2000, 'SILVER'),
(987654321, '0xabcdef1234567890abcdef1234567890abcdef12', '0xabcdef1234567890abcdef1234567890abcdef12901234567890abcdef1234567890', 'testuser2', 'testuser2', 800, 'REF002', 120, 2, 1200, 'BRONZE'),
(555666777, '0x5555666677778888999900001111222233334444', '0x5555666677778888999900001111222233334444901234567890abcdef1234567890', 'testuser3', 'testuser3', 2500, 'REF003', 400, 4, 3000, 'GOLD'),
(111222333, '0x1111222233334444555566667777888899990000', '0x1111222233334444555566667777888899990000901234567890abcdef1234567890', 'testuser4', 'testuser4', 500, 'REF004', 80, 1, 500, 'BRONZE'),
(444555666, '0x4444555566667777888899990000111122223333', '0x4444555566667777888899990000111122223333901234567890abcdef1234567890', 'testuser5', 'testuser5', 3500, 'REF005', 600, 5, 4000, 'PLATINUM');

-- Set referrer relationships
UPDATE users SET referrer_id = 123456789 WHERE telegram_id = 987654321;
UPDATE users SET referrer_id = 123456789 WHERE telegram_id = 555666777;
UPDATE users SET referrer_id = 987654321 WHERE telegram_id = 111222333;

-- Insert more quests
INSERT INTO quests (title, description, type, category, config, reward_amount, reward_type, frequency, is_active, icon_url, xp_reward) VALUES
('Like Cedra Post', 'Like our latest post on Twitter', 'SOCIAL', 'twitter', '{"platform": "twitter", "action": "like", "post_id": "123456"}', 25, 'POINT', 'ONCE', true, '/icons/quest1.PNG', 10),
('Retweet Cedra', 'Retweet our announcement', 'SOCIAL', 'twitter', '{"platform": "twitter", "action": "retweet", "post_id": "789012"}', 50, 'POINT', 'ONCE', true, '/icons/quest1.PNG', 20),
('Join Discord', 'Join our Discord community', 'SOCIAL', 'discord', '{"platform": "discord", "action": "join", "server_id": "cedra_discord"}', 200, 'POINT', 'ONCE', true, '/icons/quest1.PNG', 50),
('Weekly Check-in', 'Check in weekly for bonus rewards', 'SOCIAL', 'checkin', '{"action": "weekly_checkin"}', 100, 'POINT', 'WEEKLY', true, '/icons/quest1.PNG', 30),
('Stake 500 CEDRA', 'Stake at least 500 CEDRA tokens', 'ONCHAIN', 'staking', '{"chain_id": 1, "action": "stake", "min_amount": "500", "token": "CEDRA"}', 300, 'POINT', 'ONCE', true, '/icons/quest1.PNG', 100),
('Provide Liquidity', 'Add liquidity to CEDRA/ETH pool', 'ONCHAIN', 'defi', '{"chain_id": 1, "action": "add_liquidity", "pool": "CEDRA/ETH"}', 750, 'POINT', 'ONCE', true, '/icons/quest1.PNG', 200),
('Complete 5 Games', 'Play and complete 5 mini games', 'SOCIAL', 'gaming', '{"action": "complete_games", "target_count": 5}', 150, 'POINT', 'ONCE', true, '/icons/game.png', 75),
('Invite 3 Friends', 'Invite 3 friends using your referral code', 'SOCIAL', 'referral', '{"action": "invite_friends", "target_count": 3}', 500, 'POINT', 'ONCE', true, '/icons/friend.png', 150);

-- Insert user quest completions
INSERT INTO user_quests (user_id, quest_id, status, completed_at, claimed_at, progress) VALUES
(123456789, 1, 'CLAIMED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 100),
(123456789, 2, 'CLAIMED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 100),
(123456789, 4, 'COMPLETED', NOW() - INTERVAL '1 hour', NULL, 100),
(987654321, 1, 'CLAIMED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 100),
(987654321, 6, 'PENDING', NULL, NULL, 25),
(555666777, 1, 'CLAIMED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 100),
(555666777, 2, 'CLAIMED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 100),
(555666777, 3, 'COMPLETED', NOW() - INTERVAL '2 hours', NULL, 100),
(111222333, 1, 'PENDING', NULL, NULL, 0),
(444555666, 1, 'CLAIMED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 100),
(444555666, 2, 'CLAIMED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 100),
(444555666, 3, 'CLAIMED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 100),
(444555666, 7, 'COMPLETED', NOW() - INTERVAL '30 minutes', NULL, 100);

-- Insert pets for users
INSERT INTO pets (user_id, level, exp, max_exp, hunger, happiness, pending_coins, total_coins_earned, coin_rate, tier) VALUES
(123456789, 3, 150, 300, 85, 90, 25, 500, 1.5, 'SILVER'),
(987654321, 2, 80, 200, 70, 75, 15, 200, 1.2, 'BRONZE'),
(555666777, 4, 200, 400, 95, 95, 40, 800, 2.0, 'GOLD'),
(111222333, 1, 20, 100, 60, 65, 5, 50, 1.0, 'BRONZE'),
(444555666, 5, 350, 500, 100, 100, 60, 1200, 2.5, 'PLATINUM');

-- Insert user energy
INSERT INTO user_energy (user_id, current_energy, max_energy) VALUES
(123456789, 8, 12),
(987654321, 10, 10),
(555666777, 15, 15),
(111222333, 7, 10),
(444555666, 20, 20);

-- Insert game sessions
INSERT INTO game_sessions (user_id, game_type, score, points_earned, energy_used, duration) VALUES
(123456789, 'memory_game', 850, 85, 1, 120),
(123456789, 'puzzle_game', 1200, 120, 2, 180),
(123456789, 'reaction_game', 950, 95, 1, 90),
(987654321, 'memory_game', 650, 65, 1, 100),
(987654321, 'puzzle_game', 800, 80, 1, 150),
(555666777, 'memory_game', 1100, 110, 1, 140),
(555666777, 'puzzle_game', 1500, 150, 2, 200),
(555666777, 'reaction_game', 1300, 130, 1, 110),
(555666777, 'arcade_game', 2000, 200, 3, 300),
(444555666, 'memory_game', 1400, 140, 1, 160),
(444555666, 'puzzle_game', 1800, 180, 2, 220),
(444555666, 'reaction_game', 1600, 160, 1, 130),
(444555666, 'arcade_game', 2500, 250, 3, 350);

-- Insert pet feeding logs
INSERT INTO pet_feeding_logs (user_id, points_spent, xp_gained, feed_date, total_daily_spent) VALUES
(123456789, 50, 25, '2024-01-20', 50),
(123456789, 30, 15, '2024-01-19', 80),
(987654321, 40, 20, '2024-01-20', 40),
(555666777, 60, 30, '2024-01-20', 120),
(555666777, 60, 30, '2024-01-19', 60),
(444555666, 80, 40, '2024-01-20', 160),
(444555666, 80, 40, '2024-01-19', 80);

-- Insert referral logs
INSERT INTO referral_logs (referrer_id, referee_id, commission_amount, bonus_type) VALUES
(123456789, 987654321, 50, 'SIGNUP_BONUS'),
(123456789, 555666777, 50, 'SIGNUP_BONUS'),
(987654321, 111222333, 50, 'SIGNUP_BONUS'),
(123456789, 987654321, 25, 'QUEST_COMPLETION'),
(123456789, 555666777, 30, 'QUEST_COMPLETION');

-- Insert daily rewards
INSERT INTO daily_rewards (user_id, day_number, reward_amount, reward_type) VALUES
(123456789, 1, 50, 'POINT'),
(123456789, 2, 75, 'POINT'),
(123456789, 3, 100, 'POINT'),
(987654321, 1, 50, 'POINT'),
(987654321, 2, 75, 'POINT'),
(555666777, 1, 50, 'POINT'),
(555666777, 2, 75, 'POINT'),
(555666777, 3, 100, 'POINT'),
(555666777, 4, 125, 'POINT'),
(444555666, 1, 50, 'POINT'),
(444555666, 2, 75, 'POINT'),
(444555666, 3, 100, 'POINT'),
(444555666, 4, 125, 'POINT'),
(444555666, 5, 150, 'POINT');

-- Insert point transactions
INSERT INTO point_transactions (user_id, amount, type, description, reference_id) VALUES
(123456789, 100, 'QUEST_REWARD', 'Follow Cedra on Twitter', 'quest_1'),
(123456789, 150, 'QUEST_REWARD', 'Join Cedra Telegram Channel', 'quest_2'),
(123456789, 85, 'PET_CLAIM', 'Pet coin collection', 'pet_claim_1'),
(123456789, -50, 'PET_FEED', 'Fed pet for XP', 'pet_feed_1'),
(987654321, 100, 'QUEST_REWARD', 'Follow Cedra on Twitter', 'quest_1'),
(987654321, 50, 'REFERRAL_BONUS', 'Referral signup bonus', 'ref_bonus_1'),
(555666777, 100, 'QUEST_REWARD', 'Follow Cedra on Twitter', 'quest_1'),
(555666777, 150, 'QUEST_REWARD', 'Join Cedra Telegram Channel', 'quest_2'),
(555666777, 110, 'PET_CLAIM', 'Pet coin collection', 'pet_claim_2'),
(444555666, 100, 'QUEST_REWARD', 'Follow Cedra on Twitter', 'quest_1'),
(444555666, 150, 'QUEST_REWARD', 'Join Cedra Telegram Channel', 'quest_2'),
(444555666, 500, 'QUEST_REWARD', 'Hold 1000 CEDRA Tokens', 'quest_3'),
(444555666, 140, 'PET_CLAIM', 'Pet coin collection', 'pet_claim_3');

-- Insert spin history
INSERT INTO spin_history (user_id, reward_amount, reward_type) VALUES
(123456789, 25, 'POINT'),
(123456789, 50, 'POINT'),
(123456789, 1, 'SPIN'),
(987654321, 30, 'POINT'),
(555666777, 40, 'POINT'),
(555666777, 75, 'POINT'),
(555666777, 2, 'SPIN'),
(444555666, 100, 'POINT'),
(444555666, 50, 'POINT'),
(444555666, 1, 'SPIN');

-- Update user spin counts
UPDATE users SET spins_left = 2 WHERE telegram_id = 123456789;
UPDATE users SET spins_left = 3 WHERE telegram_id = 987654321;
UPDATE users SET spins_left = 1 WHERE telegram_id = 555666777;
UPDATE users SET spins_left = 3 WHERE telegram_id = 111222333;
UPDATE users SET spins_left = 2 WHERE telegram_id = 444555666;

-- Update last daily claim times
UPDATE users SET last_daily_claim = NOW() - INTERVAL '1 day' WHERE telegram_id IN (123456789, 987654321, 555666777, 444555666);

-- Update daily streaks
UPDATE users SET daily_streak = 3 WHERE telegram_id = 123456789;
UPDATE users SET daily_streak = 2 WHERE telegram_id = 987654321;
UPDATE users SET daily_streak = 4 WHERE telegram_id = 555666777;
UPDATE users SET daily_streak = 0 WHERE telegram_id = 111222333;
UPDATE users SET daily_streak = 5 WHERE telegram_id = 444555666;

COMMIT;