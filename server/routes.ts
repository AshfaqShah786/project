import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { streamChatCompletion, generateTitle } from "./openai";
import { v4 as uuidv4 } from "uuid";

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
      const { title = "New Conversation" } = req.body;
      const sessionId = uuidv4();
      
      const conversation = await storage.createConversation({
        title,
        sessionId,
        language: "en"
      });
      
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create conversation" });
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

  // Send message and get streaming response
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Get conversation to verify it exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Save user message
      await storage.createMessage({
        conversationId,
        role: "user",
        content,
        functionCall: null,
        functionResponse: null
      });

      // Get conversation history
      const messages = await storage.getMessages(conversationId);
      
      // Generate title if this is the first user message
      const userMessages = messages.filter(m => m.role === "user");
      if (userMessages.length === 1) {
        const title = await generateTitle(content);
        // In a real implementation, you'd update the conversation title in the database
      }

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      try {
        // Prepare messages for OpenAI
        const chatMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Get AI response stream
        const stream = await streamChatCompletion(chatMessages);
        
        let fullResponse = "";

        // Process the stream
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (delta?.content) {
            fullResponse += delta.content;
            res.write(`data: ${JSON.stringify({ content: delta.content, done: false })}\n\n`);
          }
        }

        // Send completion signal
        res.write(`data: ${JSON.stringify({ content: "", done: true })}\n\n`);
        res.end();

        // Save the assistant's response
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: fullResponse,
          functionCall: null,
          functionResponse: null
        });

      } catch (error) {
        console.error("Streaming error:", error);
        res.write(`data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error("Message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Clear messages from conversation
  app.delete("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      await storage.deleteMessages(conversationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  // Add health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}