# CuraVault — Technical Architecture & Canonical API/Data Contract (v2)

**Status:** Canonical reference. Frontend, backend, database, and AI pipeline developers must treat this document as the source of truth. Any deviation requires updating this doc first. This version supersedes v1.

**Guiding principle:** One deployable monolith (Next.js frontend + Express backend), backed by MongoDB Atlas for application/medical data and Supabase for auth + file storage. No microservices, no message queues, no Kubernetes. Ruthless scope control for a hackathon timeline.

---

## Architecture Changes (v1 → v2)

This revision addresses nine weaknesses identified in review, without changing the product scope or core flow:

1. **File storage moved off local disk → Supabase Storage.** MongoDB now stores only object keys/metadata, never binaries. Local disk is dev-only.
2. **Authentication moved from custom bcrypt+JWT → Supabase Auth.** Supabase handles "who is this user" (registration, login, logout, session, password reset). The Express backend still owns *authorization* ("is this user allowed to touch this resource") and the entire sharing/consent model, which Supabase knows nothing about.
3. **Browser token storage changed** from "localStorage acceptable" to httpOnly, Secure, SameSite cookies as the default — long-lived tokens are no longer exposed to JavaScript unnecessarily.
4. **MongoDB is unchanged and retained as the primary application database**, including Atlas Vector Search. Supabase is used *only* for Auth and Storage — this is a deliberate hybrid, not a database migration.
5. **AI processing changed from synchronous (blocking the upload request) to asynchronous**, using an immediate response + background continuation inside the same Node process — no queue, no Redis, no microservice. The upload endpoint returns instantly with `status: "processing"`; the frontend polls for completion.
6. **Security architecture hardened**: explicit patient-isolation/IDOR rules, explicit backend-enforced doctor access rules, and share tokens are now stored as a hash (not plaintext) in the database.
7. **Supabase Storage access model defined explicitly**: no permanent public URLs; all file access goes through the backend, which authorizes the request and then issues a short-lived signed URL.
8. **AI safety boundary reinforced** with an explicit schema-validation step between LLM output and the database, so the LLM can never write arbitrary fields.
9. **MVP scope discipline preserved** — no new infrastructure categories were introduced; Supabase replaces custom auth/storage code, it does not add operational complexity.

Everything else — product flow, module boundaries, MongoDB schema shapes, QR/consent model, reminders, and MVP scope order — is unchanged from v1 except where a change above required it.

---

## Scope Classification (applies to every section below)

Every feature in this document is tagged:

- 🟢 **MUST HAVE** — required for the demo to work end-to-end. If it's missing, the demo is broken.
- 🟡 **SHOULD HAVE** — makes the demo look polished/credible, but the product still works without it. Build only after all 🟢 items are done.
- ⚪ **FUTURE / DO NOT BUILD** — explicitly out of scope for the hackathon. Do not spend time here even if it seems easy. Mentioning it is only to prevent scope creep during the build.

---

## A. High-Level Architecture

```
                         ┌─────────────────────────────┐
                         │        Next.js Frontend       │
                         │  (Patient UI + Doctor UI)     │
                         │  Supabase client (auth only)  │
                         └───────────────┬───────────────┘
                                         │ HTTPS / JSON (+ httpOnly cookie)
                         ┌───────────────▼───────────────┐
                         │     Express API (Node.js)      │
                         │  Single monolithic service      │
                         │  ─────────────────────────────  │
                         │  AuthZ │ Documents │ Timeline   │
                         │  Search │ Share/QR │ Consent    │
                         │  Audit │ Reminders               │
                         └──┬─────────┬─────────┬─────┬────┘
                            │         │         │     │
                 ┌──────────▼───┐ ┌───▼──────┐ ┌▼─────▼────────┐ ┌────────────────┐
                 │  MongoDB      │ │ Supabase │ │  OCR Engine    │ │  LLM Provider   │
                 │  Atlas        │ │ Auth     │ │ (Tesseract /   │ │ (extraction +   │
                 │  (+ Vector    │ │ (verify  │ │  Cloud OCR)    │ │  embeddings)    │
                 │   Search)     │ │  session)│ │                │ │                 │
                 └───────────────┘ └────┬─────┘ └────────────────┘ └─────────────────┘
                                         │
                                   ┌─────▼──────┐
                                   │  Supabase   │
                                   │  Storage    │
                                   │ (documents) │
                                   └─────────────┘
```

Key architectural decisions:

- 🟢 **Single Express service.** All modules (documents, search, sharing, audit, reminders) are route groups/controllers inside one Node process, not separate services. Still the single biggest scope-saving decision in this document.
- 🟢 **MongoDB Atlas remains the only application datastore.** No Redis, no separate SQL store. MongoDB Atlas Vector Search is retained for semantic search. Supabase is introduced *only* for Auth and Storage, each because it removes real implementation work (password handling, session cookies, signed file URLs) that would otherwise eat hackathon time.
- 🟢 **File storage:** Supabase Storage holds every uploaded document binary. MongoDB stores only `storageBucket` + `storageKey` + metadata (see Section D). Local disk may be used as a temporary dev convenience only and must never be the production path.
- 🟢 **AI processing is asynchronous but queue-free.** The upload request returns immediately after the file lands in Supabase Storage and a `documents` record is created; OCR → extraction → validation → embedding continue as a background continuation in the same process. See Section E for the exact mechanism and its deployment caveat.
- 🟢 **Reminders are computed on-read** (queried when the dashboard loads / a lightweight cron checks due dates), not a full notification/push infrastructure.
- 🟢 **Three clearly separated concerns**, each owned by a different part of the system:
  - **Authentication** ("who is this user?") → Supabase Auth.
  - **Authorization** ("is this user allowed to touch this resource?") → Express backend, on every request, checked against MongoDB ownership fields.
  - **Sharing/consent** ("what has this patient temporarily allowed this doctor to see?") → CuraVault's own `share_sessions` system, entirely custom, entirely backend-enforced.

---

## B. Frontend Architecture (Next.js + TypeScript)

🟢 **MUST HAVE**
- Next.js App Router, TypeScript, single app, two logical "surfaces" sharing the same codebase and component library:
  - **Patient Portal** (authenticated via Supabase session cookie): upload, timeline, search, share/consent management, reminders.
  - **Doctor View** (unauthenticated, token-gated): read-only view of a shared session, reached via `/shared/[token]`.
- Auth UI (login/register/logout/password reset) uses the Supabase client SDK, but the resulting session is exchanged for/mirrored into an **httpOnly cookie** set by the backend (or by Supabase's SSR cookie helpers) — the frontend does not read or store the raw access token in JavaScript-accessible storage. See Section F.
- State/data fetching: simple `fetch`/`axios` calls to the Express API + React state (useState/useReducer) or a lightweight data-fetch hook. No Redux.
- Document viewing: the frontend never constructs or stores a Supabase Storage URL itself. It calls the backend, which returns a short-lived signed URL (Section D/R) to render/download the file.
- Pages/routes:
  - `/login`, `/register` (Supabase Auth flows)
  - `/dashboard` (timeline feed)
  - `/upload` (shows live `processing → completed/failed` status via polling)
  - `/search`
  - `/share` (create/manage QR sessions)
  - `/shared/[token]` (doctor-facing, public but token-gated)
- Components: `DocumentCard`, `TimelineList`, `UploadDropzone`, `ProcessingStatusBadge`, `ConsentCategoryPicker`, `QRCodeDisplay`, `SearchBar`, `ReminderBanner`.

🟡 **SHOULD HAVE**
- Loading/skeleton states, toast notifications, basic responsive design.
- Category filter chips on the timeline (Prescription / Lab / Discharge / Scan / Other).
- Polling with backoff on `/documents/:id` while `status === "processing"`.

⚪ **FUTURE**
- Native mobile app, offline mode, multi-language UI, dark mode theming system, WebSocket/live-push status updates (polling is sufficient for a hackathon demo).

---

## C. Backend Architecture (Node.js + Express)

🟢 Monolithic Express app, organized by **module folders**, each with `routes → controller → service → model`. No microservices, no separate auth server (Supabase is a managed dependency, not a service we run).

```
Request → Express Router → authenticate (verify Supabase session)
        → authorize (ownership/permission check against MongoDB)
        → validateBody (schema validation)
        → Controller → Service (business logic) → Model (Mongoose) → MongoDB
```

Core modules (see folder structure in Section O for exact layout):
- `auth` — thin wrapper: verifies Supabase session on incoming requests, syncs a Mongo `users` record on first login (see Section D/F). Does **not** implement password logic.
- `documents` — upload orchestration (Supabase Storage + Mongo record), status polling, background processing kickoff, signed-URL issuance
- `timeline` — read/aggregate model over documents
- `ai` — OCR, LLM extraction, schema validation, embedding (the background continuation described in Section E)
- `search` — NL query → embedding → vector search → results
- `sharing` — QR session creation, token hashing/validation, consent scoping
- `audit` — access log writes and reads
- `reminders` — derive reminders from structured document data

🟢 Cross-cutting middleware:
- `authenticate` — verifies the Supabase-issued session token (from the httpOnly cookie) and attaches `req.user = { supabaseUserId, email }`. This answers "who is this user?" only.
- `authorize` — a per-route ownership/permission check (e.g., "does `req.user`'s Mongo `_id` match `document.patientId`?"). This is where all IDOR protection lives (Section R) and is **separate from `authenticate`** on purpose — every route handler must explicitly authorize, not just authenticate.
- `validateBody` — schema validation (Zod), used both for API input and for LLM extraction output before it is persisted.
- `errorHandler` — centralized.
- `auditLogger` — for shared-access routes.

⚪ **FUTURE**: API gateway, rate-limiting service, separate microservice per module, GraphQL layer.

---

## D. Data Architecture (MongoDB Atlas + Supabase Storage)

🟢 MongoDB Atlas remains the single application database, one connection pool, Mongoose ODM. Collections (detailed schemas in Section N):

- `users` — now stores `supabaseUserId` instead of a password hash (Supabase owns credentials)
- `documents` — now stores a Supabase Storage object reference instead of a local `fileUrl`
- `medical_entities` (structured extraction output, one-to-one with a document)
- `share_sessions` (QR access sessions) — now stores a **hashed** token
- `access_logs` (audit trail)
- `reminders`

🟢 Indexing:
- `users.supabaseUserId` — unique index
- `documents.patientId + createdAt` — compound index for timeline queries
- `share_sessions.tokenHash` — unique index
- `access_logs.sessionId + timestamp`

🟡 Vector index on `medical_entities.embedding` (MongoDB Atlas Vector Search) for semantic search. If Atlas Vector Search isn't available in the hackathon environment, fall back to: store embeddings as arrays, pull candidate docs by patientId, compute cosine similarity in Node. This is fine at hackathon data volumes (dozens–hundreds of documents).

### D.1 Supabase Storage architecture

🟢 **Bucket structure.** One private bucket, e.g. `medical-documents`. Not public. No public bucket is created for this project.

🟢 **Object naming convention.** Objects are namespaced by patient to make ownership checks trivial and to avoid collisions:

```
medical-documents/
  {patientId}/{documentId}/{originalFilenameSlug}.{ext}
```

Example: `medical-documents/665f0.../667a1.../lab_report_28aug.pdf`

The `{patientId}` here is the **MongoDB** `users._id`, not the raw Supabase user id, so a single lookup pattern (`patientId` prefix) is usable both for storage paths and Mongo queries.

🟢 **Upload flow (backend-mediated, not direct-from-browser):**
1. Frontend sends the file to the Express backend (`POST /documents`, multipart).
2. Backend authenticates + authorizes the request (the file always belongs to `req.user`'s own Mongo `_id` — a patient can never set someone else's `patientId`).
3. Backend uploads the file to Supabase Storage using the **service-role key** (server-side only, never shipped to the frontend) at the path above.
4. Backend creates the `documents` record with `storageBucket`, `storageKey`, `status: "processing"`, and returns immediately (Section E).

🟢 **Retrieval flow (no permanent public URLs):**
1. Frontend requests `GET /documents/:id/file` (or the file URL is embedded as part of `GET /documents/:id`, backend's choice — the contract in Section M documents it as a nested field).
2. Backend authorizes: for a patient, checks `document.patientId === req.user.mongoId`; for a doctor, checks the active `share_session` permits this document's category and hasn't expired/been revoked (Section G/H).
3. On success, backend calls Supabase Storage's signed-URL API (using the service-role key) and returns a **signed URL good for a short window — 5 minutes** — to the caller. The signed URL is never cached or stored; a new one is generated per authorized request.
4. If authorization fails, the backend returns `403`/`404` and never touches Supabase Storage at all.

🟢 **Unauthorized access prevention.** Because the bucket is private and objects are only ever reachable through a backend-issued, short-lived signed URL, guessing or modifying a storage path in the browser is useless without a valid signed URL — and a signed URL is only issued after the ownership/sharing check above. The raw `storageKey` is an internal detail; it is not treated as a secret by itself, but it is also never handed to a frontend that hasn't just passed an authorization check.

🟢 **Deletion.** `DELETE /documents/:id`: backend authorizes ownership, deletes the Supabase Storage object first, then deletes the Mongo `documents` and associated `medical_entities` records (in that order, so a failed storage deletion doesn't leave Mongo pointing at a phantom Mongo-only record — if storage deletion fails, the Mongo delete is aborted and a `500` is returned so the operation can be retried cleanly).

⚪ **FUTURE**: multi-region storage, CDN in front of signed URLs, resumable/chunked uploads, virus scanning pipeline, sharding, read replicas, separate analytics store.

---

## E. AI/OCR Pipeline (Asynchronous, Queue-Free)

🟢 **Upload-time flow (fast path, returns immediately):**

```
POST /documents
  → validate request (file type/size)
  → authorize (patientId = req.user's own id, always)
  → upload file to Supabase Storage
  → create `documents` record: status = "processing"
  → return { documentId, status: "processing" } to frontend      ← response ends here
  → (background continuation begins, same Node process)
      → OCR (raw text extraction)
      → LLM structured extraction (strict system prompt, JSON mode)
      → schema validation (Zod) of the LLM's output
      → save `medical_entities` (only schema-approved fields)
      → generate embedding from a normalized summary
      → update `documents.status = "completed"`
```

On failure at any background step:
```
  → documents.status = "failed"
  → documents.errorReason = <safe, non-leaky message>
  → no partial/garbage medical_entities record is left behind
```

🟢 **Mechanism (no queue, no Redis, no microservice):** the background continuation is a plain `async` function invoked without `await` right after the HTTP response is sent (e.g., `res.json(...)` followed by `processDocumentAsync(documentId).catch(...)`), running in the same Express process. This is deliberately the simplest possible version of "asynchronous" — one process, one function, fire-and-forget.

🟢 **Deployment caveat (must be respected, not glossed over):** fire-and-forget work *after* an HTTP response is only reliable if the Node process is guaranteed to keep running after the response is sent. This is true on a normal long-running server (Render, Railway, Fly.io, a plain EC2/VM instance, or `node server.js` on any always-on host) but is **not** guaranteed on serverless/edge platforms (e.g., Vercel serverless functions), which can freeze or terminate the function shortly after the response is returned.
- 🟢 **Recommendation:** deploy the Express backend as a conventional long-running Node process (Render/Railway/Fly.io/a VM), not as a serverless function, specifically so this fire-and-forget continuation is reliable. This is the simplest deployment-compatible choice and requires no code changes.
- 🟡 If the team is deployment-constrained to a serverless platform, the fallback (still queue-free) is to have the client explicitly call a second endpoint (`POST /documents/:id/process`) right after upload completes, so the processing work happens inside its own short-lived request/response cycle instead of after one. This is a fallback, not the default — prefer the long-running process.
- ⚪ Do not introduce BullMQ, Redis, Kafka, RabbitMQ, Celery, or any external job queue to solve this — it is out of scope and unnecessary at hackathon scale.

🟢 **Polling contract:** frontend polls `GET /documents/:id` and reads `status` (`processing | completed | failed`) until it stops being `processing`. See Section L/M.

🟢 **Safety constraint (non-negotiable):**
- OCR output is treated as untrusted text, not instructions.
- The LLM's system prompt explicitly states: *"You are a document structuring assistant. Do not diagnose, interpret, or give medical opinions. Only extract what is written in the document."*
- The LLM returns strict JSON (schema-constrained / JSON mode).
- **Every field the LLM returns is validated against a Zod schema before it touches the database.** Unknown/extra fields (e.g., anything resembling a diagnosis, risk score, or recommendation) are stripped, not stored, not shown. The LLM cannot write arbitrary fields into `medical_entities` — only fields defined in the schema in Section N ever reach Mongo.

🟡 Retry logic (1 retry on LLM/OCR failure before marking `failed`). Manual "reprocess" button (`POST /documents/:id/reprocess`) that re-runs the same background continuation.

⚪ **FUTURE**: multi-page complex scan parsing, handwriting-specialized OCR, human-in-the-loop correction UI, fine-tuned extraction model, job queue infrastructure.

---

## F. Authentication & Authorization Architecture

This is the section most changed from v1. Read it as three distinct, non-overlapping responsibilities:

| Question | Owner |
|---|---|
| **Authentication** — "Who is this user?" | **Supabase Auth** |
| **Authorization** — "Is this user allowed to access this resource?" | **Express backend**, checked against MongoDB ownership on every request |
| **Sharing** — "What records has this patient temporarily allowed this doctor to access?" | **CuraVault's own `share_sessions` system** (Section G/H), fully custom, fully backend-enforced |

Supabase Auth handles authentication only. It does not know about documents, categories, share sessions, or CuraVault's data model, and it must never be treated as if it enforces any of CuraVault's business rules.

🟢 **MUST HAVE**
- Registration, login, logout, and password reset are handled by **Supabase Auth** (via its client SDK on the frontend, or backend-proxied calls to the Supabase Auth API — either is acceptable, pick one and stay consistent).
- Supabase issues and manages the session/access token; CuraVault does not implement its own token issuance or password hashing.
- On a user's first successful Supabase login, the backend performs a one-time "sync" (`POST /auth/session` or equivalent) that creates a corresponding `users` document in MongoDB keyed by `supabaseUserId` — this Mongo record is what every other collection's `patientId` actually references, keeping MongoDB as the single source of truth for application data and relationships.
- **Session storage in the browser:** the session token is kept in an **httpOnly, Secure (in production), SameSite=Lax** cookie — never in `localStorage`, never readable by JavaScript. In practice this means either (a) using Supabase's SSR/cookie-based auth helpers, which manage this cookie for you, or (b) the frontend sends credentials to the backend, the backend talks to Supabase, and the backend sets the httpOnly cookie itself. Either is acceptable; plain `localStorage` token storage is explicitly removed from this architecture.
- `authenticate` middleware (Section C) verifies the Supabase session from that cookie on every request and attaches `req.user`.
- `authorize` middleware/logic (Section C) is a **separate step** on every resource-owning route, checking that the authenticated Mongo user actually owns/may access the specific resource requested (Section R — IDOR protection).

🟡 Password reset UX polish, "remember me" duration tuning.

⚪ **FUTURE**: OAuth/SSO providers beyond what Supabase offers out of the box, multi-factor auth, biometric login, doctor login accounts (see below).

Note: the **doctor** still does not get a normal login of any kind — not a custom one, not a Supabase one. Doctor access is entirely via the QR/token share flow (Section G), which deliberately has nothing to do with Supabase Auth. This avoids building or provisioning a second class of user accounts.

---

## G. QR Temporary-Access Architecture

🟢 Flow (unchanged in shape from v1, tokens are now hashed at rest):
1. Patient selects categories to share + expiry duration (e.g., 30 min / 24 hr) via `POST /share/sessions`.
2. Backend generates a cryptographically random opaque token (e.g., 32 bytes from a CSPRNG, hex/base64-encoded) — this raw token is returned to the client **once** and is never stored in plaintext.
3. Backend stores a `share_sessions` document containing only a **hash** of that token (`tokenHash`, e.g. SHA-256), plus `allowedCategories`, `expiresAt`, `status: "active"`. This means a database compromise does not directly hand over usable active tokens (the same principle as password hashing).
4. Backend returns a URL: `https://<app>/shared/{rawToken}`. Frontend renders this URL as a QR code (client-side QR generation library — no server-side QR image generation needed). **The QR code contains only the opaque URL/token — no patient name, no medical data, no other identifiers.**
5. Doctor scans QR → opens `/shared/[token]` → frontend calls `GET /share/sessions/:token` (no Supabase session required, the token itself is the credential).
6. Backend hashes the incoming raw token the same way and looks up `share_sessions` by `tokenHash`. It validates: exists, not expired, not revoked, → returns only documents/entities in `allowedCategories` for that session's `patientId`.
7. Every successful (and failed) access attempt is written to `access_logs` (Section I).
8. Session auto-expires: checked at read-time (`expiresAt < now` → reject), no cron required for correctness. 🟡 A cleanup cron to mark expired sessions `status: "expired"` is cosmetic, not required.

🟢 Patient can manually revoke a session (`PATCH /share/sessions/:id/revoke`) — sets `status: "revoked"`, checked on every subsequent read regardless of `expiresAt`.

🟢 **Trade-off note:** hashing the token adds one extra step (hash-and-compare instead of a direct equality lookup) but is cheap and directly closes the "database dump exposes every currently-active doctor link" risk. This is judged worth the minor complexity; nothing more elaborate (per-access rotating tokens, signed JWTs-as-share-tokens, etc.) is introduced, as it would not meaningfully improve security at hackathon scope while costing implementation time.

⚪ **FUTURE**: single-use QR, geofencing, doctor identity verification, push notification to patient on access.

---

## H. Permission / Consent Architecture

🟢 Consent is **category-based**, chosen at share-creation time, not per-document (per-document toggles are too fine-grained for a hackathon UI).

Categories (fixed enum): `prescription`, `lab_report`, `discharge_summary`, `scan_report`, `other`.

- `share_sessions.allowedCategories: string[]` — subset of the enum.
- Every read of shared data filters `documents.category IN allowedCategories AND documents.patientId == session.patientId`, **enforced entirely server-side**. The frontend never decides what a doctor is allowed to see — it only renders whatever the backend already filtered.
- Consent is **explicit and additive only** — nothing is shared by default; an empty `allowedCategories` array shares nothing (defensive default).

🟡 Per-document exclusion within an allowed category ("share all labs except this one").

⚪ **FUTURE**: granular field-level consent (e.g., hide medication name but show dosage schedule), consent audit trail with digital signature.

---

## I. Audit Logging Architecture

🟢 Every access to shared data — success or failure — writes an `access_logs` entry: `sessionId`, `patientId`, `timestamp`, `action` (`view_session`, `view_document`, `token_invalid`, `token_expired`), `ipAddress` (best-effort, from request), `documentIds` (if applicable).

🟢 Patient can view their own audit log: `GET /audit/logs` (own account only, authenticated + authorized to their own `patientId` only).

🟡 Audit log shown as a readable timeline in the patient UI ("Dr. Smith viewed your Lab Report on Aug 30, 3:12 PM").

⚪ **FUTURE**: tamper-evident/append-only log (hash chaining), export for compliance, anomaly detection on access patterns.

---

## J. Natural-Language Search Architecture

🟢 Flow:
1. Patient types a query (`GET /search?q=...`) — authenticated, scoped to their own `patientId` (enforced server-side, never trusts a client-supplied patient id).
2. Backend generates an embedding for the query using the same embedding model used at ingestion.
3. Vector similarity search against `medical_entities.embedding` (Atlas Vector Search, or in-memory cosine fallback per Section D) filtered to `patientId`.
4. Top-K matches mapped back to their source `documents`, returned with a snippet — this is the **grounding**: results are always tied to specific retrieved records, never invented.

🟢 This is **retrieval only** — no free-form LLM-generated conversational answer for MVP. Returning matched documents/entities is enough for the demo, avoids the diagnosis-risk of an LLM "answering" health questions, and keeps CuraVault from drifting into being a general medical chatbot.

🟡 A light LLM summarization step ("Here's what I found") that strictly summarizes retrieved extracted fields, explicitly grounded in the retrieved records only — with the same no-diagnosis system prompt constraint and schema-validation discipline as Section E.

⚪ **FUTURE**: full conversational RAG assistant, multi-turn chat over history, any answer not directly grounded in retrieved records.

---

## K. Reminder Architecture

🟢 Reminders are **derived, not separately authored**: when extraction produces a `followUpDate` or `prescribedTest.date`, a corresponding `reminders` document is created/updated (idempotent upsert keyed on `documentId + type`).
- `GET /reminders` returns upcoming (`dueDate >= now`) and overdue reminders for the logged-in patient, computed at query time — no background scheduler required for the demo.

🟡 A simple daily cron (or check-on-login) that flips `status` to `"overdue"` and could optionally trigger an email (only if an SMTP/email service is trivially available).

⚪ **FUTURE**: SMS/push notifications, calendar integration (Google Calendar sync), recurring reminders, doctor-side reminder acknowledgment.

---

## L. API Endpoint Specification

Base URL: `/api/v1`

### Auth (thin layer over Supabase)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/session` | Supabase session cookie | one-time sync: create/fetch the Mongo `users` record for the current Supabase user |
| GET | `/auth/me` | Supabase session cookie | current user profile (Mongo-side) |
| POST | `/auth/logout` | Supabase session cookie | clears the session cookie (delegates to Supabase sign-out) |

Registration, login, and password reset are performed directly against Supabase Auth (via the frontend's Supabase client, or a thin backend proxy) — they are intentionally not reimplemented as custom Express routes.

### Documents
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/documents` | session + authorize | upload a document (multipart) — stores to Supabase Storage, creates Mongo record, kicks off async OCR+extraction, returns immediately |
| GET | `/documents` | session + authorize | list own documents (timeline), supports `?category=` filter |
| GET | `/documents/:id` | session + authorize (ownership check) | single document + extracted entities + processing `status` |
| GET | `/documents/:id/file` | session + authorize (ownership check) | returns a short-lived signed URL to the underlying file |
| DELETE | `/documents/:id` | session + authorize (ownership check) | delete a document (storage object + Mongo records) |
| POST | `/documents/:id/reprocess` | session + authorize (ownership check) | (🟡) retry failed OCR/extraction |

### Search
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/search?q=` | session | NL semantic search over own documents only |

### Sharing / QR
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/share/sessions` | session + authorize | create a share session (categories + expiry) |
| GET | `/share/sessions` | session + authorize | list own active/past sessions |
| PATCH | `/share/sessions/:id/revoke` | session + authorize (ownership check) | revoke a session |
| GET | `/share/sessions/:token` | none (token is the credential) | doctor view: validated read of allowed documents |
| GET | `/share/sessions/:token/documents/:id/file` | none (token is the credential) | doctor view: signed URL for a specific allowed document |

### Audit
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/audit/logs` | session + authorize | view own access logs |

### Reminders
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/reminders` | session + authorize | list upcoming/overdue reminders |

---

## M. Request/Response JSON Contracts

All responses use this envelope:

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

On failure:

```json
{
  "success": false,
  "data": null,
  "error": { "code": "STRING_CODE", "message": "human readable message" }
}
```

### `POST /auth/session` (first-login sync with Supabase)
Request: *(no body — identity comes from the verified Supabase session cookie)*
Response `data`:
```json
{ "userId": "665f...", "supabaseUserId": "b3a1...", "email": "a@example.com", "name": "Aryaman" }
```

### `GET /auth/me`
Response `data`: same shape as above.

### `POST /documents` (multipart/form-data)
Fields: `file` (binary), `category` (enum, optional — can be inferred later).
Response `data` (returned immediately, before OCR/extraction runs):
```json
{
  "documentId": "667a...",
  "status": "processing",
  "category": "lab_report"
}
```

### `GET /documents/:id`
Response `data` while still processing:
```json
{
  "documentId": "667a...",
  "patientId": "665f...",
  "category": "lab_report",
  "status": "processing",
  "createdAt": "2026-08-30T10:00:00Z",
  "entities": null
}
```
Response `data` once completed:
```json
{
  "documentId": "667a...",
  "patientId": "665f...",
  "category": "lab_report",
  "status": "completed",
  "createdAt": "2026-08-30T10:00:00Z",
  "entities": {
    "documentType": "lab_report",
    "issuedDate": "2026-08-28",
    "provider": { "name": "Apollo Diagnostics", "doctor": "Dr. Rao" },
    "findings": [
      { "test": "Hemoglobin", "value": "13.2", "unit": "g/dL", "referenceRange": "13-17" }
    ],
    "medications": [],
    "followUpDate": null,
    "prescribedTests": []
  }
}
```
Note: `fileUrl` is intentionally **not** included here — file access always goes through `GET /documents/:id/file` so every retrieval is a freshly authorized, freshly signed request.

### `GET /documents/:id/file`
Response `data`:
```json
{
  "signedUrl": "https://<project>.supabase.co/storage/v1/object/sign/medical-documents/....",
  "expiresInSeconds": 300
}
```

### `GET /search?q=hemoglobin last month`
Response `data`:
```json
{
  "results": [
    {
      "documentId": "667a...",
      "category": "lab_report",
      "snippet": "Hemoglobin 13.2 g/dL (28 Aug 2026)",
      "score": 0.87
    }
  ]
}
```

### `POST /share/sessions`
Request:
```json
{ "allowedCategories": ["lab_report", "prescription"], "expiresInMinutes": 60 }
```
Response `data` (raw token shown once, never retrievable again):
```json
{
  "sessionId": "66aa...",
  "shareUrl": "https://curavault.app/shared/9f1c2e...",
  "expiresAt": "2026-08-31T11:00:00Z"
}
```

### `GET /share/sessions/:token` (doctor view)
Response `data`:
```json
{
  "patientName": "Aryaman",
  "allowedCategories": ["lab_report", "prescription"],
  "expiresAt": "2026-08-31T11:00:00Z",
  "documents": [ { "...": "same shape as GET /documents/:id, minus fileUrl" } ]
}
```

### `GET /share/sessions/:token/documents/:id/file` (doctor view)
Response `data`: same shape as the patient-side `GET /documents/:id/file` — a fresh short-lived signed URL, only issued if the document's category is in `allowedCategories` and the session is active.

### `GET /audit/logs`
Response `data`:
```json
{
  "logs": [
    {
      "sessionId": "66aa...",
      "action": "view_session",
      "timestamp": "2026-08-31T10:05:00Z",
      "ipAddress": "203.0.113.4"
    }
  ]
}
```

### `GET /reminders`
Response `data`:
```json
{
  "reminders": [
    {
      "reminderId": "66bb...",
      "documentId": "667a...",
      "type": "follow_up",
      "dueDate": "2026-09-10",
      "status": "upcoming",
      "note": "Follow-up with Dr. Rao"
    }
  ]
}
```

### Standard error codes
`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `PROCESSING_FAILED`, `STORAGE_ERROR`, `INTERNAL_ERROR`.

---

## N. MongoDB Collections & Schemas

### `users`
```js
{
  _id: ObjectId,
  supabaseUserId: String,   // from Supabase Auth, unique index — the link between Supabase identity and Mongo data
  name: String,
  email: String,             // mirrored from Supabase for convenience/display, not used for auth
  createdAt: Date
}
```
Note: no `passwordHash` field — Supabase Auth owns credentials entirely.

### `documents`
```js
{
  _id: ObjectId,
  patientId: ObjectId,           // ref users, indexed
  category: String,              // enum: prescription | lab_report | discharge_summary | scan_report | other
  status: String,                // processing | completed | failed
  storageBucket: String,         // e.g. "medical-documents"
  storageKey: String,            // e.g. "665f.../667a.../lab_report_28aug.pdf"
  rawOcrText: String,
  errorReason: String,           // if status = failed
  createdAt: Date,                // indexed with patientId
  updatedAt: Date
}
```
Note: no `fileUrl` field — the object is private; URLs are generated on demand and never persisted.

### `medical_entities`
```js
{
  _id: ObjectId,
  documentId: ObjectId,          // ref documents, unique index
  patientId: ObjectId,           // denormalized for query convenience and isolation checks
  documentType: String,
  issuedDate: Date,
  provider: { name: String, doctor: String },
  medications: [
    { name: String, dosage: String, frequency: String, duration: String }
  ],
  findings: [
    { test: String, value: String, unit: String, referenceRange: String }
  ],
  followUpDate: Date,
  prescribedTests: [
    { name: String, dueDate: Date }
  ],
  summaryText: String,           // normalized text used to generate embedding
  embedding: [Number]             // vector, indexed via Atlas Vector Search
}
```
Note: this schema is also the Zod validation target for LLM output (Section E) — any LLM output field not listed here is discarded before persistence.

### `share_sessions`
```js
{
  _id: ObjectId,
  patientId: ObjectId,
  tokenHash: String,             // SHA-256 of the raw token, unique index — raw token is never stored
  allowedCategories: [String],
  expiresAt: Date,
  status: String,                // active | revoked | expired
  createdAt: Date
}
```

### `access_logs`
```js
{
  _id: ObjectId,
  sessionId: ObjectId,
  patientId: ObjectId,
  action: String,                // view_session | view_document | token_invalid | token_expired
  documentIds: [ObjectId],
  ipAddress: String,
  timestamp: Date                // indexed with sessionId
}
```

### `reminders`
```js
{
  _id: ObjectId,
  patientId: ObjectId,
  documentId: ObjectId,
  type: String,                  // follow_up | prescribed_test
  dueDate: Date,
  status: String,                // upcoming | overdue | done
  note: String,
  createdAt: Date
}
```

---

## O. Folder Structure (entire repository)

🟢 Single repo, single deployable app split into `frontend/` and `backend/` (or a Next.js app with API routes if the team wants true monorepo simplicity — see note below).

```
curavault/
├── frontend/                      # Next.js app (TypeScript)
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── upload/page.tsx
│   │   ├── search/page.tsx
│   │   ├── share/page.tsx
│   │   └── shared/[token]/page.tsx
│   ├── components/
│   │   ├── DocumentCard.tsx
│   │   ├── TimelineList.tsx
│   │   ├── UploadDropzone.tsx
│   │   ├── ProcessingStatusBadge.tsx
│   │   ├── ConsentCategoryPicker.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   ├── SearchBar.tsx
│   │   └── ReminderBanner.tsx
│   ├── lib/
│   │   ├── apiClient.ts
│   │   └── supabaseClient.ts       # Supabase client init (auth only, not storage)
│   └── package.json
│
├── backend/                       # Express app
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   └── auth.service.js       # Supabase session verification + Mongo user sync
│   │   │   ├── documents/
│   │   │   │   ├── documents.routes.js
│   │   │   │   ├── documents.controller.js
│   │   │   │   ├── documents.service.js
│   │   │   │   └── documents.model.js
│   │   │   ├── ai/
│   │   │   │   ├── ocr.service.js
│   │   │   │   ├── extraction.service.js
│   │   │   │   ├── extraction.schema.js   # Zod schema — LLM output validated against this
│   │   │   │   └── embedding.service.js
│   │   │   ├── storage/
│   │   │   │   └── supabaseStorage.service.js   # upload / signed-url / delete, service-role key only
│   │   │   ├── search/
│   │   │   │   ├── search.routes.js
│   │   │   │   └── search.service.js
│   │   │   ├── sharing/
│   │   │   │   ├── sharing.routes.js
│   │   │   │   ├── sharing.controller.js
│   │   │   │   └── sharing.service.js     # token generation + hashing + validation
│   │   │   ├── audit/
│   │   │   │   ├── audit.routes.js
│   │   │   │   └── audit.service.js
│   │   │   └── reminders/
│   │   │       ├── reminders.routes.js
│   │   │       └── reminders.service.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js      # verifies Supabase session cookie
│   │   │   ├── authorize.js         # ownership/permission checks (IDOR protection)
│   │   │   ├── validateBody.js
│   │   │   ├── errorHandler.js
│   │   │   └── auditLogger.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Document.js
│   │   │   ├── MedicalEntity.js
│   │   │   ├── ShareSession.js
│   │   │   ├── AccessLog.js
│   │   │   └── Reminder.js
│   │   ├── config/
│   │   │   ├── db.js               # MongoDB connection
│   │   │   ├── supabase.js         # Supabase clients (auth verify + storage, service-role)
│   │   │   └── env.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tmp-uploads/                 # dev-only scratch space if needed before Supabase upload, gitignored, never used in production
│   └── package.json
│
├── .env.example
├── README.md
└── ARCHITECTURE.md                 # this document
```

Note: if the team wants to minimize moving parts even further, the backend can live as Next.js API routes (`app/api/...`) in the same app instead of a separate Express server. This document assumes a separate Express backend because it's easier for multiple people to work on in parallel during a hackathon, and because a long-running Express process is what makes the fire-and-forget async pipeline in Section E reliable. Either is acceptable — do not change mid-hackathon.

---

## P. Environment Variables

```
# Backend
PORT=5000
MONGODB_URI=mongodb+srv://...

# Supabase (Auth + Storage)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=...              # safe for frontend use (Auth only)
SUPABASE_SERVICE_ROLE_KEY=...      # backend only, NEVER shipped to frontend — used for Storage upload/signed-url/delete
SUPABASE_JWT_SECRET=...            # used by the backend to verify Supabase session tokens
SUPABASE_STORAGE_BUCKET=medical-documents

# AI / OCR
OCR_PROVIDER=tesseract              # or cloud provider name
LLM_API_KEY=...
LLM_MODEL=claude-sonnet-4-6
EMBEDDING_MODEL=...

# Sharing
SHARE_BASE_URL=https://curavault.app/shared

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # public/anon key only — never the service-role key
```

`SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` are backend-only secrets. There is no `JWT_SECRET` for custom-issued tokens and no `UPLOAD_DIR` production path — both are removed from this architecture.

---

## Q. Error-Handling Strategy

🟢
- Every route wrapped in a try/catch (or an `asyncHandler` wrapper) that forwards to a single centralized Express `errorHandler` middleware.
- Errors are typed with a `code` and `httpStatus`; the handler maps them to the standard envelope (Section M).
- OCR/LLM failures inside the background continuation never throw uncaught — they set `documents.status = "failed"` with a safe `errorReason` and do not affect the already-returned upload response.
- Supabase Storage upload/signed-url/delete failures are caught explicitly and surfaced as `STORAGE_ERROR`, distinct from generic `INTERNAL_ERROR`, so the frontend can show a specific retry message.
- Validation errors (Zod/Joi) return `400` with field-level messages — this applies both to API request bodies and to LLM extraction output before persistence.
- Expired/invalid share tokens return `404`-shaped responses (not `403`) to avoid confirming a token's existence to an attacker — 🟡 nice-to-have, not required for demo correctness.

⚪ **FUTURE**: structured logging/observability stack (e.g. Sentry, ELK), retry queues with backoff.

---

## R. Security Considerations

### R.1 Patient isolation & IDOR protection (🟢 MUST HAVE, non-negotiable)

Patient A must never be able to access Patient B's documents, extracted medical entities, timeline, search results, reminders, sharing sessions, or access logs — under any circumstance, regardless of what the frontend sends.

- Every route that reads or writes a resource owned by a patient (`documents`, `medical_entities`, `reminders`, `share_sessions`, `audit logs`) runs through the `authorize` middleware/check (Section C), which verifies `resource.patientId === req.user.mongoId` **on the server, from the database record**, never from a client-supplied field.
- `GET /documents/:id` is the canonical example: the backend loads the document by `:id`, then checks ownership — it does **not** trust that a logged-in user requesting `:id` is automatically entitled to it. The same pattern applies to every `:id`-shaped route (reminders, share sessions, audit logs).
- Search (`/search`) always injects `patientId: req.user.mongoId` into the query server-side; it is never accepted as a query parameter from the client.
- `authenticate` (who are you) and `authorize` (are you allowed) are kept as two distinct steps specifically so that "I verified the user is logged in" can never be mistaken for "I verified the user may see this."

### R.2 Doctor access enforcement (🟢 MUST HAVE)

- The frontend never determines what data a doctor is allowed to see — it only renders what the backend already filtered.
- On every doctor-facing request (`GET /share/sessions/:token`, `GET /share/sessions/:token/documents/:id/file`), the backend enforces, server-side, in this order: (1) token hashes to an existing session, (2) session `status === "active"`, (3) `expiresAt > now`, (4) the requested document's `category` is in `allowedCategories`, (5) the document's `patientId` matches the session's `patientId`. Failing any check returns a generic not-found/expired response and is logged.

### R.3 QR / share-token security (🟢 MUST HAVE)

- Tokens are generated from a CSPRNG (32 bytes), making them unguessable.
- Only a hash of the token (`tokenHash`) is stored — a database dump does not expose usable active tokens (Section G trade-off note).
- Tokens carry an explicit `expiresAt` and can be revoked (`status: "revoked"`) at any time by the patient.
- The QR code itself encodes only the opaque share URL — no medical data, no patient name, no other identifiers are embedded in the QR payload.
- Every validation attempt (success or failure) is logged (Section I).

### R.4 Supabase Storage access model (🟢 MUST HAVE)

- The Storage bucket is private; there is no publicly reachable "permanent" file URL for any document.
- All file access is mediated by the backend: `authenticate` + `authorize` (or the doctor-side token/session checks) must pass **before** the backend calls Supabase to mint a signed URL.
- Signed URLs are short-lived (5 minutes) and generated fresh per authorized request — never cached, never stored in Mongo, never embedded in a long-lived API response.
- The `SUPABASE_SERVICE_ROLE_KEY` used to mint signed URLs and manage the bucket lives only in backend environment variables and is never sent to the frontend.
- A user modifying a document id or storage path in a request cannot access another patient's file, because the signed URL is only ever generated after the ownership/consent check above succeeds for that specific resource — there is no code path that turns a raw client-supplied path directly into a signed URL.

### R.5 General (🟢 MUST HAVE)
- Supabase Auth handles password hashing/storage entirely; CuraVault code never touches raw passwords.
- Session cookie is httpOnly, Secure in production, SameSite=Lax (Section F) — not readable by JavaScript, mitigating XSS-based token theft.
- File upload validation: restrict MIME types (PDF/JPEG/PNG) and file size.
- Category-based consent defaults to nothing shared (Section H).

🟡 **SHOULD HAVE**
- HTTPS enforced (via hosting platform).
- Rate limiting on the public `/share/sessions/:token` endpoints (basic in-memory limiter is enough).
- Helmet.js for standard HTTP security headers.

⚪ **FUTURE / explicitly out of scope for hackathon**
- HIPAA/DPDP-level compliance certification, encryption-at-rest key management beyond what Supabase/MongoDB Atlas provide by default, penetration testing, SOC2.
- This is a prototype demonstrating the *pattern* of consent-based sharing and proper isolation, not a compliant clinical system — say this explicitly to judges if asked.

---

## S. Hackathon MVP Scope — Final Cut

### 🟢 MUST HAVE (build this, in this order)
1. Supabase Auth wired up (register/login/logout) + Mongo `users` sync on first login + httpOnly session cookie
2. Document upload → Supabase Storage → Mongo record (`status: "processing"`) → immediate response
3. Background continuation: OCR → LLM extraction → Zod validation → save `medical_entities` → embedding → `status: "completed"`; frontend polling on `GET /documents/:id`
4. Timeline view (list documents chronologically, filter by category) — owner-scoped
5. Single document detail view (extracted fields rendered nicely) + signed-URL file view (`GET /documents/:id/file`)
6. NL search (embedding + vector similarity, retrieval only, no generated answer), patient-scoped server-side
7. Share session creation with category consent + expiry, tokens hashed at rest → QR code rendered client-side
8. Doctor-facing `/shared/[token]` read-only view respecting consent + expiry, with signed-URL file access
9. Access logging on every shared-view request
10. Reminders derived from `followUpDate`/`prescribedTests`, shown on dashboard
11. IDOR checks (`authorize` step) present on every owner-scoped route before demo day — this is a correctness requirement, not polish

### 🟡 SHOULD HAVE (only after all of the above work end-to-end)
- Revoke share session manually
- Reprocess-failed-document button
- Readable audit log UI ("Dr. X viewed your Lab Report on...")
- Basic rate limiting + Helmet
- Polished loading/error/processing states

### ⚪ FUTURE / DO NOT BUILD (do not touch during the hackathon)
- Microservices, message queues, Kubernetes, Redis, Kafka, RabbitMQ
- Pinecone/Firebase/PostgreSQL/any additional database
- Push notifications, SMS, calendar sync
- Conversational RAG chat / LLM-generated diagnostic-adjacent summaries
- OAuth/SSO beyond Supabase defaults, MFA, doctor login accounts
- Field-level consent, single-use QR, geofencing
- Compliance certification (HIPAA/DPDP), tamper-evident audit chains
- Native mobile app
- External job queues for the AI pipeline

**One-sentence pitch for judges:** "CuraVault turns scattered paper medical records into a searchable, patient-controlled timeline, and lets a patient share exactly what they choose with a doctor for a limited time — with every access logged, ownership enforced on every request, and AI used only to organize, never to diagnose."

---

## Final Architecture Decision

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js + TypeScript | Fast to build a two-surface (patient/doctor) UI; TypeScript catches contract mismatches against this document early |
| **Backend** | Node.js + Express | Single monolithic service; simplest possible home for the fire-and-forget async AI pipeline |
| **Authentication** | Supabase Auth | Removes password hashing, session issuance, and reset-flow implementation work entirely |
| **File Storage** | Supabase Storage | Private buckets + signed URLs out of the box; avoids storing binaries in MongoDB or managing local disk in production |
| **Database** | MongoDB Atlas | Retained unchanged — flexible schema fits variable medical-document structures; already the system of record for every other collection |
| **Vector Search** | MongoDB Atlas Vector Search | Retained unchanged — avoids standing up a dedicated vector database (Pinecone/Weaviate) for hackathon-scale data |
| **AI/OCR** | OCR engine (Tesseract/cloud OCR) + LLM extraction, as originally specified | No compelling reason to change; the architectural change was *when* it runs (async) and *how its output is trusted* (schema-validated), not *what* it is |
| **Deployment** | Single long-running Node process for the backend (Render/Railway/Fly.io/VM) + Next.js frontend (Vercel or same host) | Simplest realistic setup that keeps the fire-and-forget async pipeline reliable, with no serverless cold-start/termination risk to the background OCR/LLM continuation |

### Consistency check (v2)

The following v1 statements have been fully removed and do **not** appear anywhere in this document:
- ❌ Local `/uploads` directory as a production storage path (now: `tmp-uploads/`, dev-only, gitignored, never used in production; production storage is Supabase Storage exclusively).
- ❌ Custom bcrypt password hashing in application code (now: Supabase Auth owns credentials entirely).
- ❌ JWT stored in `localStorage` (now: httpOnly, Secure, SameSite cookie; no long-lived token is exposed to JavaScript).
- ❌ PostgreSQL as a database anywhere in the stack (MongoDB Atlas remains the only application database; Supabase is used for Auth/Storage only, not as a Postgres data layer for CuraVault's own data).
- ❌ Synchronous OCR/LLM processing as the required production flow (now: async fire-and-forget continuation with an explicit deployment caveat and fallback).
- ❌ Public/permanent medical-document URLs (now: private bucket, backend-mediated short-lived signed URLs only).
- ❌ Frontend-enforced permissions (now: every authorization and consent check — patient isolation, doctor access, category filtering — is enforced server-side; the frontend only renders what the backend already filtered).
