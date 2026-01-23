const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n');

    // Check users
    const userCount = await prisma.users.count();
    console.log(`👥 Users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.users.findMany({
        select: {
          telegram_id: true,
          username: true,
          total_points: true,
          level: true,
          current_rank: true
        },
        take: 5
      });
      
      console.log('   Sample users:');
      users.forEach(user => {
        console.log(`   - ${user.username} (ID: ${user.telegram_id}) - ${user.total_points} points, Level ${user.level}, Rank: ${user.current_rank}`);
      });
    }

    // Check quests
    const questCount = await prisma.quests.count();
    console.log(`\n🎯 Quests: ${questCount}`);
    
    if (questCount > 0) {
      const quests = await prisma.quests.findMany({
        select: {
          id: true,
          title: true,
          type: true,
          reward_amount: true,
          is_active: true
        },
        take: 5
      });
      
      console.log('   Sample quests:');
      quests.forEach(quest => {
        console.log(`   - ${quest.title} (${quest.type}) - ${quest.reward_amount} points ${quest.is_active ? '✅' : '❌'}`);
      });
    }

    // Check pets
    const petCount = await prisma.pets.count();
    console.log(`\n🐾 Pets: ${petCount}`);

    // Check user quests
    const userQuestCount = await prisma.user_quests.count();
    console.log(`📋 User Quests: ${userQuestCount}`);

    // Check game sessions
    const gameSessionCount = await prisma.game_sessions.count();
    console.log(`🎮 Game Sessions: ${gameSessionCount}`);

    // Check point transactions
    const transactionCount = await prisma.point_transactions.count();
    console.log(`💰 Point Transactions: ${transactionCount}`);

    console.log('\n✅ Database setup completed successfully!');
    console.log('🚀 Your Cedra Quest backend is ready to use!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();