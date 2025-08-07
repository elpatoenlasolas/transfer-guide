-- Add more realistic PSPs and comprehensive route coverage
INSERT INTO public.psps (name, display_name, logo_url, website_url, affiliate_template, description) VALUES
('stripe', 'Stripe', null, 'https://stripe.com', null, 'Online payment processing'),
('square', 'Square', null, 'https://squareup.com', null, 'Point of sale and payments'),
('venmo', 'Venmo', null, 'https://venmo.com', null, 'Social payments app'),
('zelle', 'Zelle', null, 'https://zellepay.com', null, 'Bank-to-bank transfers'),
('cashapp', 'Cash App', null, 'https://cash.app', null, 'Mobile payment service'),
('westernunion', 'Western Union', null, 'https://westernunion.com', null, 'Global money transfer'),
('moneygram', 'MoneyGram', null, 'https://moneygram.com', null, 'International money transfer'),
('remitly', 'Remitly', null, 'https://remitly.com', null, 'Digital remittance service');

-- Add more currency coverage
INSERT INTO public.currencies (code, name, symbol) VALUES
('MXN', 'Mexican Peso', '$'),
('INR', 'Indian Rupee', '₹'),
('CNY', 'Chinese Yuan', '¥'),
('KRW', 'South Korean Won', '₩'),
('BRL', 'Brazilian Real', 'R$'),
('PHP', 'Philippine Peso', '₱');

-- Add realistic transfer routes with varying confidence levels
INSERT INTO public.transfer_routes (from_psp_id, to_psp_id, currency_id, is_supported, confidence_level, estimated_fee_percentage, estimated_time_hours, kyc_required, notes) 
SELECT 
  p1.id as from_psp_id,
  p2.id as to_psp_id,
  c.id as currency_id,
  CASE 
    WHEN p1.name IN ('wise', 'paypal', 'revolut') AND p2.name IN ('wise', 'paypal', 'revolut') THEN true
    WHEN p1.name = 'stripe' AND p2.name IN ('paypal', 'wise') THEN true
    WHEN p1.name IN ('venmo', 'cashapp') AND p2.name = 'paypal' THEN true
    ELSE false
  END as is_supported,
  CASE 
    WHEN p1.name IN ('wise', 'paypal', 'revolut') AND p2.name IN ('wise', 'paypal', 'revolut') THEN FLOOR(80 + RANDOM() * 20)::integer
    WHEN p1.name = 'stripe' AND p2.name IN ('paypal', 'wise') THEN FLOOR(70 + RANDOM() * 20)::integer
    WHEN p1.name IN ('venmo', 'cashapp') AND p2.name = 'paypal' THEN FLOOR(60 + RANDOM() * 25)::integer
    ELSE FLOOR(20 + RANDOM() * 40)::integer
  END as confidence_level,
  CASE 
    WHEN p1.name = 'wise' THEN ROUND((1.0 + RANDOM() * 2.0)::numeric, 2)
    WHEN p1.name = 'paypal' THEN ROUND((2.5 + RANDOM() * 2.0)::numeric, 2)
    WHEN p1.name = 'revolut' THEN ROUND((1.5 + RANDOM() * 1.5)::numeric, 2)
    ELSE ROUND((3.0 + RANDOM() * 3.0)::numeric, 2)
  END as estimated_fee_percentage,
  CASE 
    WHEN p1.name = 'wise' THEN FLOOR(2 + RANDOM() * 6)::integer
    WHEN p1.name IN ('venmo', 'cashapp', 'zelle') THEN FLOOR(1 + RANDOM() * 2)::integer
    ELSE FLOOR(6 + RANDOM() * 18)::integer
  END as estimated_time_hours,
  CASE 
    WHEN p1.name IN ('wise', 'westernunion', 'moneygram', 'remitly') THEN true
    ELSE false
  END as kyc_required,
  CASE 
    WHEN p1.name IN ('wise', 'paypal', 'revolut') AND p2.name IN ('wise', 'paypal', 'revolut') THEN 'Direct integration available'
    WHEN p1.name = 'stripe' THEN 'Available via payment processing'
    WHEN p1.name IN ('venmo', 'cashapp') THEN 'Limited to US accounts'
    ELSE 'May require intermediary service'
  END as notes
FROM 
  public.psps p1,
  public.psps p2,
  public.currencies c
WHERE 
  p1.id != p2.id 
  AND p1.is_active = true 
  AND p2.is_active = true 
  AND c.is_active = true
  -- Limit to avoid too many combinations (focus on popular pairs)
  AND (
    (p1.name IN ('wise', 'paypal', 'revolut', 'stripe', 'venmo', 'cashapp') AND c.code IN ('USD', 'EUR', 'GBP'))
    OR (p1.name IN ('wise', 'westernunion', 'remitly') AND c.code IN ('MXN', 'INR', 'PHP'))
  )
ON CONFLICT DO NOTHING;