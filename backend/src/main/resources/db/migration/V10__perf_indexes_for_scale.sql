-- Targeted indexes for the queries that get hit hardest as concurrent user count grows.

-- The notification bell polls GET /api/notifications every 20s for every logged-in user
-- (NotificationBell.jsx). Each poll runs an unread count filtered on (user_id, read_at IS
-- NULL) with no supporting index - Postgres has to scan every notification row for that
-- user, for every user, every 20s. A partial index keeps that scan to just the (small,
-- roughly constant-size) set of currently-unread rows, independent of how much
-- notification history has piled up.
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;

-- DashboardService.getStats() runs three countByOwnerIdAndStatus queries on every
-- dashboard load. Existing idx_filings_owner / idx_filings_status are single-column, so
-- Postgres has to bitmap-AND two separate indexes; a composite index serves each count
-- directly.
CREATE INDEX idx_filings_owner_status ON filings(owner_id, status);

-- Upcoming-deadlines (dashboard) and the filings calendar both query
-- (owner_id, due_date BETWEEN ...) - same reasoning as above.
CREATE INDEX idx_filings_owner_due_date ON filings(owner_id, due_date);
