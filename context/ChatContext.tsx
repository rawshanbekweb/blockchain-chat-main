import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, getServerUrl, setServerUrl } from "@/utils/api";
import { socket } from "@/utils/socket";
import { getItem, setItem } from "@/utils/storage";
import { chatSchema, messageSchema, validItems, mergeMessages } from "@/utils/chat-data";
import { useWallet } from "./WalletContext";
export interface DocumentAttachment { name: string; size: number; mimeType: string; uri: string; hash: string; authenticated: boolean; blockIndex?: number; blockHash?: string; }
export interface Message { id: string; chatId: string; senderAddress: string; senderName: string; content: string; type: "text" | "document"; timestamp: number; document?: DocumentAttachment; }
export interface Chat { id: string; name: string; participantAddress: string; lastMessage: string; lastMessageTime: number; unreadCount: number; }
type SendParams = Omit<Message, "id" | "timestamp">;
interface ChatContextValue {
  chats: Chat[]; getMessages: (id: string) => Message[];
  createChat: (name: string, address: string) => Promise<Chat>;
  sendMessage: (params: SendParams) => Promise<void>;
  updateMessageDocument: (chatId: string, messageId: string, updates: Partial<DocumentAttachment>) => Promise<void>;
  markAsRead: (id: string) => () => void;
  isLoaded: boolean; isOnline: boolean; serverUrl: string; syncError: string;
  setAndSaveServerUrl: (url: string) => Promise<void>;
}
const ChatContext = createContext<ChatContextValue | null>(null);
const CHATS_KEY = "blockchat:chats_v2";
const PREFIX = "blockchat:messages_v2:";
function toChat(room: any): Chat { return chatSchema.parse({ id: room.id, name: room.name, participantAddress: room.participantAddress || room.createdBy || "", lastMessage: room.lastMessage || "", lastMessageTime: new Date(room.lastMessageTime || 0).getTime(), unreadCount: 0 }); }
function toMessage(m: any, id: string): Message { return messageSchema.parse({ ...m, chatId: m.roomId || m.room_id || id, senderAddress: m.senderAddress || m.sender_address || "", senderName: m.senderName || m.sender_name || "", type: m.type === "new_message" ? (m.document ? "document" : "text") : m.type || "text", document: m.document || undefined, timestamp: m.timestamp || new Date(m.created_at).getTime() }); }
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { walletAddress, walletName, isLoading } = useWallet();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const chatsRef = useRef(chats); const messagesRef = useRef(messages);
  const [isLoaded, setLoaded] = useState(false);
  const [isOnline, setOnline] = useState(false);
  const [serverUrl, setUrl] = useState("");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [syncError, setError] = useState("");
  const active = useRef<string | null>(null);
  const saveChats = useCallback((next: Chat[]) => { chatsRef.current = next; setChats(next); void setItem(CHATS_KEY, next).catch(() => setError("Suhbatlar qurilmaga saqlanmadi.")); }, []);
  const saveMessages = useCallback((id: string, next: Message[]) => { const all = { ...messagesRef.current, [id]: next }; messagesRef.current = all; setMessages(all); void setItem(PREFIX + id, next).catch(() => setError("Xabarlar qurilmaga saqlanmadi.")); }, []);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = validItems(chatSchema, await getItem(CHATS_KEY, []));
      const entries = await Promise.all(saved.map(async c => [c.id, validItems(messageSchema, await getItem(PREFIX + c.id, []))] as const));
      if (cancelled) return;
      chatsRef.current = saved; setChats(saved);
      messagesRef.current = Object.fromEntries(entries); setMessages(messagesRef.current); setLoaded(true);
      try { const url = await getServerUrl(); if (!cancelled) setUrl(url); } catch { if (!cancelled) setError("Server sozlamasi o‘qilmadi."); }
    })();
    return () => { cancelled = true; };
  }, []);
  const receive = useCallback((msg: Message) => {
    const old = messagesRef.current[msg.chatId] || [];
    const duplicate = old.some(m => m.id === msg.id);
    saveMessages(msg.chatId, mergeMessages(old, [msg]));
    saveChats(chatsRef.current.map(c => c.id === msg.chatId ? { ...c, lastMessage: msg.type === "document" ? `Hujjat: ${msg.document?.name || "fayl"}` : msg.content, lastMessageTime: msg.timestamp, unreadCount: active.current === msg.chatId || msg.senderAddress === walletAddress ? 0 : c.unreadCount + (duplicate ? 0 : 1) } : c));
  }, [walletAddress, saveChats, saveMessages]);
  useEffect(() => {
    if (isLoading || !isLoaded || !walletAddress || !serverUrl) return;
    let cancelled = false; let refreshing = false;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const rooms = await api.getRooms(walletAddress);
        if (cancelled) return;
        const remote = rooms.map(toChat);
        // Merge the server snapshot with cached rooms. Local notes must survive reconnects.
        const merged = new Map(chatsRef.current.map(c => [c.id, c]));
        for (const c of remote) { const old = merged.get(c.id); merged.set(c.id, { ...c, unreadCount: old?.unreadCount || 0, ...(old && old.lastMessageTime > c.lastMessageTime ? { lastMessage: old.lastMessage, lastMessageTime: old.lastMessageTime } : {}) }); socket.joinRoom(c.id); }
        saveChats([...merged.values()]);
        for (let i = 0; i < remote.length; i += 6) {
          await Promise.all(remote.slice(i, i + 6).map(async c => {
            const rows = await api.getMessages(c.id);
            if (!cancelled) saveMessages(c.id, mergeMessages(messagesRef.current[c.id] || [], rows.map(m => toMessage(m, c.id))));
          }));
          if (cancelled) return;
        }
        setError("");
      } catch { if (!cancelled) setError("Server bilan yangilab bo‘lmadi. Saqlangan suhbatlar ko‘rsatilmoqda."); }
      finally { refreshing = false; }
    };
    const unsub = [
      socket.on("connected", () => { if (!cancelled) { setOnline(true); void refresh(); } }),
      socket.on("disconnected", () => { if (!cancelled) setOnline(false); }),
      socket.on("new_message", data => { if (cancelled) return; try { const msg = toMessage(data.message || data, data.roomId); receive(msg); if (!chatsRef.current.some(c => c.id === msg.chatId)) void refresh(); } catch {} }),
      socket.on("doc_authenticated", data => { if (cancelled) return; for (const [id, list] of Object.entries(messagesRef.current)) { if (list.some(m => m.id === data.messageId)) saveMessages(id, list.map(m => m.id === data.messageId && m.document ? { ...m, document: { ...m.document, ...data.document } } : m)); } }),
    ];
    void (async () => { try { await api.registerUser(walletAddress, walletName || "Ravoq"); } catch {} if (!cancelled) await socket.connect(walletAddress); })();
    return () => { cancelled = true; unsub.forEach(fn => fn()); socket.disconnect(); setOnline(false); };
  }, [isLoading, isLoaded, walletAddress, walletName, serverUrl, connectionAttempt, receive, saveChats, saveMessages]);
  const createChat = useCallback(async (name: string, address: string) => {
    let id = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (address) {
      if (!isOnline) throw new Error("Serverga ulaning va qayta urinib ko‘ring.");
      const room = await api.createRoom(name, walletAddress, address); id = room.id; socket.joinRoom(id);
    }
    const chat = { id, name, participantAddress: address, lastMessage: "", lastMessageTime: Date.now(), unreadCount: 0 };
    await setItem(CHATS_KEY, [chat, ...chatsRef.current]);
    saveChats([chat, ...chatsRef.current]); saveMessages(id, []); return chat;
  }, [isOnline, walletAddress, saveChats, saveMessages]);
  const sendMessage = useCallback(async (params: SendParams) => {
    if (!params.chatId.startsWith("local-")) {
      if (!isOnline) throw new Error("Server uzilgan. Matningiz saqlanib turibdi, ulangach qayta yuboring.");
      const result = await api.sendMessage({ ...params, roomId: params.chatId }); receive(toMessage(result, params.chatId)); return;
    }
    const msg = { ...params, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: Date.now() };
    await setItem(PREFIX + params.chatId, [...(messagesRef.current[params.chatId] || []), msg]); receive(msg);
  }, [isOnline, receive]);
  const updateMessageDocument = useCallback(async (chatId: string, messageId: string, updates: Partial<DocumentAttachment>) => {
    const list = messagesRef.current[chatId] || [];
    const msg = list.find(m => m.id === messageId);
    if (!msg?.document) return;
    const document = { ...msg.document, ...updates };
    if (!chatId.startsWith("local-")) await api.updateDocument(messageId, document);
    saveMessages(chatId, list.map(m => m.id === messageId ? { ...m, document } : m));
  }, [saveMessages]);
  const markAsRead = useCallback((id: string) => { active.current = id; saveChats(chatsRef.current.map(c => c.id === id ? { ...c, unreadCount: 0 } : c)); return () => { if (active.current === id) active.current = null; }; }, [saveChats]);
  const setAndSaveServerUrl = useCallback(async (url: string) => { await setServerUrl(url); socket.disconnect(); setOnline(false); setUrl(await getServerUrl()); setConnectionAttempt(n => n + 1); }, []);
  return <ChatContext.Provider value={{ chats, getMessages: id => messages[id] || [], createChat, sendMessage, updateMessageDocument, markAsRead, isLoaded, isOnline, serverUrl, syncError, setAndSaveServerUrl }}>{children}</ChatContext.Provider>;
}
export function useChat() { const value = useContext(ChatContext); if (!value) throw new Error("ChatProvider kerak"); return value; }
