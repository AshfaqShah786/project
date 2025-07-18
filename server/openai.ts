import OpenAI from "openai";
import { functionDefinitions } from "./functions";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const SYSTEM_PROMPT = `You are a helpful AI assistant. Be conversational, friendly, and informative. You can help with a wide variety of tasks including answering questions, providing information, helping with analysis, and general conversation.

Always be helpful, accurate, and maintain a professional yet friendly tone.`;

export async function ragChatCompletion(
  messages: Array<{role: string; content: string}>,
  sessionId: string
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content
      }))
    ],

    temperature: 0.7,
  });

  return response;
}

export async function streamChatCompletion(messages: Array<{role: string; content: string}>) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    })),
    stream: true,
  });

  return stream;
}

export async function generateTitle(firstMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a short, descriptive title (3-5 words) for a conversation that starts with the following message. Respond only with the title, no quotes or formatting."
        },
        {
          role: "user",
          content: firstMessage
        }
      ],
      max_tokens: 20,
    });

    return response.choices[0].message.content?.trim() || "Chat";
  } catch (error) {
    console.error("Error generating title:", error);
    return "Chat";
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}