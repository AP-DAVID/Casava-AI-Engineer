export const CHAT_MODEL = "gpt-4o-mini";
export const EMBED_MODEL = "text-embedding-3-small";

const BASE = "https://api.openai.com/v1";

function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is missing. Copy .env.example to .env.local and add your key."
    );
  }
  return key;
}

export async function createEmbeddings(inputs: string[]): Promise<number[][]> {
  const res = await fetch(`${BASE}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: inputs,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI embeddings failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };

  return [...json.data]
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export type ChatTurn = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Streams assistant text deltas via callback. Returns full assistant text. */
export async function streamChat(
  messages: ChatTurn[],
  onDelta: (text: string) => void
): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: 0.35,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text();
    throw new Error(`OpenAI chat failed (${res.status}): ${detail}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload) as {
          choices?: { delta?: { content?: string | null } }[];
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          full += delta;
          onDelta(delta);
        }
      } catch {
        // ignore partial JSON lines
      }
    }
  }

  return full;
}
