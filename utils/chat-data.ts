import { z } from "zod";
export const documentSchema = z.object({ name: z.string(), size: z.number().nonnegative(), mimeType: z.string(), uri: z.string(), hash: z.string(), authenticated: z.boolean(), blockIndex: z.number().optional(), blockHash: z.string().optional() });
export const chatSchema = z.object({ id: z.string().min(1), name: z.string().min(1), participantAddress: z.string(), lastMessage: z.string().catch(""), lastMessageTime: z.number().finite().catch(0), unreadCount: z.number().int().nonnegative().catch(0) });
export const messageSchema = z.object({ id: z.string().min(1), chatId: z.string().min(1), senderAddress: z.string(), senderName: z.string(), content: z.string(), type: z.enum(["text", "document"]), timestamp: z.number().finite(), document: documentSchema.optional() });
export function validItems<T>(schema: z.ZodType<T, any, any>, values: unknown): T[] {
  if (!Array.isArray(values)) return [];
  const unique = new Map<string, T>();
  for (const value of values) { const parsed = schema.safeParse(value); if (parsed.success) unique.set((parsed.data as { id: string }).id, parsed.data); }
  return [...unique.values()];
}
export function mergeMessages<T extends { id: string; timestamp: number }>(cached: T[], incoming: T[]): T[] {
  const merged = new Map(cached.map(m => [m.id, m]));
  for (const message of incoming) merged.set(message.id, message);
  return [...merged.values()].sort((a, b) => a.timestamp - b.timestamp);
}
