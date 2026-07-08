-- ---------------------------------------------------------
-- Filing templates: "this client needs GSTR-3B every month, due the 20th" -
-- set up once, and a scheduled job creates each period's Filing automatically.
-- ---------------------------------------------------------
CREATE TABLE filing_templates (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    filing_type       VARCHAR(30) NOT NULL,   -- GSTR1 | GSTR3B | ITR | TDS | AUDIT
    day_of_month_due  INT NOT NULL,           -- 1-31; clamped to the period's last day if the month is shorter
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_filing_templates_owner ON filing_templates(owner_id);
CREATE INDEX idx_filing_templates_client ON filing_templates(client_id);
CREATE INDEX idx_filing_templates_active ON filing_templates(is_active);
