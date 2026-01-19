// Serverless function with Prisma database connection
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Simple in-memory cache for user data (5 minutes TTL)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedUser(userId) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Using cached data for user: ${userId}`);
    return cached.data;
  }
  return null;
}

function setCachedUser(userId, userData) {
  userCache.set(userId, {
    data: userData,
    timestamp: Date.now()
  });
  console.log(`💾 Cached data for user: ${userId}`);
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let dbConnected = false;
  
  try {
    const path = req.url || '/';
    console.log(`📝 Request: ${req.method} ${path}`);

    // Health check endpoint
    if (path === '/health' || path === '/' || path === '/api') {
      // Test database connection
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbConnected = true;
      } catch (dbError) {
        console.error('Database connection failed:', dbError);
        dbConnected = false;
      }

      res.status(200).json({
        status: 'ok',
        message: 'Cedra Quest Backend with Database',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'Connected to Supabase' : 'Database connection failed',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
      return;
    }

    // Game dashboard endpoint - get real data from database
    if (path.includes('/game/dashboard/')) {
      const userId = path.split('/').pop();
      
      if (!userId) {
        res.status(400).json({ error: 'User ID required' });
        return;
      }

      console.log(`🎮 Loading dashboard for user: ${userId}`);

      // Check cache first
      let user = getCachedUser(userId);
      
      if (!user) {
        // Get user data from database with timeout
        try {
          user = await Promise.race([
            prisma.users.findUnique({
              where: { telegram_id: BigInt(userId) },
              include: {
                pet: true,
                energy: true,
                game_sessions: {
                  orderBy: { created_at: 'desc' },
                  take: 10
                }
              }
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), 8000)
            )
          ]);
        } catch (dbError) {
          console.error('Database query failed:', dbError);
          res.status(500).json({ 
            error: 'Database query failed', 
            message: dbError.message 
          });
          return;
        }

        // Create user if not exists
        if (!user) {
          console.log(`👤 Creating new user: ${userId}`);
          try {
            user = await prisma.users.create({
              data: {
                telegram_id: BigInt(userId),
                username: `User${userId}`,
                wallet_address: `0x${userId}`,
                public_key: `pk_${userId}`,
                pet: {
                  create: {
                    level: 1,
                    exp: 0,
                    max_exp: 100,
                    hunger: 100,
                    happiness: 100,
                    pending_coins: 0,
                    total_coins_earned: BigInt(0),
                    coin_rate: 1.0
                  }
                },
                energy: {
                  create: {
                    current_energy: 10,
                    max_energy: 10
                  }
                }
              },
              include: {
                pet: true,
                energy: true,
                game_sessions: true
              }
            });
          } catch (createError) {
            console.error('Failed to create user:', createError);
            res.status(500).json({ 
              error: 'Failed to create user', 
              message: createError.message 
            });
            return;
          }
        }

        // Cache the user data
        setCachedUser(userId, user);
      }

      // Calculate game stats
      const gameStats = {
        totalGamesPlayed: user.game_sessions.length,
        totalScore: user.game_sessions.reduce((sum, session) => sum + session.score, 0),
        averageScore: user.game_sessions.length > 0 
          ? Math.round(user.game_sessions.reduce((sum, session) => sum + session.score, 0) / user.game_sessions.length)
          : 0,
        bestScore: user.game_sessions.length > 0 
          ? Math.max(...user.game_sessions.map(session => session.score))
          : 0,
        totalPointsEarned: Number(user.total_points)
      };

      res.status(200).json({
        success: true,
        pet: user.pet ? {
          level: user.pet.level,
          currentXp: user.pet.exp,
          xpForNextLevel: user.pet.max_exp,
          pendingRewards: user.pet.pending_coins,
          lastClaimTime: user.pet.last_coin_time.toISOString()
        } : null,
        energy: user.energy ? {
          currentEnergy: user.energy.current_energy,
          maxEnergy: user.energy.max_energy,
          lastUpdate: user.energy.last_update.toISOString()
        } : null,
        ranking: {
          rank: user.current_rank,
          position: 1, // TODO: Calculate real position
          lifetimePoints: Number(user.lifetime_points),
          nextRankThreshold: 1000
        },
        gameStats
      });
      return;
    }

    // Game cycle endpoint
    if (path.includes('/game/cycle/current')) {
      const cycle = await prisma.game_cycles.findFirst({
        where: { is_active: true },
        orderBy: { created_at: 'desc' }
      });

      if (cycle) {
        res.status(200).json({
          cycleNumber: cycle.cycle_number,
          growthRate: Number(cycle.growth_rate),
          maxSpeedCap: Number(cycle.max_speed_cap),
          startDate: cycle.start_date.toISOString(),
          endDate: cycle.end_date.toISOString(),
          isActive: cycle.is_active
        });
      } else {
        // Create default cycle if none exists
        const newCycle = await prisma.game_cycles.create({
          data: {
            cycle_number: 1,
            growth_rate: 1.0,
            max_speed_cap: 2.0,
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            is_active: true
          }
        });

        res.status(200).json({
          cycleNumber: newCycle.cycle_number,
          growthRate: Number(newCycle.growth_rate),
          maxSpeedCap: Number(newCycle.max_speed_cap),
          startDate: newCycle.start_date.toISOString(),
          endDate: newCycle.end_date.toISOString(),
          isActive: newCycle.is_active
        });
      }
      return;
    }

    // Pet claim rewards endpoint
    if (path.includes('/game/pet/claim/') && req.method === 'POST') {
      const userId = path.split('/').pop();
      
      if (!userId) {
        res.status(400).json({ error: 'User ID required' });
        return;
      }

      console.log(`💰 Claiming rewards for user: ${userId}`);

      try {
        // Get user and pet data with timeout
        const user = await Promise.race([
          prisma.users.findUnique({
            where: { telegram_id: BigInt(userId) },
            include: { pet: true }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), 8000)
          )
        ]);

        if (!user || !user.pet) {
          res.status(404).json({ error: 'User or pet not found' });
          return;
        }

        const pendingCoins = user.pet.pending_coins;
        
        if (pendingCoins <= 0) {
          res.status(400).json({ error: 'No rewards to claim' });
          return;
        }

        console.log(`💰 User ${userId} claiming ${pendingCoins} coins`);

        // Update user points and reset pending coins in a transaction with timeout
        const [updatedUser] = await Promise.race([
          prisma.$transaction([
            prisma.users.update({
              where: { telegram_id: BigInt(userId) },
              data: {
                total_points: user.total_points + BigInt(pendingCoins),
                lifetime_points: user.lifetime_points + BigInt(pendingCoins)
              }
            }),
            prisma.pets.update({
              where: { user_id: BigInt(userId) },
              data: {
                pending_coins: 0,
                last_coin_time: new Date()
              }
            })
          ]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout')), 8000)
          )
        ]);

        // Clear cache for this user
        userCache.delete(userId);

        console.log(`✅ Claimed ${pendingCoins} rewards for user: ${userId}`);

        res.status(200).json({
          success: true,
          pointsEarned: pendingCoins,
          newTotalPoints: Number(updatedUser.total_points),
          pet: {
            pendingCoins: 0,
            lastClaimTime: new Date().toISOString()
          }
        });
        return;
      } catch (claimError) {
        console.error(`❌ Claim error for user ${userId}:`, claimError);
        
        if (claimError.message === 'Database query timeout' || claimError.message === 'Transaction timeout') {
          res.status(504).json({ 
            error: 'Claim timeout', 
            message: 'Please try again in a moment' 
          });
        } else {
          res.status(500).json({ 
            error: 'Failed to claim rewards', 
            message: claimError.message 
          });
        }
        return;
      }
    }

    // Default response
    res.status(200).json({
      message: 'Cedra Quest Backend API with Database',
      path: path,
      method: req.method,
      available_endpoints: [
        'GET /health',
        'GET /game/dashboard/:userId',
        'GET /game/cycle/current',
        'POST /game/pet/claim/:userId'
      ]
    });

  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Return appropriate error response
    if (error.message === 'Database query timeout') {
      res.status(504).json({
        error: 'Database timeout',
        message: 'Database query took too long to complete'
      });
    } else if (error.code === 'P2002') {
      res.status(409).json({
        error: 'Duplicate entry',
        message: 'Resource already exists'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred'
      });
    }
  } finally {
    // Always disconnect from database
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect from database:', disconnectError);
    }
  }
}