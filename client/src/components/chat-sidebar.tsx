import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Menu, X } from "lucide-react";
import { useConversations, useCreateConversation, useDeleteConversation } from "@/hooks/use-conversations";
import type { Conversation } from "@/lib/chat-api";

interface ChatSidebarProps {
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ 
  selectedConversationId, 
  onSelectConversation, 
  isOpen, 
  onToggle 
}: ChatSidebarProps) {
  const { data: conversations = [], isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  const handleNewChat = async () => {
    try {
      const newConversation = await createConversation.mutateAsync("New Conversation");
      onSelectConversation(newConversation.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteConversation.mutateAsync(id);
      if (selectedConversationId === id) {
        onSelectConversation(0);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        bg-gray-900 text-white w-64 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-20 h-full
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleNewChat}
            disabled={createConversation.isPending}
            className="w-full bg-transparent border border-gray-600 text-white hover:bg-gray-800 transition-colors"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            New chat
          </Button>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      if (window.innerWidth < 768) {
                        onToggle();
                      }
                    }}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors group relative
                      ${selectedConversationId === conversation.id 
                        ? 'bg-gray-800' 
                        : 'hover:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteConversation(e, conversation.id)}
                        disabled={deleteConversation.isPending}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all ml-2 h-auto p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">User Account</p>
              <p className="text-xs text-gray-400">Free Plan</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
