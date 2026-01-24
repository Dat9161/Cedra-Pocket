const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting to import sample quests...');

  try {
    // Create sample quests
    const socialQuest = await prisma.quests.create({
      data: {
        title: 'Follow Cedra on Twitter',
        description: 'Follow our official Twitter account to stay updated',
        type: 'SOCIAL',
        category: 'twitter',
        config: {
          platform: 'twitter',
          action: 'follow',
          target_id: '@cedra_network',
          url: 'https://twitter.com/cedra_network'
        },
        reward_amount: 100,
        reward_type: 'POINT',
        frequency: 'ONCE',
        is_active: true,
      },
    });

    const telegramQuest = await prisma.quests.create({
      data: {
        title: 'Join Cedra Telegram Channel',
        description: 'Join our official Telegram channel for updates',
        type: 'SOCIAL',
        category: 'telegram',
        config: {
          platform: 'telegram',
          action: 'join_channel',
          target_id: '@cedra_official',
          url: 'https://t.me/cedra_official'
        },
        reward_amount: 150,
        reward_type: 'POINT',
        frequency: 'ONCE',
        is_active: true,
      },
    });

    const onchainQuest = await prisma.quests.create({
      data: {
        title: 'Hold 1000 CEDRA Tokens',
        description: 'Hold at least 1000 CEDRA tokens in your wallet',
        type: 'GAME', // Changed from ONCHAIN to GAME
        category: 'holding',
        config: {
          chain_id: 1,
          contract_address: '0x...',
          token_symbol: 'CEDRA',
          min_amount: '1000',
          action: 'hold',
          duration_hours: 24
        },
        reward_amount: 500,
        reward_type: 'POINT',
        frequency: 'ONCE',
        is_active: true,
      },
    });

    // Create pet-related quests
    const petHatchQuest = await prisma.quests.create({
      data: {
        title: 'Hatch Your Pet Egg',
        description: 'Enter your birth year and hatch your first pet egg to start your journey',
        type: 'GAME',
        category: 'pet',
        config: { 
          requiresBirthYear: true 
        },
        reward_amount: 300,
        reward_type: 'POINT',
        frequency: 'ONCE',
        is_active: true,
      },
    });

    const dailyCheckinQuest = await prisma.quests.create({
      data: {
        title: 'Daily Check-in',
        description: 'Check in daily to earn rewards',
        type: 'GAME',
        category: 'daily',
        config: {},
        reward_amount: 50,
        reward_type: 'POINT',
        frequency: 'DAILY',
        is_active: true,
      },
    });

    const firstGameQuest = await prisma.quests.create({
      data: {
        title: 'Complete First Game',
        description: 'Play and complete your first game session',
        type: 'GAME',
        category: 'achievement',
        config: {},
        reward_amount: 200,
        reward_type: 'POINT',
        frequency: 'ONCE',
        is_active: true,
      },
    });

    // Pet task quests
    const twitterFollowTask = await prisma.quests.create({
      data: {
        title: 'Follow on Twitter',
        description: 'Follow our official Twitter account @CedraQuest',
        type: 'SOCIAL',
        category: 'pet_task',
        config: { 
          url: 'https://twitter.com/intent/follow?screen_name=CedraQuest' 
        },
        reward_amount: 0,
        reward_type: 'POINT',
        frequency: 'ONCE',
        is_active: true,
      },
    });

    const telegramJoinTask = await prisma.quests.create({
      data: {
        title: 'Join Telegram Group',
        description: 'Join our official Telegram channel for updates',
        type: 'SOCIAL',
        category: 'pet_task',
        config: { 
          url: 'https://t.me/cedra_quest_official' 
        },
        reward_amount: 0,
        reward_type: 'POINT',
        frequency: 'ONCE',
        is_active: true,
      },
    });

    const inviteFriendTask = await prisma.quests.create({
      data: {
        title: 'Invite 1 Friend',
        description: 'Invite your first friend to join the game',
        type: 'GAME',
        category: 'pet_task',
        config: {},
        reward_amount: 0,
        reward_type: 'POINT',
        frequency: 'ONCE',
        is_active: true,
      },
    });

    console.log('✅ Sample quests created successfully:', {
      socialQuest: socialQuest.id,
      telegramQuest: telegramQuest.id,
      onchainQuest: onchainQuest.id,
      petHatchQuest: petHatchQuest.id,
      dailyCheckinQuest: dailyCheckinQuest.id,
      firstGameQuest: firstGameQuest.id,
      twitterFollowTask: twitterFollowTask.id,
      telegramJoinTask: telegramJoinTask.id,
      inviteFriendTask: inviteFriendTask.id,
    });

    // Show total quest count
    const totalQuests = await prisma.quests.count();
    console.log(`📊 Total quests in database: ${totalQuests}`);

  } catch (error) {
    console.error('❌ Error creating sample quests:', error);
    
    // If error is about duplicate, show existing quests
    if (error.code === 'P2002' || error.message.includes('Unique constraint')) {
      console.log('⚠️  Some quests may already exist. Showing current quests:');
      
      const existingQuests = await prisma.quests.findMany({
        select: {
          id: true,
          title: true,
          type: true,
          category: true,
          is_active: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
      
      console.table(existingQuests);
    }
  }
}

main()
  .catch((e) => {
    console.error('💥 Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });