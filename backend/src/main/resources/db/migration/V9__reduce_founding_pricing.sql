-- Launch pricing was too steep for the target audience (solo/small CA practices).
-- Scale all three founding prices down proportionally, anchored on Solo -> 199/month.
-- Regular (non-founding) prices are left untouched as the reference/anchor price
-- shown struck-through next to the founding price.
UPDATE plans SET founding_price_inr_monthly = 199  WHERE code = 'SOLO';
UPDATE plans SET founding_price_inr_monthly = 599  WHERE code = 'GROWTH';
UPDATE plans SET founding_price_inr_monthly = 1199 WHERE code = 'FIRM';
