export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type SessionRecord = {
  messages: ChatMessage[];
  lastActive: number;
};

const MAX_MESSAGES = 24; // 12 turns
const SESSION_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

const sessions = new Map<string, SessionRecord>();
const rateBuckets = new Map<string, number[]>();

function pruneSessions() {
  const now = Date.now();
  for (const [id, record] of sessions) {
    if (now - record.lastActive > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

export function getHistory(sessionId: string): ChatMessage[] {
  pruneSessions();
  return sessions.get(sessionId)?.messages ?? [];
}

export function appendMessage(sessionId: string, message: ChatMessage) {
  pruneSessions();
  const existing = sessions.get(sessionId)?.messages ?? [];
  const next = [...existing, message].slice(-MAX_MESSAGES);
  sessions.set(sessionId, { messages: next, lastActive: Date.now() });
}

export function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const stamps = (rateBuckets.get(sessionId) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (stamps.length >= RATE_MAX) {
    rateBuckets.set(sessionId, stamps);
    return false;
  }
  stamps.push(now);
  rateBuckets.set(sessionId, stamps);
  return true;
}
