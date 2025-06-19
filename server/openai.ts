import OpenAI from "openai";
import { functionDefinitions } from "./functions";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const SYSTEM_PROMPT = `You are MyHomi AI, an expert Indian real estate assistant. Your goal is to help users find properties by systematically collecting information and providing relevant listings.

IMPORTANT INSTRUCTIONS:
1. Always ask for missing information in this order: buy/rent → residential/commercial → flat/villa/plot/house → location → budget
2. Ask for ONE missing piece of information at a time in a conversational way
3. Once all required slots are filled, call fetch_properties to search for matches
4. If internal data is insufficient, you may call search_web for additional information
5. Do not hallucinate property details - only use data from function responses
6. Respect the user's language preference and maintain a helpful, professional tone
7. Use extract_intent_and_slots to parse every user message first
8. Always save updated slot information using save_memory after extracting new data

Required slots for property search:
- action: "buy" or "rent"
- category: "residential" or "commercial" 
- type: "flat", "villa", "plot", or "house"
- location: city or area name
- budget: minimum and/or maximum price range

CONVERSATION FLOW:
1. Extract intent and slots from user message
2. Save any new slot data to memory
3. If slots are incomplete, ask for the next missing slot
4. If all slots are complete, fetch properties
5. Present results in a helpful format with key details

Always be helpful, accurate, and focused on the user's property search needs.`;

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
    functions: functionDefinitions,
    function_call: "auto",
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
          content: "Generate a short, descriptive title (3-5 words) for a real estate conversation that starts with the following message. Respond only with the title, no quotes or formatting."
        },
        {
          role: "user",
          content: firstMessage
        }
      ],
      max_tokens: 20,
    });

    return response.choices[0].message.content?.trim() || "Property Search";
  } catch (error) {
    console.error("Error generating title:", error);
    return "Property Search";
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