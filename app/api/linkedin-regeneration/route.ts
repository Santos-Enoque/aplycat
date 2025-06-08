import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { LINKEDIN_REGENERATION_SYSTEM_PROMPT } from "@/lib/prompts/linkedin-regeneration-prompt";
import { LinkedInRegenerationSchema } from "@/lib/schemas/linkedin-regeneration-schema";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { analysis, originalProfileText } = await req.json();

    if (!analysis) {
      return new Response("Missing LinkedIn analysis data", { status: 400 });
    }
    
    // In a real scenario, originalProfileText would be passed from the frontend.
    // For now, we'll use a mock version consistent with the analysis step.
    const profileText = originalProfileText || `
John Doe
Senior Software Engineer at TechCorp
San Francisco Bay Area

About
Passionate software engineer with over 10 years of experience in building scalable web applications. My goal is to leverage technology to solve complex problems and create meaningful products. I am a strategic thinker and a team player.

Experience
Senior Software Engineer, TechCorp (2018 - Present)
- Responsible for developing new features.
- Worked on the main codebase.
- Mentored junior developers.
`;

    const stream = openai.responses.stream({
      model: "gpt-4o-2024-08-06",
      input: [
        {
          role: "system",
          content: LINKEDIN_REGENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Here is the analysis from "The LinkedIn Savage":\n\n${JSON.stringify(
            analysis,
            null,
            2
          )}\n\nAnd here is the original profile text:\n\n${profileText}`,
        },
      ],
      text: {
        format: zodTextFormat(LinkedInRegenerationSchema, "linkedin_regeneration"),
      },
    });

    const readableStream = new ReadableStream({
        async start(controller) {
          stream.on("response.output_text.delta", (event) => {
            controller.enqueue(new TextEncoder().encode(event.delta));
          });
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            controller.error(err);
          });
          stream.on("response.done", async () => {
            controller.close();
          });
        },
      });
  
      return new Response(readableStream, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });

  } catch (error: any) {
    console.error("Error in LinkedIn regeneration:", error);
    return new Response(`Error: ${error.message || "Unknown error"}`, {
      status: 500,
    });
  }
} 