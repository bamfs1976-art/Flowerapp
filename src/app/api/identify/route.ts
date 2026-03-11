import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an expert botanist and plant identification specialist. When shown an image, identify the plant or flower and respond with ONLY a valid JSON object (no markdown, no code fences) matching this exact structure:

{
  "commonName": "string — the most widely used common name",
  "scientificName": "string — full binomial nomenclature",
  "family": "string — the plant family name",
  "confidence": "high" | "medium" | "low",
  "description": "string — 2-3 sentence description of the plant, its appearance, and where it's commonly found",
  "careInfo": {
    "sunlight": "string — sunlight requirements",
    "water": "string — watering needs",
    "soil": "string — preferred soil type",
    "temperature": "string — ideal temperature range"
  },
  "funFacts": ["string — 2-3 interesting facts about this plant"],
  "isEdible": true | false | null,
  "isToxic": true | false | null,
  "toxicityNote": "string — brief note about edibility or toxicity, or empty string if unknown"
}

If the image does not contain a plant or flower, respond with:
{
  "commonName": "Not a plant",
  "scientificName": "",
  "family": "",
  "confidence": "high",
  "description": "The image does not appear to contain a plant or flower. Please try again with a photo of a plant.",
  "careInfo": { "sunlight": "", "water": "", "soil": "", "temperature": "" },
  "funFacts": [],
  "isEdible": null,
  "isToxic": null,
  "toxicityNote": ""
}`;

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: "Identify this plant or flower. Respond with the JSON object only.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const plant = JSON.parse(textBlock.text);

    return NextResponse.json({ plant });
  } catch (error: unknown) {
    console.error("Identification error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse plant identification response" },
        { status: 500 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to identify plant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
