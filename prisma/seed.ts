import { PrismaClient, PromptType } from '@prisma/client';
import { RESUME_ANALYSIS_SYSTEM_PROMPT } from '../lib/prompts/resume-prompts';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const defaultConfig = await prisma.modelConfiguration.upsert({
    where: { name: 'OpenAI GPT-4o Mini' },
    update: {},
    create: {
      name: 'OpenAI GPT-4o Mini',
      modelName: 'gpt-4o-mini',
      provider: 'openai',
      temperature: 0.1,
      maxTokens: 4000,
      topP: 1,
      isActive: true,
      isDefault: true,
    },
  });

  console.log(`Upserted default model configuration: ${defaultConfig.name}`);

  const resumeAnalysisPrompt = await prisma.modelPrompt.upsert({
    where: { 
      configurationId_promptType_name: {
        configurationId: defaultConfig.id,
        promptType: PromptType.SYSTEM,
        name: 'Resume Analysis Prompt'
      }
    },
    update: {},
    create: {
      name: 'Resume Analysis Prompt',
      promptType: PromptType.SYSTEM,
      promptText: RESUME_ANALYSIS_SYSTEM_PROMPT,
      version: 1,
      isActive: true,
      configurationId: defaultConfig.id,
    },
  });

  console.log(`Upserted default prompt for: ${resumeAnalysisPrompt.service}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 