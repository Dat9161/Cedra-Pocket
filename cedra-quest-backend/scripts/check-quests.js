const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Checking all quests in database...\n');

  try {
    const quests = await prisma.quests.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        category: true,
        reward_amount: true,
        reward_type: true,
        frequency: true,
        is_active: true,
        config: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    console.log(`Found ${quests.length} quests:\n`);

    quests.forEach((quest, index) => {
      console.log(`${index + 1}. ${quest.title}`);
      console.log(`   ID: ${quest.id}`);
      console.log(`   Type: ${quest.type} | Category: ${quest.category}`);
      console.log(`   Reward: ${quest.reward_amount} ${quest.reward_type}`);
      console.log(`   Frequency: ${quest.frequency} | Active: ${quest.is_active}`);
      console.log(`   Description: ${quest.description}`);
      if (quest.config && Object.keys(quest.config).length > 0) {
        console.log(`   Config: ${JSON.stringify(quest.config, null, 2)}`);
      }
      console.log('');
    });

    // Group by category
    const byCategory = quests.reduce((acc, quest) => {
      const cat = quest.category || 'uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(quest.title);
      return acc;
    }, {});

    console.log('📊 Quests by category:');
    Object.entries(byCategory).forEach(([category, questTitles]) => {
      console.log(`  ${category}: ${questTitles.length} quests`);
      questTitles.forEach(title => console.log(`    - ${title}`));
    });

  } catch (error) {
    console.error('❌ Error checking quests:', error);
  }
}

main()
  .catch((e) => {
    console.error('💥 Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });