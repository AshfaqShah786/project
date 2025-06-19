import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Bot, User } from "lucide-react";
import { copyToClipboard } from "@/lib/chat-api";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: {
    id: number;
    role: "user" | "assistant";
    content: string;
    createdAt: Date | string;
  };
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [showButtons, setShowButtons] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      toast({
        description: "Message copied to clipboard",
      });
    } else {
      toast({
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (message.role === "user") {
    return (
      <div className="flex justify-end group">
        <div className="max-w-xs md:max-w-2xl">
          <div className="bg-green-600 text-white rounded-2xl rounded-br-md px-4 py-3 mb-1">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 px-1">
            <span className="text-xs text-gray-500">{timestamp}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all h-auto p-1"
              title="Copy message"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start group">
      <div className="max-w-xs md:max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 mb-1">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    pre: ({ children }) => (
                      <pre className="bg-gray-200 rounded-lg p-3 overflow-x-auto text-xs font-mono">
                        {children}
                      </pre>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return (
                        <code 
                          className={
                            isInline 
                              ? "bg-gray-200 px-1 py-0.5 rounded text-xs font-mono"
                              : "text-gray-800"
                          }
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed text-gray-900 mb-2 last:mb-0">
                        {children}
                      </p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-base font-semibold text-gray-900 mb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-semibold text-gray-900 mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        {children}
                      </h4>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-sm text-gray-900 mb-2 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-sm text-gray-900 mb-2 space-y-1">
                        {children}
                      </ol>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {isStreaming && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-gray-500">{timestamp}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all h-auto p-1"
                title="Copy message"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
