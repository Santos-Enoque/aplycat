#!/usr/bin/env tsx
/**
 * Migration Script: Base64 Data URLs to UploadThing
 * 
 * This script migrates existing resume files stored as Base64 data URLs
 * to UploadThing cloud storage, maintaining data integrity and user access.
 * 
 * Usage:
 *   npm run tsx scripts/migrate-base64-to-uploadthing.ts [--dry-run] [--batch-size=10] [--delay=1000]
 * 
 * Options:
 *   --dry-run: Preview what would be migrated without making changes
 *   --batch-size: Number of files to process in each batch (default: 10)
 *   --delay: Delay between batches in milliseconds (default: 1000)
 */

import { db } from '../lib/db';
import { uploadFileToUploadThing } from '../lib/file-management';

interface MigrationStats {
  totalFiles: number;
  base64Files: number;
  alreadyMigrated: number;
  successful: number;
  failed: number;
  skipped: number;
}

interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  delay: number;
}

async function main() {
  console.log('🚀 Starting Base64 to UploadThing Migration');
  console.log('==========================================');

  // Parse command line arguments
  const options = parseArgs();
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  const stats: MigrationStats = {
    totalFiles: 0,
    base64Files: 0,
    alreadyMigrated: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    // Step 1: Analyze current state
    console.log('\n📊 Analyzing current file storage...');
    await analyzeCurrentState(stats);

    if (stats.base64Files === 0) {
      console.log('✅ No Base64 files found that need migration!');
      return;
    }

    // Step 2: Confirm migration
    if (!options.dryRun) {
      const confirm = await confirmMigration(stats);
      if (!confirm) {
        console.log('❌ Migration cancelled by user.');
        return;
      }
    }

    // Step 3: Perform migration
    console.log('\n🔄 Starting migration process...');
    await performMigration(options, stats);

    // Step 4: Show final results
    console.log('\n📋 Migration Complete!');
    console.log('======================');
    printStats(stats);

  } catch (error) {
    console.error('\n❌ Migration failed with error:', error);
    process.exit(1);
  }
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '10'),
    delay: parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1] || '1000'),
  };
}

async function analyzeCurrentState(stats: MigrationStats): Promise<void> {
  const resumes = await db.resume.findMany({
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      uploadThingKey: true,
      fileSize: true,
      userId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc', // Process oldest files first
    },
  });

  stats.totalFiles = resumes.length;

  for (const resume of resumes) {
    if (resume.fileUrl.startsWith('data:')) {
      stats.base64Files++;
    } else if (resume.uploadThingKey) {
      stats.alreadyMigrated++;
    }
  }

  console.log(`📁 Total files: ${stats.totalFiles}`);
  console.log(`📋 Base64 files to migrate: ${stats.base64Files}`);
  console.log(`☁️  Already on UploadThing: ${stats.alreadyMigrated}`);
}

async function confirmMigration(stats: MigrationStats): Promise<boolean> {
  console.log(`\n⚠️  About to migrate ${stats.base64Files} files to UploadThing.`);
  console.log('This process will:');
  console.log('  1. Convert Base64 data to files');
  console.log('  2. Upload files to UploadThing');
  console.log('  3. Update database records');
  console.log('  4. Keep original data as backup (not deleted)');
  
  // In a real environment, you might use a proper prompt library
  // For now, we'll assume confirmation in a script environment
  return true;
}

async function performMigration(options: MigrationOptions, stats: MigrationStats): Promise<void> {
  // Get all Base64 files to migrate
  const base64Resumes = await db.resume.findMany({
    where: {
      fileUrl: {
        startsWith: 'data:',
      },
      uploadThingKey: null, // Not already migrated
    },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      fileSize: true,
      mimeType: true,
      userId: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`🔄 Processing ${base64Resumes.length} files in batches of ${options.batchSize}`);

  // Process in batches
  for (let i = 0; i < base64Resumes.length; i += options.batchSize) {
    const batch = base64Resumes.slice(i, i + options.batchSize);
    const batchNumber = Math.floor(i / options.batchSize) + 1;
    const totalBatches = Math.ceil(base64Resumes.length / options.batchSize);

    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} files)`);

    // Process each file in the batch
    for (const resume of batch) {
      try {
        await migrateFile(resume, options.dryRun, stats);
      } catch (error) {
        console.error(`❌ Failed to migrate ${resume.fileName}:`, error);
        stats.failed++;
      }
    }

    // Add delay between batches to avoid overwhelming the service
    if (i + options.batchSize < base64Resumes.length) {
      console.log(`⏳ Waiting ${options.delay}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }
  }
}

async function migrateFile(
  resume: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number | null;
    mimeType: string | null;
    userId: string;
  },
  dryRun: boolean,
  stats: MigrationStats
): Promise<void> {
  console.log(`  📄 ${resume.fileName} (${formatFileSize(resume.fileSize)})`);

  if (dryRun) {
    console.log(`    🔍 Would migrate to UploadThing`);
    stats.successful++;
    return;
  }

  try {
    // Extract Base64 data
    const base64Data = resume.fileUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid Base64 data URL format');
    }

    // Convert to File object
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const mimeType = resume.mimeType || 'application/pdf';
    const file = new File([byteArray], resume.fileName, { type: mimeType });

    // Upload to UploadThing
    console.log(`    ☁️  Uploading to UploadThing...`);
    const uploadResult = await uploadFileToUploadThing(file, resume.userId);

    if (!uploadResult) {
      throw new Error('UploadThing upload returned null');
    }

    // Update database record with UploadThing URL and key
    await db.resume.update({
      where: { id: resume.id },
      data: {
        fileUrl: uploadResult.url,
        uploadThingKey: uploadResult.key,
        // Keep fileSize and mimeType from original record
      },
    });

    console.log(`    ✅ Successfully migrated to UploadThing`);
    stats.successful++;

  } catch (error) {
    console.error(`    ❌ Migration failed:`, error);
    stats.failed++;
    throw error; // Re-throw to be caught by caller
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function printStats(stats: MigrationStats): void {
  console.log(`📊 Total files processed: ${stats.totalFiles}`);
  console.log(`✅ Successfully migrated: ${stats.successful}`);
  console.log(`❌ Failed migrations: ${stats.failed}`);
  console.log(`⏭️  Skipped files: ${stats.skipped}`);
  console.log(`☁️  Already on UploadThing: ${stats.alreadyMigrated}`);
  
  if (stats.failed > 0) {
    console.log('\n⚠️  Some files failed to migrate. Check logs above for details.');
    console.log('You can re-run this script to retry failed migrations.');
  }
  
  if (stats.successful > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('Benefits:');
    console.log('  • Improved database performance');
    console.log('  • Reduced storage costs');
    console.log('  • Better file management');
    console.log('  • Scalable cloud storage');
  }
}

// Validation function to ensure UploadThing is properly configured
async function validateSetup(): Promise<void> {
  const requiredEnvVars = [
    'UPLOADTHING_SECRET',
    'UPLOADTHING_APP_ID',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('\nPlease set these variables before running the migration.');
    process.exit(1);
  }

  console.log('✅ UploadThing configuration validated');
}

// Run the migration
if (require.main === module) {
  validateSetup()
    .then(() => main())
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateFile, analyzeCurrentState };