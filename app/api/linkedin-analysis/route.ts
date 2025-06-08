import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { LINKEDIN_ANALYSIS_SYSTEM_PROMPT } from "@/lib/prompts/linkedin-prompts";
import { LinkedInAnalysisSchema } from "@/lib/schemas/linkedin-analysis-schema";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
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
    console.error("Error in LinkedIn analysis:", error);
    return new Response(`Error: ${error.message || "Unknown error"}`, {
      status: 500,
    });
  }
} 