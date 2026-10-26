"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
};

const SUGGESTIONS = [
  "What does Business Gro cover?",
  "How much does it cost?",
  "Does my bakery qualify?",
  "How do I apply?",
  "How do I make a claim?",
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSessionId() {
  const key = "casava-help-session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function Chat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey, you’re through to Casava Help. Office phones are down for the night, but I can walk you through Business Gro: what it covers (up to ₦1,000,000), what it costs, whether you qualify, how to apply, and how claims work. What’s on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const canSend = useMemo(
    () => Boolean(sessionId) && input.trim().length > 0 && !busy,
    [sessionId, input, busy]
  );

  async function sendMessage(text: string) {
    if (!sessionId || busy) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setError(null);
    setInput("");
    setBusy(true);

    const userMsg: Message = { id: newId(), role: "user", content: trimmed };
    const assistantId = newId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: trimmed }),
      });

      if (!res.ok || !res.body) {
        let detail = "Something went wrong. Try again in a moment.";
        try {
          const data = await res.json();
          if (data?.error) detail = data.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;

          const payload = JSON.parse(dataLine) as {
            text?: string;
            message?: string;
          };

          if (event === "token" && payload.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + payload.text }
                  : m
              )
            );
          }

          if (event === "error") {
            throw new Error(payload.message || "Stream error");
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.content
            ? {
                ...m,
                content:
                  "Sorry, I couldn’t get through just now. Check your connection or try again. You can also reach hello@casava.com or WhatsApp +234 702 500 4444.",
              }
            : m
        )
      );
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div
      className="flex h-[min(70vh,36rem)] max-h-[36rem] flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(196,15,98,0.12)]"
      aria-labelledby="chat-title"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-black/10 bg-[var(--pink-soft)] px-4 py-3 sm:px-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/10"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.png" alt="" width={22} height={22} />
        </div>
        <div className="min-w-0">
          <p
            id="chat-title"
            className="font-display text-base font-semibold leading-tight text-black"
          >
            Casava Help
          </p>
          <p className="text-xs text-[var(--ink-soft)]" aria-live="polite">
            {busy ? "Typing…" : "Usually replies in seconds"}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--mint)] px-2.5 py-1 text-[11px] font-semibold text-[var(--mint-deep)]">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--mint-deep)]"
            aria-hidden
          />
          Online
        </span>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={busy}
        tabIndex={0}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`msg-enter flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "rounded-br-md bg-[var(--pink-button)] text-white"
                  : "rounded-bl-md bg-[var(--pink-soft)] text-black shadow-sm ring-1 ring-black/5"
              }`}
            >
              <span className="sr-only">
                {m.role === "user" ? "You: " : "Casava Help: "}
              </span>
              {m.content || (
                <span className="inline-flex gap-1 px-1 py-0.5" aria-label="Casava Help is typing">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--ink-soft)]" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--ink-soft)]" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--ink-soft)]" />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div
          className="flex shrink-0 flex-wrap gap-2 border-t border-black/10 px-4 py-3 sm:px-5"
          role="group"
          aria-label="Suggested questions"
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip rounded-full border border-black/15 bg-[var(--pink-soft)] px-3 py-1.5 text-left text-xs font-semibold text-[var(--pink-text)] transition hover:border-[var(--pink-text)] hover:bg-[var(--pink-mid)]"
              onClick={() => void sendMessage(s)}
              disabled={busy || !sessionId}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p
          className="px-4 pb-2 text-xs font-medium text-[var(--error)] sm:px-5"
          role="alert"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-black/10 bg-[var(--pink-soft)] p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/10">
          <label htmlFor="chat-input" className="sr-only">
            Message Casava Help
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder="Ask about Business Gro…"
            className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] text-black outline-none placeholder:text-[var(--ink-soft)]"
            disabled={busy || !sessionId}
            aria-describedby="chat-disclaimer"
            aria-invalid={Boolean(error)}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="mb-0.5 min-h-[44px] rounded-full bg-[var(--pink-button)] px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-[var(--pink-button-hover)] disabled:cursor-not-allowed disabled:bg-[#c9c9c9] disabled:text-[#4a4a4a] disabled:opacity-100"
          >
            Send
          </button>
        </div>
        <p id="chat-disclaimer" className="mt-2 px-1 text-[11px] text-[var(--ink-soft)]">
          Answers are based on public Casava pages and the Business Gro briefing.
          Policy documents always win if something differs.
        </p>
      </form>
    </div>
  );
}
