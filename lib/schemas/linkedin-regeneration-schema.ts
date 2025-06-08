import { z } from "zod";

export const LinkedInRegenerationSchema = z.object({
  improvementsOverview: z.object({
    headline: z.string(),
    summary: z.string(),
  }),
  rewrittenHeadline: z.object({
    newContent: z.string(),
    keyChanges: z.array(z.string()),
  }),
  rewrittenAbout: z.object({
    newContent: z.string(),
    keyChanges: z.array(z.string()),
  }),
  rewrittenExperience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      newAchievements: z.array(z.string()),
    })
  ),
  recommendedSkills: z.object({
    top10Skills: z.array(z.string()),
    explanation: z.string(),
  }),
  finalInstructionsForUser: z.array(z.string()),
});

export type LinkedInRegeneration = z.infer<typeof LinkedInRegenerationSchema>; 