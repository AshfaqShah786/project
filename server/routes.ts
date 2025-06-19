import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { streamChatCompletion, generateTitle } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const data = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(data);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ error: "Invalid conversation data" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteConversation(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Clear messages in a conversation
  app.delete("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      await storage.deleteMessages(conversationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content
      });

      // Get conversation history
      const messages = await storage.getMessages(conversationId);
      
      // If this is the first user message, generate a title
      const userMessages = messages.filter(m => m.role === "user");
      if (userMessages.length === 1) {
        const title = await generateTitle(content);
        // Update conversation title (simplified - just update in memory)
        const conversation = await storage.getConversation(conversationId);
        if (conversation) {
          conversation.title = title;
        }
      }

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Prepare messages for OpenAI
      const openAIMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      try {
        const stream = await streamChatCompletion(openAIMessages);
        let assistantResponse = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            assistantResponse += content;
            res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
          }
        }

        // Save assistant message
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: assistantResponse
        });

        res.write(`data: ${JSON.stringify({ content: "", done: true })}\n\n`);
        res.end();

      } catch (error) {
        console.error("OpenAI API error:", error);
        res.write(`data: ${JSON.stringify({ error: "Failed to get AI response. Please check your OpenAI API key." })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
