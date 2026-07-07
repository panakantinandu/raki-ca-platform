-- Founding-member launch pricing: a limited-slot discounted price per plan,
-- kept alongside (not replacing) the regular price so it can be retired later
-- just by letting founding_slots_remaining run out.
ALTER TABLE plans
    ADD COLUMN founding_price_inr_monthly INT,
    ADD COLUMN founding_slots_total       INT,
    ADD COLUMN founding_slots_remaining   INT,
    ADD COLUMN founding_price_lock_months INT;

UPDATE plans SET
    founding_price_inr_monthly = 999,
    founding_slots_total = 20,
    founding_slots_remaining = 20,
    founding_price_lock_months = 12
WHERE code = 'SOLO';

UPDATE plans SET
    founding_price_inr_monthly = 2999,
    founding_slots_total = 20,
    founding_slots_remaining = 20,
    founding_price_lock_months = 12
WHERE code = 'GROWTH';

UPDATE plans SET
    founding_price_inr_monthly = 5999,
    founding_slots_total = 20,
    founding_slots_remaining = 20,
    founding_price_lock_months = 12
WHERE code = 'FIRM';
