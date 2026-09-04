# Database Specification

## Collections

### users
- `_id`: ObjectId
- `supabaseUserId`: String (unique index)
- `name`: String
- `email`: String
- `createdAt`: Date

### documents
- `_id`: ObjectId
- `patientId`: ObjectId (ref users, indexed)
- `category`: String (enum: prescription | lab_report | discharge_summary | scan_report | other)
- `status`: String (processing | completed | failed)
- `storageBucket`: String
- `storageKey`: String
- `rawOcrText`: String
- `errorReason`: String
- `createdAt`: Date (indexed with patientId)
- `updatedAt`: Date

### medical_entities
- `_id`: ObjectId
- `documentId`: ObjectId (ref documents, unique index)
- `patientId`: ObjectId (indexed)
- `documentType`: String
- `issuedDate`: Date
- `provider`: { name: String, doctor: String }
- `medications`: [ { name, dosage, frequency, duration } ]
- `findings`: [ { test, value, unit, referenceRange } ]
- `followUpDate`: Date
- `prescribedTests`: [ { name, dueDate } ]
- `summaryText`: String
- `embedding`: [Number] (vector, indexed via Atlas Vector Search)

### share_sessions
- `_id`: ObjectId
- `patientId`: ObjectId
- `tokenHash`: String (unique index)
- `allowedCategories`: [String]
- `expiresAt`: Date
- `status`: String (active | revoked | expired)
- `createdAt`: Date

### access_logs
- `_id`: ObjectId
- `sessionId`: ObjectId
- `patientId`: ObjectId
- `action`: String
- `documentIds`: [ObjectId]
- `ipAddress`: String
- `timestamp`: Date (indexed with sessionId)

### reminders
- `_id`: ObjectId
- `patientId`: ObjectId
- `documentId`: ObjectId
- `type`: String (follow_up | prescribed_test)
- `dueDate`: Date
- `status`: String (upcoming | overdue | done)
- `note`: String
- `createdAt`: Date
