-- Seed the three subscription tiers described in the pricing plan
INSERT INTO plans (code, name, description, price_inr_monthly, max_clients, max_seats, features, sort_order)
VALUES
(
    'SOLO',
    'Solo CA',
    'For independent practitioners managing their own client book.',
    5000,
    40,
    1,
    '["Up to 40 clients","AI document extraction","Deadline reminders","WhatsApp client updates","Email support"]',
    1
),
(
    'GROWTH',
    'Growth Firm',
    'For firms up to 5 CAs collaborating on shared clients.',
    12000,
    250,
    5,
    '["Up to 250 clients","5 team seats","AI document extraction","Deadline reminders + escalations","WhatsApp client updates","Priority support","Audit trail export"]',
    2
),
(
    'FIRM',
    'Large Firm',
    'For larger practices that need unlimited scale.',
    20000,
    NULL,
    20,
    '["Unlimited clients","20 team seats","AI document extraction","Deadline reminders + escalations","WhatsApp client updates","Dedicated onboarding","Audit trail export","API access"]',
    3
);
