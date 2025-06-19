import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sessionId: text("session_id").notNull(),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant' or 'function'
  content: text("content").notNull(),
  functionCall: jsonb("function_call"), // Store function calls
  functionResponse: jsonb("function_response"), // Store function responses
  createdAt: timestamp("created_at").defaultNow(),
});

// Property listings table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  action: text("action").notNull(), // 'buy' or 'rent'
  category: text("category").notNull(), // 'residential' or 'commercial'
  type: text("type").notNull(), // 'flat', 'villa', 'plot', 'house'
  location: text("location").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  area: numeric("area", { precision: 10, scale: 2 }), // in sq ft
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  amenities: text("amenities").array(),
  images: text("images").array(),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  embedding: text("embedding"), // For vector similarity search
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User sessions for slot tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  slots: jsonb("slots"), // Store extracted slots
  language: text("language").default("en"),
  lastInteraction: timestamp("last_interaction").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

// Schemas
export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  language: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  role: true,
  content: true,
  functionCall: true,
  functionResponse: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

// Slot schema definitions
export const slotSchema = z.object({
  action: z.enum(["buy", "rent"]).nullable().optional(),
  category: z.enum(["residential", "commercial"]).nullable().optional(),
  type: z.enum(["flat", "villa", "plot", "house"]).nullable().optional(),
  location: z.string().nullable().optional(),
  budget_min: z.number().nullable().optional(),
  budget_max: z.number().nullable().optional(),
});

export const intentSchema = z.enum(["property_query", "general_info", "fallback"]);

// Types
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type Slots = z.infer<typeof slotSchema>;
export type Intent = z.infer<typeof intentSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
