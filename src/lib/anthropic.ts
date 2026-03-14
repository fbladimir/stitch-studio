import Anthropic from "@anthropic-ai/sdk";

// Only use this on the server (API routes) — never import from client components
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const AI_MODEL = "claude-sonnet-4-5";
