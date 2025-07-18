import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Settings, Fan, Bot } from "lucide-react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { useMessages, useCreateConversation, useClearMessages } from "@/hooks/use-conversations";
import { sendMessage } from "@/lib/chat-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages = [], refetch: refetchMessages } = useMessages(selectedConversationId);
  const createConversation = useCreateConversation();
  const clearMessages = useClearMessages();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id === 0 ? null : id);
    setStreamingMessage("");
    setIsStreaming(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) {
      // Create new conversation
      try {
        const newConversation = await createConversation.mutateAsync("New Conversation");
        setSelectedConversationId(newConversation.id);
        
        // Wait a bit for the conversation to be created
        setTimeout(() => {
          sendMessageToConversation(newConversation.id, content);
        }, 100);
        return;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create new conversation",
          variant: "destructive",
        });
        return;
      }
    }

    sendMessageToConversation(selectedConversationId, content);
  };

  const sendMessageToConversation = async (conversationId: number, content: string) => {
    setIsStreaming(true);
    setStreamingMessage("");

    await sendMessage(
      conversationId,
      content,
      (chunk: string) => {
        setStreamingMessage(prev => prev + chunk);
      },
      () => {
        setIsStreaming(false);
        setStreamingMessage("");
        refetchMessages();
      },
      (error: string) => {
        setIsStreaming(false);
        setStreamingMessage("");
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    );
  };

  const handleClearConversation = async () => {
    if (!selectedConversationId) return;
    
    try {
      await clearMessages.mutateAsync(selectedConversationId);
      toast({
        description: "Conversation cleared",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Chat</h1>
                <p className="text-xs text-gray-500">Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              disabled={!selectedConversationId || clearMessages.isPending}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear conversation"
            >
              <Fan className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && !isStreaming ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to AI Chat
                </h2>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Your intelligent AI assistant. I'm here to help with questions, provide information, and have conversations on a wide variety of topics.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-sm">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">💭 Ask Questions</h3>
                    <p className="text-gray-600">Get answers and explanations</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">🧠 Analysis</h3>
                    <p className="text-gray-600">Help with research and analysis</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">✍️ Writing</h3>
                    <p className="text-gray-600">Content creation and editing</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">🔍 Problem Solving</h3>
                    <p className="text-gray-600">Creative and technical solutions</p>
                  </div>
                </div>
                <div className="mt-6 text-xs text-gray-500">
                  Try: "Explain quantum computing" or "Help me write a professional email"
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isStreaming && streamingMessage && (
                  <ChatMessage
                    message={{
                      id: -1,
                      role: "assistant",
                      content: streamingMessage,
                      createdAt: new Date(),
                    }}
                    isStreaming={true}
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isDisabled={isStreaming}
        />
      </div>
    </div>
  );
}
