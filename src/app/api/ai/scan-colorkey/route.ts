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
              text: `You are analyzing a color key or thread list from a cross stitch, needlework, or embroidery pattern. Extract every thread/color listed.

Return a JSON object with this structure:

{
  "threads": [
    {
      "manufacturer": "DMC",
      "color_number": "304",
      "color_name": "Medium Red",
      "strands": "2",
      "stitch_type": "full",
      "skeins_needed": 1
    }
  ],
  "confidence": 0.85
}

Rules:
- manufacturer must be one of: DMC, Anchor, Weeks Dye Works, Gentle Arts, Classic Colorworks, Simply Shaker, Cosmos, Sulky, Other
- stitch_type must be one of: full, backstitch, french_knot, other
- If strands are not specified, default to "2"
- If skeins are not specified, default to 1
- If a thread appears for multiple stitch types, create separate entries
- Extract ALL threads visible — even partial or hard to read ones (mark with best guess)
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

    // Ensure threads is always an array
    if (!Array.isArray(result.threads)) {
      result.threads = [];
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("scan-colorkey error:", err);
    return NextResponse.json(
      { error: "Failed to scan color key. Please try again." },
      { status: 500 }
    );
  }
}
