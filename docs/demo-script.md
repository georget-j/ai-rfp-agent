# Demo Script — AI RFP / Enterprise Knowledge Agent

A walkthrough guide for live demos, interview conversations, and Loom recordings. The full flow takes about 10–12 minutes; you can cut it to 5 by skipping sections 4 and 5.

---

## Before you start

1. `npm run dev` — make sure the app is running
2. Open `http://localhost:3000`
3. Check the dashboard shows documents loaded (you'll see a count)
4. If not loaded yet, click "Load Sample Documents" and wait for the confirmation

---

## Section 1: Frame the problem (1 min)

> "This is a prototype of an AI workflow tool for enterprise sales and solutions teams. The problem it solves: when you're answering an RFP or a customer proposal question, the relevant knowledge already exists somewhere in your company — a case study, a security note, an implementation guide — but pulling it together under deadline is slow, and using a generic AI tool is risky because it invents answers.
>
> This tool indexes your knowledge base and, when you ask a question, retrieves the most relevant content and generates a structured, cited response. The key design constraint is that every claim has to come from the source material — it can't make things up."

Show: the homepage. Point to the document count and the three-step workflow.

---

## Section 2: The knowledge base (2 min)

Navigate to the Documents page.

> "Here's the indexed knowledge base. I've loaded 8 sample enterprise documents — realistic but fictional. In a real deployment these would be your actual case studies, security docs, and proposal content."

Walk through the table: title, source type, chunk count, date added.

Click "View" on one document to expand it — show the chunks panel.

> "Each document gets split into sections based on its markdown headings, and each section becomes a chunk prefixed with the document title and section name. Those chunks get embedded using OpenAI's text-embedding-3-small model and stored in Postgres via pgvector. The section prefix matters — it gives the embedding a clearer topic signal than a raw character slice would."

---

## Section 3: Core query — AML RFP (4 min)

Navigate to Ask.

Type: *"Draft a response to a fintech customer asking how we reduce AML review time."*

While it loads:

> "What's happening right now: the question gets embedded with the same model as the documents, a cosine similarity search runs against the vector index to find the top 6 most relevant chunks, those chunks get passed to GPT-4o-mini with a system prompt that says don't invent facts, and the model returns structured JSON validated against a Zod schema."

Once the response appears, walk through it section by section:

- **Draft Response** — the actual text you'd drop into a proposal
- **Executive Summary** — a two-sentence version for an email subject or intro
- **Confidence** — notice it's High here, because there's a directly relevant case study
- **Supporting Evidence** — each claim has a strength rating (strong/medium/weak) based on how directly the source material supports it
- **Cited Sources** — every claim traces to a document and chunk, with a similarity score. This is the core difference from a chatbot.
- **Missing Information** — the agent is flagging what it doesn't know, in this case the customer's own baseline alert volume. This is how you prevent hallucination: force the model to be explicit about gaps rather than fill them in.
- **Suggested Next Actions** — concrete follow-ups

> "And you can copy the whole thing as markdown in one click."

---

## Section 4: Hallucination test (2 min)

Still on Ask.

Type: *"Can this platform help with hospital staffing optimisation and NHS workforce planning?"*

> "Deliberately off-topic — nothing in the knowledge base is relevant to healthcare. Watch what happens."

When it loads:

> "Confidence is Low. The missing information section says there are no relevant case studies or capabilities for healthcare workforce management. The draft answer is hedged. It didn't invent a healthcare pitch.
>
> This is the most important thing to demonstrate with any enterprise AI tool — not that it answers well when it knows the answer, but that it fails gracefully when it doesn't."

---

## Section 5: Security RFP (1–2 min)

Navigate to Demo → Enterprise Security scenario → SOC 2 question.

> "One more — a security due diligence question. The Demo page has preloaded scenarios so you can skip the typing."

When the response loads:

> "It distinguishes SOC 2 Type I as complete and Type II as in progress — because that's what the source document actually says. It also flags that you should verify current certification status with the commercial team before sending it to a customer. Grounded, cautious, and citable."

---

## Section 6: Technical overview (1 min)

> "Stack: Next.js 16 with App Router, TypeScript throughout, Tailwind CSS, Supabase Postgres with pgvector, OpenAI. The response schema is a Zod object used directly as the OpenAI structured output format — one source of truth, types flow from the database all the way to the UI. There are 42 unit tests covering chunking, prompt construction, and schema validation. The docs folder has an evaluation document with test cases and known failure modes."

---

## Wrap-up

> "The goal was to demonstrate a complete RAG workflow — ingestion, chunking, embedding, vector search, structured generation, and citation — in a way that feels like a real enterprise tool rather than a toy demo. The hallucination prevention, missing information flagging, and confidence scoring are what separate this from a file-chat application."

Tailor the closing depending on the audience:

- **Solutions engineering / forward-deployed AI:** lead with the structured output design and missing information flags — these are the features that matter in regulated enterprise contexts
- **Technical / product role:** lead with the ingestion pipeline, section-aware chunking, and the evaluation doc
- **Founding engineer / startup:** point to the clean project structure, TypeScript discipline, and single-command Vercel + Supabase deployment

---

## Questions to prepare for

**"What would you change to make this production-ready?"**
Auth and workspace isolation, background job queue for ingestion, PDF parsing, hybrid keyword + vector search, automated evaluation harness.

**"How does the hallucination prevention actually work?"**
The system prompt tells the model to answer only from the provided chunks. The `missing_information` field in the response schema forces it to be explicit about gaps rather than fill them in. Zod validation enforces the response structure.

**"How does chunking work?"**
Documents are split on `##` and `###` markdown headings. Each section becomes one or more chunks, each prefixed with `[Document > Section]`. For plain text without headings, it falls back to paragraph/sentence boundary splitting with 150-char overlap.

**"What does a query cost?"**
text-embedding-3-small is roughly $0.00002 per query. GPT-4o-mini generation is roughly $0.002–0.005 depending on context length. pgvector search is negligible. A typical session of 10 queries costs well under $0.10.

**"Could you add hybrid search?"**
Yes — add a `tsvector` column to `document_chunks`, run both queries in parallel, merge results using reciprocal rank fusion. It's probably a few hours of work on top of what's here.
