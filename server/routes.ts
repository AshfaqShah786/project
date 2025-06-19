import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertPropertySchema } from "@shared/schema";
import { ragChatCompletion, generateTitle } from "./openai";
import { executeFunction, getMissingSlots, mergeSlots } from "./functions";
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
      const sessionId = uuidv4();
      const data = {
        ...insertConversationSchema.parse(req.body),
        sessionId
      };
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

  // RAG-based chat endpoint
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Get conversation details
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const sessionId = conversation.sessionId;

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
        // Prepare messages for OpenAI (exclude function calls/responses from history)
        const chatMessages = messages
          .filter(msg => msg.role !== "function")
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));

        // Get AI response with function calling
        const response = await ragChatCompletion(chatMessages, sessionId);
        const choice = response.choices[0];

        let finalResponse = "";

        // Handle function calls
        if (choice.message.function_call) {
          const functionName = choice.message.function_call.name;
          const functionArgs = JSON.parse(choice.message.function_call.arguments);
          
          // Execute the function
          const functionResult = await executeFunction(functionName, functionArgs);
          
          // Save function call and response
          await storage.createMessage({
            conversationId,
            role: "assistant",
            content: choice.message.content || "",
            functionCall: choice.message.function_call,
            functionResponse: null
          });

          await storage.createMessage({
            conversationId,
            role: "function",
            content: JSON.stringify(functionResult),
            functionCall: null,
            functionResponse: functionResult
          });

          // Handle different function types
          if (functionName === "extract_intent_and_slots") {
            if (functionResult.success) {
              const { slots } = functionResult;
              
              // Get existing session data
              let session = await storage.getUserSession(sessionId);
              let mergedSlots = slots;
              
              if (session && session.slots) {
                mergedSlots = mergeSlots(session.slots as any, slots);
              }
              
              // Save updated slots
              await executeFunction("save_memory", {
                session_id: sessionId,
                slots: mergedSlots,
                language: conversation.language || "en"
              });
              
              // Check for missing slots
              const missingSlots = getMissingSlots(mergedSlots);
              
              if (missingSlots.length > 0) {
                // Ask for missing information
                const nextSlot = missingSlots[0];
                finalResponse = `I'd be happy to help you find the perfect property! I need a bit more information. Could you please tell me about the ${nextSlot}?`;
              } else {
                // All slots filled, fetch properties
                const propertyResult = await executeFunction("fetch_properties", { slots: mergedSlots });
                
                if (propertyResult.success && propertyResult.properties.length > 0) {
                  finalResponse = `Great! I found ${propertyResult.count} properties matching your criteria:\n\n`;
                  
                  propertyResult.properties.forEach((property: any, index: number) => {
                    finalResponse += `**${index + 1}. ${property.title}**\n`;
                    finalResponse += `📍 ${property.location}, ${property.city}\n`;
                    finalResponse += `💰 ₹${Number(property.price).toLocaleString('en-IN')}\n`;
                    if (property.area) finalResponse += `📐 ${property.area} sq ft\n`;
                    if (property.bedrooms) finalResponse += `🛏️ ${property.bedrooms} bed`;
                    if (property.bathrooms) finalResponse += `, ${property.bathrooms} bath\n`;
                    if (property.contactPhone) finalResponse += `📞 ${property.contactPhone}\n`;
                    finalResponse += `\n`;
                  });
                } else {
                  finalResponse = "I'm sorry, I couldn't find any properties matching your exact criteria. Would you like me to search with different parameters or search online for more options?";
                }
              }
            } else {
              finalResponse = "I had trouble understanding your request. Could you please rephrase what kind of property you're looking for?";
            }
          } else if (functionName === "fetch_properties") {
            // This is handled above in the extract_intent_and_slots flow
            finalResponse = "Let me search for properties based on your requirements...";
          } else if (functionName === "search_web") {
            finalResponse = functionResult.message || "I searched online but couldn't find additional information at the moment.";
          }
          
        } else {
          // No function call, use direct response
          finalResponse = choice.message.content || "I'm here to help you find properties. What are you looking for?";
        }

        // Stream the final response
        for (let i = 0; i < finalResponse.length; i += 10) {
          const chunk = finalResponse.slice(i, i + 10);
          res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 20)); // Small delay for streaming effect
        }

        // Save the final assistant message
        await storage.createMessage({
          conversationId,
          role: "assistant",
          content: finalResponse,
          functionCall: null,
          functionResponse: null
        });

        res.write(`data: ${JSON.stringify({ content: "", done: true })}\n\n`);
        res.end();

      } catch (error) {
        console.error("RAG Chat error:", error);
        res.write(`data: ${JSON.stringify({ error: "Failed to get AI response. Please check your OpenAI API key." })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error("Error in RAG chat endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Properties management endpoints
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const data = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(data);
      res.json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(400).json({ error: "Invalid property data" });
    }
  });

  // Session management endpoint
  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const session = await storage.getUserSession(sessionId);
      res.json(session || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
