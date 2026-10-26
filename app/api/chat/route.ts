import { streamChat } from "@/lib/openai";
import { buildSystemWithContext } from "@/lib/prompt";
import { retrieve } from "@/lib/rag";
import {
  appendMessage,
  checkRateLimit,
  getHistory,
} from "@/lib/sessions";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  sessionId?: string;
  message?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  const message = body.message?.trim();

  if (!sessionId || !message) {
    return Response.json(
      { error: "sessionId and message are required" },
      { status: 400 }
    );
  }

  if (message.length > 2000) {
    return Response.json({ error: "Message too long" }, { status: 400 });
  }

  if (!checkRateLimit(sessionId)) {
    return Response.json(
      { error: "Too many messages. Wait a minute and try again." },
      { status: 429 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "Server is missing OPENAI_API_KEY. Add it to .env.local and restart.",
      },
      { status: 500 }
    );
  }

  try {
    const chunks = await retrieve(message);
    const history = getHistory(sessionId);
    appendMessage(sessionId, { role: "user", content: message });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          const full = await streamChat(
            [
              { role: "system", content: buildSystemWithContext(chunks) },
              ...history.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
              { role: "user", content: message },
            ],
            (delta) => send("token", { text: delta })
          );

          appendMessage(sessionId, { role: "assistant", content: full });
          send("done", { ok: true });
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Chat stream failed";
          send("error", { message: msg });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
