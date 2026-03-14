import { NextRequest } from "next/server";
import { anthropic, AI_MODEL } from "@/lib/anthropic";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = (await req.json()) as {
      messages: Message[];
      context?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a warm, knowledgeable cross stitch and needlework advisor inside the Stitch Studio app. Your name is the AI Stitch Advisor.

Your personality:
- Warm, encouraging, and personal — like a knowledgeable friend at a stitching group
- Use crafting terminology naturally but explain technical concepts when asked
- Be concise but thorough — give practical, actionable advice
- Use occasional emojis sparingly (✿, 🧵, 🪡) — don't overdo it
- If you're not sure about something, say so honestly

You can help with:
- Thread substitutions (which colors work instead of missing ones)
- Fabric selection (count, type, color recommendations)
- Stitching techniques (backstitch, French knots, specialty stitches)
- Finishing and framing advice
- Pattern reading help
- Care instructions (washing, pressing finished pieces)
- General crafting tips and troubleshooting

${context ? `\nHere is context about the user's collection and current projects:\n${context}` : ""}

Keep responses focused and helpful. If the user asks about something outside of needlework/crafting, gently redirect to how you can help with their stitching.`;

    let stream;
    try {
      stream = await anthropic.messages.stream({
        model: AI_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
    } catch (err: unknown) {
      console.error("advisor API error:", err);
      const message =
        err instanceof Error && err.message?.includes("credit balance")
          ? "The AI service needs credits to work. Please add credits at console.anthropic.com."
          : "Could not connect to the AI advisor right now. Please try again in a moment.";
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create SSE ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const data = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("advisor stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("advisor error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to start advisor chat. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
