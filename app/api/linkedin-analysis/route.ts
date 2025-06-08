import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { LINKEDIN_ANALYSIS_SYSTEM_PROMPT } from "@/lib/prompts/linkedin-prompts";
import { LinkedInAnalysisSchema } from "@/lib/schemas/linkedin-analysis-schema";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentUserFromDB, decrementUserCredits } from "@/lib/auth/user-sync";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LINKEDIN_ANALYSIS_COST = 3;

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const dbUser = await getCurrentUserFromDB();
    if (!dbUser || dbUser.credits < LINKEDIN_ANALYSIS_COST) {
      return new Response(
        `Insufficient credits. This service costs ${LINKEDIN_ANALYSIS_COST} credits.`,
        { status: 402 }
      );
    }

    const { profileUrl } = await req.json();

    if (!profileUrl) {
      return new Response("Missing profile URL", { status: 400 });
    }

    

    const stream = openai.responses.stream({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: LINKEDIN_ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Here is the LinkedIn profile content to analyze: ${profileUrl}`,
        },
      ],
      text: {
        "format": {
          "type": "text"
        }
      },
      reasoning: {},
      tools: [
        {
          "type": "web_search_preview",
          "user_location": {
            "type": "approximate"
          },
          "search_context_size": "medium"
        }
      ],
      temperature: 1,
      max_output_tokens: 2048,
      top_p: 1,
      store: true
      
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        stream.on("response.output_text.delta", (event) => {
          controller.enqueue(new TextEncoder().encode(event.delta));
        });
        stream.on("response.refusal.delta", (event) => {
          console.warn("Stream refused:", event.delta);
          const refusalPayload = JSON.stringify({
            error: "refusal",
            message: event.delta,
          });
          controller.enqueue(new TextEncoder().encode(refusalPayload));
        });
        stream.on("error", (err) => {
          console.error("Stream error:", err);
          controller.error(err);
        });
        stream.on("response.output_text.done", async () => {
          try {
            await decrementUserCredits(user.id, LINKEDIN_ANALYSIS_COST);
            console.log(`[LINKEDIN_API] Deducted ${LINKEDIN_ANALYSIS_COST} credits from user ${user.id}`);
          } catch (deductionError) {
            console.error(`[LINKEDIN_API] Failed to deduct credits for user ${user.id}:`, deductionError);
            // Don't throw an error to the client, just log it
          } finally {
            controller.close();
          }
        });
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("Error in LinkedIn analysis:", error);
    return new Response(`Error: ${error.message || "Unknown error"}`, {
      status: 500,
    });
  }
} 