import { storage } from "./storage";
import { slotSchema, intentSchema, type Slots, type Intent } from "@shared/schema";
import { z } from "zod";

// Function definitions for OpenAI function calling
export const functionDefinitions = [
  {
    name: "extract_intent_and_slots",
    description: "Parse user message to identify intent, fill slots (action, category, type, location, budget).",
    parameters: {
      type: "object",
      properties: {
        intent: { 
          type: "string", 
          enum: ["property_query", "general_info", "fallback"],
          description: "The detected intent from the user message"
        },
        slots: {
          type: "object",
          properties: {
            action: { 
              type: ["string", "null"], 
              enum: ["buy", "rent", null],
              description: "Whether user wants to buy or rent"
            },
            category: { 
              type: ["string", "null"], 
              enum: ["residential", "commercial", null],
              description: "Property category"
            },
            type: { 
              type: ["string", "null"], 
              enum: ["flat", "villa", "plot", "house", null],
              description: "Property type"
            },
            location: { 
              type: ["string", "null"],
              description: "Location or city name"
            },
            budget_min: { 
              type: ["number", "null"],
              description: "Minimum budget in rupees"
            },
            budget_max: { 
              type: ["number", "null"],
              description: "Maximum budget in rupees"
            }
          },
          required: []
        }
      },
      required: ["intent", "slots"]
    }
  },
  {
    name: "fetch_properties",
    description: "Query database for matching property listings based on filled slots.",
    parameters: {
      type: "object",
      properties: {
        slots: {
          type: "object",
          properties: {
            action: { type: ["string", "null"] },
            category: { type: ["string", "null"] },
            type: { type: ["string", "null"] },
            location: { type: ["string", "null"] },
            budget_min: { type: ["number", "null"] },
            budget_max: { type: ["number", "null"] }
          }
        }
      },
      required: ["slots"]
    }
  },
  {
    name: "search_web",
    description: "Fetch real estate info from web if internal data isn't enough.",
    parameters: {
      type: "object",
      properties: {
        query: { 
          type: "string",
          description: "Search query for web search"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "save_memory",
    description: "Persist updated slot values or user preferences to database.",
    parameters: {
      type: "object",
      properties: {
        session_id: { 
          type: "string",
          description: "Unique session identifier"
        },
        slots: {
          type: "object",
          properties: {
            action: { type: ["string", "null"] },
            category: { type: ["string", "null"] },
            type: { type: ["string", "null"] },
            location: { type: ["string", "null"] },
            budget_min: { type: ["number", "null"] },
            budget_max: { type: ["number", "null"] }
          }
        },
        language: { 
          type: "string",
          description: "User's preferred language"
        }
      },
      required: ["session_id", "slots"]
    }
  }
];

// Function implementations
export async function extractIntentAndSlots(args: any) {
  try {
    const { intent, slots } = args;
    
    // Validate the input
    const validatedIntent = intentSchema.parse(intent);
    const validatedSlots = slotSchema.parse(slots);
    
    return {
      success: true,
      intent: validatedIntent,
      slots: validatedSlots
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to extract intent and slots",
      details: error
    };
  }
}

export async function fetchProperties(args: any) {
  try {
    const { slots } = args;
    const validatedSlots = slotSchema.parse(slots);
    
    const properties = await storage.searchProperties(validatedSlots);
    
    return {
      success: true,
      properties: properties.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        action: p.action,
        category: p.category,
        type: p.type,
        location: p.location,
        city: p.city,
        state: p.state,
        price: p.price,
        area: p.area,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        amenities: p.amenities,
        contactPhone: p.contactPhone,
        contactEmail: p.contactEmail
      })),
      count: properties.length
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch properties",
      details: error
    };
  }
}

export async function searchWeb(args: any) {
  try {
    const { query } = args;
    
    // Simulate web search - in a real implementation, you'd use BraveAPI or similar
    // For now, return a message indicating web search would be performed
    return {
      success: true,
      message: `Web search would be performed for: "${query}"`,
      results: [],
      note: "Web search integration not implemented in this demo"
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to search web",
      details: error
    };
  }
}

export async function saveMemory(args: any) {
  try {
    const { session_id, slots, language } = args;
    const validatedSlots = slotSchema.parse(slots);
    
    // Check if session exists
    let session = await storage.getUserSession(session_id);
    
    if (session) {
      // Update existing session
      session = await storage.updateUserSession(session_id, validatedSlots, language);
    } else {
      // Create new session
      session = await storage.createUserSession({
        sessionId: session_id,
        slots: validatedSlots,
        language: language || "en"
      });
    }
    
    return {
      success: true,
      session: {
        sessionId: session.sessionId,
        slots: session.slots,
        language: session.language
      }
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to save memory",
      details: error
    };
  }
}

// Function dispatcher
export async function executeFunction(functionName: string, args: any) {
  switch (functionName) {
    case "extract_intent_and_slots":
      return await extractIntentAndSlots(args);
    case "fetch_properties":
      return await fetchProperties(args);
    case "search_web":
      return await searchWeb(args);
    case "save_memory":
      return await saveMemory(args);
    default:
      return {
        success: false,
        error: `Unknown function: ${functionName}`
      };
  }
}

// Helper function to check which slots are missing
export function getMissingSlots(slots: Slots): string[] {
  const missing: string[] = [];
  
  if (!slots.action) missing.push("action (buy/rent)");
  if (!slots.category) missing.push("category (residential/commercial)");
  if (!slots.type) missing.push("type (flat/villa/plot/house)");
  if (!slots.location) missing.push("location");
  if (!slots.budget_min && !slots.budget_max) missing.push("budget");
  
  return missing;
}

// Helper function to merge slots
export function mergeSlots(existingSlots: Slots, newSlots: Slots): Slots {
  return {
    action: newSlots.action || existingSlots.action,
    category: newSlots.category || existingSlots.category,
    type: newSlots.type || existingSlots.type,
    location: newSlots.location || existingSlots.location,
    budget_min: newSlots.budget_min || existingSlots.budget_min,
    budget_max: newSlots.budget_max || existingSlots.budget_max,
  };
}