-- Migration script to update rank system
-- Run this to migrate from old BRONZE/SILVER/GOLD system to new RANK1-RANK6 system

-- First, add new rank values to enum (if not already done)
-- Note: This might need to be done manually depending on your database setup

-- Update existing users to use new rank system
UPDATE users SET current_rank = 'RANK1' WHERE current_rank = 'BRONZE' OR current_rank IS NULL;
UPDATE users SET current_rank = 'RANK2' WHERE current_rank = 'SILVER';
UPDATE users SET current_rank = 'RANK3' WHERE current_rank = 'GOLD';
UPDATE users SET current_rank = 'RANK4' WHERE current_rank = 'PLATINUM';
UPDATE users SET current_rank = 'RANK5' WHERE current_rank = 'DIAMOND';
UPDATE users SET current_rank = 'RANK6' WHERE current_rank = 'LEVIATHAN';

-- Add RANK_REWARD transaction type if not exists
-- This might need to be done manually in your enum definition

-- Update rank thresholds based on new system:
-- RANK1: 0 points (no reward)
-- RANK2: 10,000 points (1,000 coin reward)
-- RANK3: 25,000 points (2,000 coin reward)  
-- RANK4: 45,000 points (3,000 coin reward)
-- RANK5: 60,000 points (4,000 coin reward)
-- RANK6: 75,000 points (5,000 coin reward)

-- Recalculate ranks for all users based on their lifetime_points
UPDATE users SET current_rank = 
  CASE 
    WHEN lifetime_points >= 75000 THEN 'RANK6'
    WHEN lifetime_points >= 60000 THEN 'RANK5'
    WHEN lifetime_points >= 45000 THEN 'RANK4'
    WHEN lifetime_points >= 25000 THEN 'RANK3'
    WHEN lifetime_points >= 10000 THEN 'RANK2'
    ELSE 'RANK1'
  END;

-- Optional: Award retroactive rank rewards for users who already qualify
-- (You may want to skip this to avoid giving too many free coins)
/*
INSERT INTO point_transactions (user_id, amount, type, description, reference_id, created_at)
SELECT 
  telegram_id,
  CASE current_rank
    WHEN 'RANK2' THEN 1000  -- 1000 coins for RANK2
    WHEN 'RANK3' THEN 2000  -- 2000 coins for RANK3
    WHEN 'RANK4' THEN 3000  -- 3000 coins for RANK4
    WHEN 'RANK5' THEN 4000  -- 4000 coins for RANK5
    WHEN 'RANK6' THEN 5000  -- 5000 coins for RANK6
    ELSE 0
  END as reward_amount,
  'RANK_REWARD',
  'Retroactive rank reward for migration',
  CONCAT('migration_rank_', current_rank, '_', EXTRACT(EPOCH FROM NOW())),
  NOW()
FROM users 
WHERE current_rank != 'RANK1' AND lifetime_points > 0;

-- Update user total_points with retroactive rewards
UPDATE users SET total_points = total_points + 
  CASE current_rank
    WHEN 'RANK2' THEN 1000  -- 1000 coins for RANK2
    WHEN 'RANK3' THEN 2000  -- 2000 coins for RANK3
    WHEN 'RANK4' THEN 3000  -- 3000 coins for RANK4
    WHEN 'RANK5' THEN 4000  -- 4000 coins for RANK5
    WHEN 'RANK6' THEN 5000  -- 5000 coins for RANK6
    ELSE 0
  END
WHERE current_rank != 'RANK1' AND lifetime_points > 0;
*/

-- Verify migration
SELECT current_rank, COUNT(*) as user_count, 
       MIN(lifetime_points) as min_points, 
       MAX(lifetime_points) as max_points
FROM users 
GROUP BY current_rank 
ORDER BY current_rank;