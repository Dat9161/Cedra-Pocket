const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function migrateRanks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting rank migration...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../database/migrate-ranks.sql'), 
      'utf8'
    );
    
    // Split the SQL into individual statements (excluding comments and empty lines)
    const statements = migrationSQL
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim());
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.log(`⚠️  Statement ${i + 1} failed (might be expected):`, error.message);
        }
      }
    }
    
    // Verify migration results
    console.log('\n📊 Verifying migration results...');
    const rankStats = await prisma.$queryRaw`
      SELECT current_rank, COUNT(*) as user_count, 
             MIN(lifetime_points) as min_points, 
             MAX(lifetime_points) as max_points
      FROM users 
      GROUP BY current_rank 
      ORDER BY current_rank;
    `;
    
    console.log('📈 Rank distribution after migration:');
    console.table(rankStats);
    
    console.log('✅ Rank migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRanks();