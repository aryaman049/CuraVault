# AI / OCR Pipeline Specification

## Process
1. Upload endpoint accepts file, stores to Supabase Storage, creates `documents` record in MongoDB (`status: "processing"`).
2. Background process kicks off asynchronously.
3. OCR extracts raw text.
4. LLM extracts structured data adhering to `medical_entities` Zod schema. System prompt strictly forbids diagnosis.
5. Parsed JSON is validated against Zod schema. Unexpected fields are stripped.
6. Validated data is saved to `medical_entities`.
7. Embedding generated from normalized summary and stored.
8. `documents.status` updated to `completed` or `failed`.
