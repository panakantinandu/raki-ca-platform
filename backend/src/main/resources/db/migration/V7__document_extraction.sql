-- ---------------------------------------------------------
-- AI document extraction: explicit, user-triggered, human-reviewed-before-save.
-- ---------------------------------------------------------
ALTER TABLE documents ADD COLUMN extracted_data JSONB;
ALTER TABLE documents ADD COLUMN extraction_status VARCHAR(20);   -- NULL (never attempted) | PENDING | COMPLETED | FAILED
ALTER TABLE documents ADD COLUMN extracted_at TIMESTAMP;

-- One row per extraction API call (not per document) - re-extracting the same document still
-- costs money, so it still counts against the monthly cap. Kept separate from documents so a
-- retried/re-extracted document doesn't silently undercount usage.
CREATE TABLE document_extraction_calls (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_extraction_calls_owner_created ON document_extraction_calls(owner_id, created_at);

-- Plan-based monthly cap, same shape as plans.max_clients (NULL = unlimited). Generous soft
-- defaults for now - the point is the enforcement mechanism existing, not the exact number.
ALTER TABLE plans ADD COLUMN max_extractions_monthly INT;
UPDATE plans SET max_extractions_monthly = 100 WHERE code = 'SOLO';
UPDATE plans SET max_extractions_monthly = 500 WHERE code = 'GROWTH';
UPDATE plans SET max_extractions_monthly = NULL WHERE code = 'FIRM';
