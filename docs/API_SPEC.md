# API Specification

Base URL: `/api/v1`

## Auth
- `POST /auth/session`: Sync Supabase session. Returns `userId`.
- `GET /auth/me`: Get current user profile.
- `POST /auth/logout`: Logout.

## Documents
- `POST /documents`: Upload document (multipart).
- `GET /documents`: List own documents (`?category=`).
- `GET /documents/:id`: Single document details + status + entities.
- `GET /documents/:id/file`: Get signed URL for the underlying file.
- `DELETE /documents/:id`: Delete document and storage object.

## Search
- `GET /search?q=`: Semantic search over own documents.

## Sharing
- `POST /share/sessions`: Create a share session (returns raw token).
- `GET /share/sessions`: List active/past sessions.
- `PATCH /share/sessions/:id/revoke`: Revoke session.
- `GET /share/sessions/:token`: Doctor view (read allowed docs).
- `GET /share/sessions/:token/documents/:id/file`: Doctor view signed URL.

## Audit & Reminders
- `GET /audit/logs`: View own access logs.
- `GET /reminders`: List upcoming/overdue reminders.
