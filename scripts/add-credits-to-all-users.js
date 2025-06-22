const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addCreditsToAllUsers() {
  const CREDITS_TO_ADD = 44;
  const DESCRIPTION = 'Bonus credits added to all users';

  try {
    console.log('🚀 Starting credit addition process...');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        credits: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`📊 Found ${users.length} users to update`);

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // Process users in batches to avoid overwhelming the database
    const BATCH_SIZE = 10;
    let processed = 0;
    let errors = [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)}...`);

      // Process each user in the batch
      const batchPromises = batch.map(async (user) => {
        try {
          await prisma.$transaction(async (tx) => {
            // Update user credits
            await tx.user.update({
              where: { id: user.id },
              data: {
                credits: {
                  increment: CREDITS_TO_ADD
                }
              }
            });

            // Create credit transaction record
            await tx.creditTransaction.create({
              data: {
                userId: user.id,
                type: 'BONUS_CREDIT',
                amount: CREDITS_TO_ADD,
                description: DESCRIPTION
              }
            });
          });

          const userName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email;
          
          console.log(`✅ Added ${CREDITS_TO_ADD} credits to ${userName} (${user.credits} → ${user.credits + CREDITS_TO_ADD})`);
          processed++;

        } catch (error) {
          const errorMsg = `Failed to update user ${user.email}: ${error.message || 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      });

      // Wait for the current batch to complete
      await Promise.all(batchPromises);

      // Small delay between batches to be gentle on the database
      if (i + BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final summary
    console.log('\n📈 SUMMARY:');
    console.log(`✅ Successfully processed: ${processed} users`);
    console.log(`❌ Errors: ${errors.length} users`);
    console.log(`💰 Total credits distributed: ${processed * CREDITS_TO_ADD}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    // Verify the operation
    const totalCreditsAfter = await prisma.user.aggregate({
      _sum: {
        credits: true
      }
    });

    console.log(`\n🔍 VERIFICATION:`);
    console.log(`Total credits in system: ${totalCreditsAfter._sum.credits}`);

  } catch (error) {
    console.error('💥 Fatal error during credit addition:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
async function main() {
  try {
    await addCreditsToAllUsers();
    console.log('🎉 Credit addition completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main();
}

module.exports = { addCreditsToAllUsers }; 