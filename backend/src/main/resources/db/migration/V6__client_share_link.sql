-- Shareable read-only client status link. share_token is a long random unguessable
-- string, never the client's real UUID, so link enumeration can't be used to scan
-- through clients. share_enabled gates visibility independently of whether a token
-- has ever been generated, so disabling is instant without needing to destroy the token.
ALTER TABLE clients ADD COLUMN share_token VARCHAR(64) UNIQUE;
ALTER TABLE clients ADD COLUMN share_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_clients_share_token ON clients(share_token);
