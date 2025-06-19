import { 
  users, type User, type InsertUser,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  properties, type Property, type InsertProperty,
  userSessions, type UserSession, type InsertUserSession,
  type Slots
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ilike, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversations
  getConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation & { sessionId: string }): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  
  // Messages
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessages(conversationId: number): Promise<void>;

  // Properties
  searchProperties(slots: Slots): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  getProperties(): Promise<Property[]>;

  // User Sessions
  getUserSession(sessionId: string): Promise<UserSession | undefined>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSession(sessionId: string, slots: Slots, language?: string): Promise<UserSession>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation & { sessionId: string }): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        functionCall: insertMessage.functionCall || null,
        functionResponse: insertMessage.functionResponse || null,
      })
      .returning();
    return message;
  }

  async deleteMessages(conversationId: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
  }

  async searchProperties(slots: Slots): Promise<Property[]> {
    const conditions = [eq(properties.isActive, true)];

    if (slots.action) {
      conditions.push(eq(properties.action, slots.action));
    }
    if (slots.category) {
      conditions.push(eq(properties.category, slots.category));
    }
    if (slots.type) {
      conditions.push(eq(properties.type, slots.type));
    }
    if (slots.location) {
      conditions.push(ilike(properties.location, `%${slots.location}%`));
    }
    if (slots.budget_min) {
      conditions.push(gte(properties.price, slots.budget_min.toString()));
    }
    if (slots.budget_max) {
      conditions.push(lte(properties.price, slots.budget_max.toString()));
    }

    return await db.select().from(properties)
      .where(and(...conditions))
      .orderBy(properties.createdAt)
      .limit(10);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(insertProperty)
      .returning();
    return property;
  }

  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties)
      .where(eq(properties.isActive, true))
      .orderBy(properties.createdAt);
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.sessionId, sessionId));
    return session || undefined;
  }

  async createUserSession(insertSession: InsertUserSession): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateUserSession(sessionId: string, slots: Slots, language?: string): Promise<UserSession> {
    const [session] = await db
      .update(userSessions)
      .set({
        slots,
        language,
        lastInteraction: new Date(),
      })
      .where(eq(userSessions.sessionId, sessionId))
      .returning();
    return session;
  }
}

export const storage = new DatabaseStorage();
