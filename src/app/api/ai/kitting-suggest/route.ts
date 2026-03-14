import { NextRequest, NextResponse } from "next/server";
import { anthropic, AI_MODEL } from "@/lib/anthropic";

interface ThreadInfo {
  manufacturer: string;
  color_number: string;
  color_name: string;
}

export async function POST(req: NextRequest) {
  try {
    const { missing_thread, available_threads } = (await req.json()) as {
      missing_thread: ThreadInfo;
      available_threads: ThreadInfo[];
    };

    if (!missing_thread) {
      return NextResponse.json({ error: "No thread specified" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `I need a substitute for this cross stitch thread that I'm missing:

Missing thread: ${missing_thread.manufacturer} ${missing_thread.color_number} (${missing_thread.color_name})

Here are the threads I currently have in my stash:
${
  available_threads && available_threads.length > 0
    ? available_threads
        .map((t) => `- ${t.manufacturer} ${t.color_number} (${t.color_name || "unnamed"})`)
        .join("\n")
    : "No threads in stash yet."
}

Please suggest up to 3 substitutes from my stash that would work well. For each suggestion, explain why it's a good match (color family, value/darkness, fiber type compatibility).

Return a JSON object:

{
  "suggestions": [
    {
      "manufacturer": "DMC",
      "color_number": "321",
      "color_name": "Red",
      "reason": "Very close in the red family — slightly brighter but will blend well in the design"
    }
  ],
  "general_advice": "If none of these work, DMC 304 and Anchor 1006 are the closest commercial matches.",
  "confidence": 0.8
}

If no good substitutes exist in the stash, return an empty suggestions array with helpful general_advice about what to buy instead. Only return the JSON object.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "AI did not return text" }, { status: 500 });
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr);

    if (!Array.isArray(result.suggestions)) {
      result.suggestions = [];
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("kitting-suggest error:", err);
    return NextResponse.json(
      { error: "Failed to get substitution suggestions. Please try again." },
      { status: 500 }
    );
  }
}
