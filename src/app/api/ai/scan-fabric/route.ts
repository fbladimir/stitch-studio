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
              text: `You are analyzing a photo of cross stitch or needlework fabric. This could be:
- A fabric bolt or package with a label
- A piece of fabric (you may need to identify type and count visually)
- A label or tag from fabric packaging

Extract all information you can determine about this fabric.

Return a JSON object with ONLY these fields (use null for anything you cannot determine):

{
  "manufacturer": "must be one of: Zweigart, Charles Craft, Wichelt, Fabric Flair, DMC, Other",
  "color_name": "the color or colorway name, e.g. Antique White, Raw Linen, Cream, Ivory",
  "size": "dimensions if visible, e.g. 9x10 inches, 12x18 inches",
  "fabric_type": "must be one of: aida, linen, evenweave, other",
  "count": "the fabric count as a string — must be one of: 14, 16, 18, 20, 22, 25, 28, 32, 36",
  "confidence": 0.85
}

Tips for identification:
- AIDA has a visible grid pattern with distinct holes
- Linen has an irregular, natural weave texture
- Evenweave has a uniform weave but finer than AIDA
- Higher counts (28, 32, 36) are almost always linen or evenweave
- Common counts: 14ct AIDA is very common for beginners, 28ct linen is popular for advanced
- Zweigart is the most common brand — look for their distinctive labels
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
    return NextResponse.json(result);
  } catch (err) {
    console.error("scan-fabric error:", err);
    return NextResponse.json(
      { error: "Failed to scan fabric. Please try again." },
      { status: 500 }
    );
  }
}
