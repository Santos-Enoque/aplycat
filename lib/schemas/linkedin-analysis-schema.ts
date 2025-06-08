import { z } from "zod";

const ProfileSectionSchema = z.object({
  section_name: z.string().describe("Standardized section name: headline, about, experience, education, skills, etc."),
  score: z.number().int().min(0).max(100).describe("Score for this section from 0 to 100."),
  rating: z.enum(["Invisible", "Needs Major Help", "Solid", "All-Star"]).describe("Rating based on score: Invisible (0-25), Needs Major Help (26-50), Solid (51-75), All-Star (76-100)."),
  roast: z.string().describe("Brutal, constructive, and witty roast of this section in 1-2 sentences."),
  good_things: z.array(z.string()).describe("A list of 1-3 things the user did right in this section."),
  issues_found: z.array(z.string()).describe("A list of 1-3 specific issues found in this section."),
  quick_fixes: z.array(z.string()).describe("A list of 1-3 actionable quick fixes for the issues found. Each fix should directly correspond to an issue."),
});

const MissingSectionSchema = z.object({
    section_name: z.string().describe("The standard LinkedIn section they are missing (e.g., 'About', 'Projects', 'Volunteering')."),
    importance: z.enum(["Critical", "Important", "Recommended"]).describe("The importance of adding this missing section."),
    roast: z.string().describe("A witty, roast-style explanation of why not having this section is a career-killer."),
});

export const LinkedInAnalysisSchema = z.object({
  overall_score: z.number().int().min(0).max(100).describe("The single, overall score for the profile's effectiveness, from 0 to 100."),
  profile_strength: z.enum(["Invisible", "Needs Major Help", "Solid", "All-Star"]).describe("The overall profile strength category based on the overall_score."),
  main_roast: z.string().describe("A brutal, witty, and memorable 8-12 word summary of the profile's biggest problem."),
  improvement_potential: z.enum(["Low", "Medium", "High", "Very High"]).describe("The potential for improvement based on the analysis."),
  profile_sections: z.array(ProfileSectionSchema).describe("A detailed analysis of each major section found in the provided LinkedIn profile."),
  missing_sections: z.array(MissingSectionSchema).describe("An analysis of important standard LinkedIn sections that are missing from the profile."),
});

export type LinkedInAnalysis = z.infer<typeof LinkedInAnalysisSchema>; 