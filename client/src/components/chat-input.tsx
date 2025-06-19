import { useState, useRef, useKeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isDisabled?: boolean;
}

export function ChatInput({ onSendMessage, isDisabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = Math.min(textarea.scrollHeight, 128); // Max height of 128px
    textarea.style.height = `${scrollHeight}px`;
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-3">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                className="resize-none border-0 outline-0 bg-transparent text-gray-900 placeholder-gray-500 text-sm leading-6 min-h-6 max-h-32 p-0"
                disabled={isDisabled}
                rows={1}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors h-8 w-8"
                title="Attach file"
                disabled={isDisabled}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={!message.trim() || isDisabled}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-2 transition-colors flex items-center justify-center min-w-8 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
