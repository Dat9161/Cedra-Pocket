-- Cedra Quest Demo Setup
-- Run this to prepare demo data

-- Create demo user
INSERT INTO users (
  telegram_id, 
  username, 
  first_name, 
  last_name,
  wallet_address,
  public_key,
  total_points,
  lifetime_points,
  pet_level,
  pet_current_xp,
  pet_last_claim_time,
  created_at,
  updated_at
) VALUES (
  999999999,
  'demo_user',
  'Demo',
  'User',
  'demo_wallet_address',
  'demo_public_key',
  500,
  500,
  1,
  0,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (telegram_id) DO UPDATE SET
  total_points = 500,
  lifetime_points = 500,
  pet_level = 1,
  pet_current_xp = 0,
  updated_at = NOW();

-- Create demo pet
INSERT INTO pets (
  user_id,
  level,
  exp,
  max_exp,
  hunger,
  happiness,
  last_coin_time,
  pending_coins,
  total_coins_earned,
  coin_rate,
  created_at,
  updated_at
) VALUES (
  999999999,
  1,
  0,
  1200,
  100,
  100,
  NOW() - INTERVAL '2 minutes',
  200,
  0,
  1.0,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  level = 1,
  exp = 0,
  max_exp = 1200,
  hunger = 100,
  happiness = 100,
  last_coin_time = NOW() - INTERVAL '2 minutes',
  pending_coins = 200,
  updated_at = NOW();

-- Create demo energy
INSERT INTO user_energy (
  user_id,
  current_energy,
  max_energy,
  last_update,
  created_at,
  updated_at
) VALUES (
  999999999,
  10,
  10,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  current_energy = 10,
  max_energy = 10,
  last_update = NOW(),
  updated_at = NOW();

-- Create demo quests (if not exist)
INSERT INTO quests (
  title,
  description,
  type,
  category,
  frequency,
  reward_points,
  reward_gems,
  requirements,
  config,
  is_active,
  created_at,
  updated_at
) VALUES 
-- Daily Quests
(
  'Daily Login',
  'Login to the app daily',
  'DAILY',
  'engagement',
  'DAILY',
  100,
  0,
  '{}',
  '{}',
  true,
  NOW(),
  NOW()
),
(
  'Play 3 Games',
  'Play 3 games today',
  'DAILY',
  'gaming',
  'DAILY',
  150,
  0,
  '{"games_played": 3}',
  '{}',
  true,
  NOW(),
  NOW()
),
(
  'Feed Pet 5 Times',
  'Feed your pet 5 times today',
  'DAILY',
  'pet',
  'DAILY',
  200,
  0,
  '{"pet_feeds": 5}',
  '{}',
  true,
  NOW(),
  NOW()
),

-- Task Quests
(
  'Follow Twitter',
  'Follow our Twitter account',
  'TASK',
  'social',
  'ONCE',
  500,
  0,
  '{}',
  '{"url": "https://twitter.com/cedraquest"}',
  true,
  NOW(),
  NOW()
),
(
  'Join Telegram',
  'Join our Telegram community',
  'TASK',
  'social',
  'ONCE',
  300,
  0,
  '{}',
  '{"url": "https://t.me/cedraquest"}',
  true,
  NOW(),
  NOW()
),
(
  'Invite Friend',
  'Invite a friend to join',
  'TASK',
  'referral',
  'REPEATABLE',
  200,
  0,
  '{"friends_invited": 1}',
  '{}',
  true,
  NOW(),
  NOW()
),

-- Achievement Quests
(
  'Reach Level 5',
  'Reach user level 5',
  'ACHIEVEMENT',
  'progression',
  'ONCE',
  1000,
  0,
  '{"user_level": 5}',
  '{}',
  true,
  NOW(),
  NOW()
),
(
  'Hatch Your Pet',
  'Successfully hatch your pet egg',
  'ACHIEVEMENT',
  'pet',
  'ONCE',
  500,
  0,
  '{}',
  '{}',
  true,
  NOW(),
  NOW()
),
(
  'Play 50 Games',
  'Play a total of 50 games',
  'ACHIEVEMENT',
  'gaming',
  'ONCE',
  2000,
  0,
  '{"total_games": 50}',
  '{}',
  true,
  NOW(),
  NOW()
),
(
  'Earn 10K Points',
  'Earn a total of 10,000 points',
  'ACHIEVEMENT',
  'progression',
  'ONCE',
  5000,
  0,
  '{"total_points": 10000}',
  '{}',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (title) DO NOTHING;

-- Create some demo user quests (completed)
INSERT INTO user_quests (
  user_id,
  quest_id,
  status,
  progress,
  completed_at,
  claimed_at,
  created_at,
  updated_at
) 
SELECT 
  999999999,
  q.id,
  'COMPLETED',
  '{}',
  NOW() - INTERVAL '1 hour',
  NULL,
  NOW(),
  NOW()
FROM quests q 
WHERE q.title IN ('Daily Login', 'Follow Twitter', 'Join Telegram')
ON CONFLICT (user_id, quest_id) DO UPDATE SET
  status = 'COMPLETED',
  completed_at = NOW() - INTERVAL '1 hour',
  claimed_at = NULL,
  updated_at = NOW();

-- Create demo game sessions
INSERT INTO game_sessions (
  user_id,
  game_type,
  score,
  points_earned,
  energy_used,
  duration,
  created_at
) VALUES 
(999999999, 'pocket-fly', 15, 15, 1, 45, NOW() - INTERVAL '10 minutes'),
(999999999, 'pocket-fly', 8, 8, 1, 30, NOW() - INTERVAL '8 minutes'),
(999999999, 'pocket-fly', 22, 22, 1, 60, NOW() - INTERVAL '5 minutes');

-- Create demo point transactions
INSERT INTO point_transactions (
  user_id,
  amount,
  type,
  description,
  reference_id,
  created_at
) VALUES 
(999999999, 100, 'QUEST_REWARD', 'Daily Login quest completed', 'quest_daily_login', NOW() - INTERVAL '2 hours'),
(999999999, 500, 'QUEST_REWARD', 'Follow Twitter quest completed', 'quest_follow_twitter', NOW() - INTERVAL '1 hour'),
(999999999, 300, 'QUEST_REWARD', 'Join Telegram quest completed', 'quest_join_telegram', NOW() - INTERVAL '1 hour'),
(999999999, 15, 'GAME_REWARD', 'Pocket Fly game completed (score: 15)', 'game_pocket_fly_1', NOW() - INTERVAL '10 minutes'),
(999999999, 8, 'GAME_REWARD', 'Pocket Fly game completed (score: 8)', 'game_pocket_fly_2', NOW() - INTERVAL '8 minutes'),
(999999999, 22, 'GAME_REWARD', 'Pocket Fly game completed (score: 22)', 'game_pocket_fly_3', NOW() - INTERVAL '5 minutes'),
(999999999, -20, 'PET_CARE', 'Fed pet', 'pet_feed_1', NOW() - INTERVAL '3 minutes'),
(999999999, -100, 'PET_CARE', 'Bought care item: Food Bowl', 'pet_care_item_1', NOW() - INTERVAL '2 minutes');

-- Update demo user final stats
UPDATE users SET 
  total_points = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM point_transactions 
    WHERE user_id = 999999999
  ) + 500,
  lifetime_points = (
    SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) 
    FROM point_transactions 
    WHERE user_id = 999999999
  ) + 500,
  updated_at = NOW()
WHERE telegram_id = 999999999;

-- Create demo pet feeding log
INSERT INTO pet_feeding_logs (
  user_id,
  points_spent,
  xp_gained,
  feed_date,
  total_daily_spent,
  created_at,
  updated_at
) VALUES (
  999999999,
  120,
  120,
  CURRENT_DATE,
  120,
  NOW(),
  NOW()
) ON CONFLICT (user_id, feed_date) DO UPDATE SET
  points_spent = 120,
  xp_gained = 120,
  total_daily_spent = 120,
  updated_at = NOW();

-- Show demo user stats
SELECT 
  u.username,
  u.total_points,
  u.lifetime_points,
  u.pet_level,
  u.pet_current_xp,
  p.pending_coins,
  e.current_energy
FROM users u
LEFT JOIN pets p ON u.telegram_id = p.user_id
LEFT JOIN user_energy e ON u.telegram_id = e.user_id
WHERE u.telegram_id = 999999999;

-- Show available quests for demo
SELECT 
  q.title,
  q.type,
  q.reward_points,
  COALESCE(uq.status, 'NOT_STARTED') as status
FROM quests q
LEFT JOIN user_quests uq ON q.id = uq.quest_id AND uq.user_id = 999999999
WHERE q.is_active = true
ORDER BY q.type, q.reward_points DESC;

COMMIT;