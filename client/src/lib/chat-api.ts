import { apiRequest } from "./queryClient";

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date | string;
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: Date | string;
}

export async function sendMessage(
  conversationId: number,
  content: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
) {
  try {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              onError(data.error);
              return;
            }
            if (data.done) {
              onComplete();
              return;
            }
            if (data.content) {
              onChunk(data.content);
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
    onError(error instanceof Error ? error.message : 'Failed to send message');
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
