const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

console.log('🚀 Starting database setup...');

try {
  // Check if psql is available
  try {
    execSync('psql --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ PostgreSQL client (psql) not found');
    console.log('Please install PostgreSQL client tools');
    process.exit(1);
  }

  // Run the setup script
  const setupScriptPath = path.join(__dirname, 'setup-database.sql');
  
  if (!fs.existsSync(setupScriptPath)) {
    console.error('❌ Setup script not found:', setupScriptPath);
    process.exit(1);
  }

  console.log('📝 Running database setup script...');
  
  // Execute the SQL script
  const command = `psql "${DATABASE_URL}" -f "${setupScriptPath}"`;
  
  execSync(command, { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('✅ Database setup completed successfully!');
  console.log('');
  console.log('📊 Sample data created:');
  console.log('  - 5 test users with different levels and ranks');
  console.log('  - 11 quests (social and onchain)');
  console.log('  - Pet data for all users');
  console.log('  - Game sessions and transactions');
  console.log('  - Referral relationships');
  console.log('  - Daily rewards and spin history');
  console.log('');
  console.log('🎮 You can now start your application!');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  console.log('');
  console.log('💡 Troubleshooting tips:');
  console.log('  1. Check your DATABASE_URL is correct');
  console.log('  2. Ensure PostgreSQL server is running');
  console.log('  3. Verify database permissions');
  console.log('  4. Check network connectivity to database');
  process.exit(1);
}