import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, ChatMessage } from "@/lib/chat-api";

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });
}

export function useMessages(conversationId: number | null) {
  return useQuery<ChatMessage[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: conversationId !== null,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/conversations", { title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

export function useClearMessages() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: number) => {
      await apiRequest("DELETE", `/api/conversations/${conversationId}/messages`);
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
    },
  });
}
