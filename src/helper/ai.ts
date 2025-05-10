import { streamText , convertToCoreMessages ,generateText } from "ai";
import { LlmResponse } from "../types/llmTypes";

import { createAnthropic } from '@ai-sdk/anthropic';

const getAnthropicModel = (apiKey: string) => {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}
export type StreamingOptions = Omit<Parameters<typeof streamText>[0], 'model'>;
export async function streamLlmResponse(
  max_tokens: number,
  prompt: any,
  options: StreamingOptions,
  systemPrompt: any
) {
  try {
   return streamText({  
      model: getAnthropicModel(process.env.ANTHROPIC_API_KEY || ""),
      system: systemPrompt,
      messages: convertToCoreMessages(prompt),
      maxTokens: max_tokens,
      ...options,
    });
  } catch (err) {
    console.error("Stream error:", err);
  }
}



export const getLlmResponse = async (prompt: any, options: any ,systemPrompt:string) => {
  const { text } = await generateText({
    model: getAnthropicModel(process.env.ANTHROPIC_API_KEY || ""),
    prompt: prompt,
    system: systemPrompt,
    max_tokens: 300,
    ...options,
  });
  return text;
};

