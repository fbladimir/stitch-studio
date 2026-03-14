import { NextRequest, NextResponse } from "next/server";
import { anthropic, AI_MODEL } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `You are analyzing a photo of a cross stitch thread collection, thread organizer, thread cards, or thread labels. Your job is to identify every thread visible and extract the manufacturer and color number.

Return a JSON object with this structure:

{
  "threads": [
    {
      "manufacturer": "DMC",
      "color_number": "304",
      "color_name": "Medium Red",
      "quantity": 1
    }
  ],
  "confidence": 0.85
}

Rules:
- manufacturer must be one of: DMC, Anchor, Weeks Dye Works, Gentle Arts, Classic Colorworks, Simply Shaker, Cosmos, Sulky, Other
- If you can read the color name from the label, include it. Otherwise set color_name to null
- quantity defaults to 1 unless you can see multiple skeins of the same color
- Extract every thread you can identify — even partially visible ones
- For DMC threads, color numbers are typically 1-4 digits (e.g. 304, 3865, 01)
- confidence is 0.0 to 1.0 for overall extraction quality
- Only return the JSON object, no other text or markdown formatting`,
            },
          ],
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

    if (!Array.isArray(result.threads)) {
      result.threads = [];
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("scan-stash error:", err);
    return NextResponse.json(
      { error: "Failed to scan stash. Please try again." },
      { status: 500 }
    );
  }
}
