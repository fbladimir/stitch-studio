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
      max_tokens: 1024,
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
              text: `You are analyzing the cover page of a cross stitch or needlework pattern/chart. Extract all information you can see on this cover.

Return a JSON object with ONLY these fields (use null for anything you cannot determine):

{
  "name": "pattern/chart name",
  "designer": "designer name",
  "company": "publisher or company name",
  "size_inches": "design size in inches, e.g. 14 x 14",
  "size_stitches": "design size in stitches, e.g. 196 x 196",
  "rec_thread_brand": "recommended thread brand — must be one of: DMC, Anchor, Weeks Dye Works, Gentle Arts, Classic Colorworks, Simply Shaker, Cosmos, Sulky, or Other",
  "rec_fabric": "recommended fabric and count, e.g. 14 Count AIDA White",
  "chart_type": "one of: paper, pdf, magazine, digital",
  "confidence": 0.85
}

Rules:
- confidence is 0.0 to 1.0 — how confident you are in the overall extraction
- If this is a magazine, set chart_type to "magazine"
- For size fields, use the × symbol between dimensions
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

    // Parse JSON from response — handle potential markdown wrapping
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (err) {
    console.error("scan-cover error:", err);
    return NextResponse.json(
      { error: "Failed to scan cover. Please try again." },
      { status: 500 }
    );
  }
}
