import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function streamChatCompletion(messages: Array<{role: string, content: string}>) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
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
      model: "gpt-4o",
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

    return response.choices[0].message.content?.trim() || "New Conversation";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Conversation";
  }
}
