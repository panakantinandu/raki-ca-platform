-- Contact form submissions (public, unauthenticated - landing page "Contact" link).
-- No email provider is wired in yet, so this table is the only record of a submission
-- until ContactEmailService (see EmailService.java) gets a real implementation.
CREATE TABLE contact_submissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);

-- Support tickets: Layer A of the Support tab (works with no Anthropic key). A ticket can be
-- filed directly by a user, or auto-created by the AI chat fallback (Layer B) when it isn't
-- confident in an answer. admin_reply/replied_at are set manually from the Admin page until
-- there's a real support team/tooling.
CREATE TABLE support_tickets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject     VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    admin_reply TEXT,
    replied_at  TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_tickets_user_created ON support_tickets(user_id, created_at DESC);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- In-app notifications, polled by the frontend (no WebSockets). reference_id/reference_type
-- are a loose, non-FK pointer to whatever the notification is about (a filing, a ticket, a
-- document) since a single table can't cleanly FK to several different parent tables.
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(40) NOT NULL,
    message         TEXT NOT NULL,
    reference_id    UUID,
    reference_type  VARCHAR(30),
    read_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
