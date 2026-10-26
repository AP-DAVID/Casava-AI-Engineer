# Casava Help (Business Gro chat)

Late-night website chat for Casava. Built for the take-home where Tunde (Lagos baker, 11pm) needs straight answers on Business Gro: cover, cost, eligibility, apply, claim - plus normal Casava questions (contact, health products, claims).

Looks like a support desk on the site, not a model playground. Colours and type follow casava.com (pink brand, soft pink/mint surfaces, Gooper + Fellix).

## Run it

You need Node 20+ and an OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

```bash
npm install
cp .env.example .env.local
# put your key in .env.local:
# OPENAI_API_KEY=sk-...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The key stays on the server. The browser only talks to `/api/chat`.

## What you get

- Streaming replies (text appears as it’s written)
- Remembers earlier turns in the same browser session
- Answers grounded in the markdown under `knowledge/` (small retrieval step before each reply)
- Suggestion chips for the five questions the brief cares about

## Where the facts came from

I didn’t scrape the live site into the app. I wrote short markdown notes from:

- The assignment brief (including **₦1,000,000** Business Gro coverage)
- [casava.com](https://casava.com/), [Business Gro](https://casava.com/business-gro), [About](https://casava.com/about), privacy/contact footers
- Casava’s public help articles on Business Gro (SMEDAN, ~₦200/month, fire & flood, claim email)

Public pages and the brief don’t always say the same thing on price vs cover. The chat prompt prefers the briefing’s ₦1M cover figure and still mentions the public ~₦200/month + SMEDAN path. Policy PDFs always win in real life - there’s a small disclaimer under the chat box.

This is demo copy for the assignment, not an official Casava policy document.

## How the backend works

1. Browser sends `{ sessionId, message }` to `POST /api/chat`
2. Server embeds the question with OpenAI (`text-embedding-3-small`), pulls the closest chunks from `knowledge/`
3. Builds a “Casava Help” system message with those chunks + recent history
4. Streams `gpt-4o-mini` back as SSE token events (key never leaves the server)
5. History lives in memory for the process (fine for a local demo; not multi-instance prod)

## Project map

```
app/page.tsx            landing + chat shell
app/api/chat/route.ts   streaming endpoint
components/Chat.tsx     support-style UI
lib/rag.ts              load / embed / search
lib/sessions.ts         history + light rate limit
lib/prompt.ts           tone + grounding rules
lib/openai.ts           OpenAI embeddings + chat streaming
knowledge/              product notes
```

## If I had another week

- Redis (or similar) for sessions across restarts
- A small eval set of Tunde-style questions run on every knowledge change
- Deploy behind a proper secret store
- Human handoff when retrieval confidence is low

## Note for reviewers

If chat errors on first message, double-check `.env.local` and restart `npm run dev`. First request also builds the embedding index, so it can take a couple of seconds.
