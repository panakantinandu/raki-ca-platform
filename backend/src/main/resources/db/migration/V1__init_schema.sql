-- =========================================================
-- V1: Core schema for CA Agent Platform
-- All queries in the app go through JPA/Hibernate parameterized
-- queries or named parameters - no string-concatenated SQL anywhere,
-- which is the primary defense against SQL injection.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- Users (CAs / firm staff who log in to the platform)
-- ---------------------------------------------------------
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name           VARCHAR(150)  NOT NULL,
    email               VARCHAR(255)  NOT NULL UNIQUE,
    password_hash       VARCHAR(255),                 -- NULL for OAuth-only accounts
    auth_provider       VARCHAR(20)   NOT NULL DEFAULT 'LOCAL', -- LOCAL | GOOGLE
    provider_id         VARCHAR(255),                 -- Google subject id, if OAuth
    role                VARCHAR(30)   NOT NULL DEFAULT 'FIRM_ADMIN', -- FIRM_ADMIN | STAFF
    firm_name           VARCHAR(200),
    phone               VARCHAR(20),
    is_email_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    failed_login_count  INT           NOT NULL DEFAULT 0,
    locked_until        TIMESTAMP,
    created_at          TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(auth_provider, provider_id);

-- ---------------------------------------------------------
-- Refresh tokens (rotatable, revocable - enables real logout
-- and horizontal scaling since validity is checked in DB/Redis,
-- not held in server memory)
-- ---------------------------------------------------------
CREATE TABLE refresh_tokens (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(255) NOT NULL,
    expires_at    TIMESTAMP NOT NULL,
    revoked       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    user_agent    VARCHAR(255),
    ip_address    VARCHAR(64)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ---------------------------------------------------------
-- Subscription plans (catalog)
-- ---------------------------------------------------------
CREATE TABLE plans (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code              VARCHAR(50) NOT NULL UNIQUE,     -- SOLO | GROWTH | FIRM
    name              VARCHAR(100) NOT NULL,
    description       VARCHAR(500),
    price_inr_monthly INT NOT NULL,
    max_clients       INT,                              -- NULL = unlimited
    max_seats         INT NOT NULL DEFAULT 1,
    features          JSONB NOT NULL DEFAULT '[]',
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order        INT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------
-- Subscriptions (one active per firm/user)
-- ---------------------------------------------------------
CREATE TABLE subscriptions (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id               UUID NOT NULL REFERENCES plans(id),
    status                VARCHAR(20) NOT NULL DEFAULT 'TRIALING', -- TRIALING | ACTIVE | PAST_DUE | CANCELED
    razorpay_customer_id  VARCHAR(100),
    razorpay_sub_id       VARCHAR(100),
    current_period_start  TIMESTAMP,
    current_period_end    TIMESTAMP,
    trial_ends_at         TIMESTAMP,
    cancel_at_period_end  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ---------------------------------------------------------
-- Payment events (audit trail from Razorpay webhooks)
-- ---------------------------------------------------------
CREATE TABLE payment_events (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id  UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    razorpay_event_id VARCHAR(150) UNIQUE,
    event_type       VARCHAR(60) NOT NULL,
    amount_inr       INT,
    status           VARCHAR(30) NOT NULL,
    raw_payload      JSONB,
    created_at       TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- Clients (the CA firm's own clients - businesses / individuals they file for)
-- ---------------------------------------------------------
CREATE TABLE clients (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(200) NOT NULL,
    entity_type    VARCHAR(30) NOT NULL DEFAULT 'INDIVIDUAL', -- INDIVIDUAL | PROPRIETORSHIP | PARTNERSHIP | COMPANY | LLP
    gstin          VARCHAR(20),
    pan            VARCHAR(15),
    email          VARCHAR(255),
    phone          VARCHAR(20),
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | INACTIVE
    notes          TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_owner ON clients(owner_id);
CREATE INDEX idx_clients_gstin ON clients(gstin);

-- ---------------------------------------------------------
-- Filings (GST / ITR / TDS tasks tracked per client)
-- ---------------------------------------------------------
CREATE TABLE filings (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id      UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    filing_type    VARCHAR(30) NOT NULL,   -- GSTR1 | GSTR3B | ITR | TDS | AUDIT
    period_label   VARCHAR(30) NOT NULL,   -- e.g. "Jul 2026" or "FY 2025-26"
    due_date       DATE NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | IN_PROGRESS | FILED | OVERDUE
    filed_at       TIMESTAMP,
    notes          TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_filings_owner ON filings(owner_id);
CREATE INDEX idx_filings_client ON filings(client_id);
CREATE INDEX idx_filings_due_date ON filings(due_date);
CREATE INDEX idx_filings_status ON filings(status);

-- ---------------------------------------------------------
-- Documents (metadata only here; actual bytes belong in S3-compatible
-- object storage - see README for the storage-service extension point)
-- ---------------------------------------------------------
CREATE TABLE documents (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id      UUID REFERENCES clients(id) ON DELETE CASCADE,
    filing_id      UUID REFERENCES filings(id) ON DELETE SET NULL,
    file_name      VARCHAR(255) NOT NULL,
    content_type   VARCHAR(100) NOT NULL,
    size_bytes     BIGINT NOT NULL,
    storage_key    VARCHAR(500) NOT NULL,
    uploaded_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_client ON documents(client_id);

-- ---------------------------------------------------------
-- Audit log (security-relevant events - logins, plan changes, deletions)
-- ---------------------------------------------------------
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    action       VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(50),
    entity_id    VARCHAR(100),
    ip_address   VARCHAR(64),
    metadata     JSONB,
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
