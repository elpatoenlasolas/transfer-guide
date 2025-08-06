-- Create PSPs (Payment Service Providers) table
CREATE TABLE public.psps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  affiliate_template TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create currencies table
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT,
  flag_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transfer routes table
CREATE TABLE public.transfer_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_psp_id UUID NOT NULL REFERENCES public.psps(id) ON DELETE CASCADE,
  to_psp_id UUID NOT NULL REFERENCES public.psps(id) ON DELETE CASCADE,
  currency_id UUID NOT NULL REFERENCES public.currencies(id) ON DELETE CASCADE,
  is_supported BOOLEAN NOT NULL DEFAULT false,
  confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
  estimated_fee_percentage DECIMAL(5,2),
  estimated_time_hours INTEGER,
  kyc_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_psp_id, to_psp_id, currency_id)
);

-- Create affiliate clicks tracking table
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.transfer_routes(id) ON DELETE CASCADE,
  user_ip INET,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.psps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (no auth required for main functionality)
CREATE POLICY "PSPs are publicly readable" 
ON public.psps 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Currencies are publicly readable" 
ON public.currencies 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Transfer routes are publicly readable" 
ON public.transfer_routes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can track affiliate clicks" 
ON public.affiliate_clicks 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_psps_updated_at
  BEFORE UPDATE ON public.psps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transfer_routes_updated_at
  BEFORE UPDATE ON public.transfer_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.psps (name, display_name, website_url, affiliate_template, description) VALUES
('wise', 'Wise', 'https://wise.com', 'https://wise.com/invite/aht/{{referral_code}}', 'International money transfers'),
('paypal', 'PayPal', 'https://paypal.com', 'https://paypal.com/webapps/mpp/referral/paypal-business-account', 'Digital payments platform'),
('skrill', 'Skrill', 'https://skrill.com', 'https://account.skrill.com/signup?rid={{referral_code}}', 'Digital wallet'),
('payoneer', 'Payoneer', 'https://payoneer.com', 'https://share.payoneer.com/nav/{{referral_code}}', 'Cross-border payments'),
('revolut', 'Revolut', 'https://revolut.com', 'https://revolut.com/referral/{{referral_code}}', 'Digital banking');

INSERT INTO public.currencies (code, name, symbol) VALUES
('USD', 'US Dollar', '$'),
('EUR', 'Euro', '€'),
('GBP', 'British Pound', '£'),
('CAD', 'Canadian Dollar', 'C$'),
('AUD', 'Australian Dollar', 'A$'),
('JPY', 'Japanese Yen', '¥'),
('CHF', 'Swiss Franc', 'CHF'),
('SGD', 'Singapore Dollar', 'S$');

-- Insert sample routes (some supported, some not)
INSERT INTO public.transfer_routes (from_psp_id, to_psp_id, currency_id, is_supported, confidence_level, estimated_fee_percentage, estimated_time_hours, kyc_required, notes)
SELECT 
  p1.id, p2.id, c.id, 
  CASE 
    WHEN (p1.name = 'wise' AND p2.name = 'paypal') THEN true
    WHEN (p1.name = 'paypal' AND p2.name = 'wise') THEN false
    WHEN (p1.name = 'wise' AND p2.name = 'revolut') THEN true
    ELSE CASE WHEN random() > 0.5 THEN true ELSE false END
  END as is_supported,
  CASE 
    WHEN (p1.name = 'wise' AND p2.name = 'paypal') THEN 95
    WHEN (p1.name = 'paypal' AND p2.name = 'wise') THEN 10
    ELSE floor(random() * 40 + 60)::integer
  END as confidence_level,
  CASE 
    WHEN (p1.name = 'wise' AND p2.name = 'paypal') THEN 1.2
    WHEN (p1.name = 'wise' AND p2.name = 'revolut') THEN 0.8
    ELSE (random() * 3 + 0.5)::decimal(5,2)
  END as estimated_fee_percentage,
  CASE 
    WHEN (p1.name = 'wise' AND p2.name = 'paypal') THEN 4
    WHEN (p1.name = 'wise' AND p2.name = 'revolut') THEN 1
    ELSE floor(random() * 24 + 1)::integer
  END as estimated_time_hours,
  random() > 0.7 as kyc_required,
  CASE 
    WHEN (p1.name = 'paypal' AND p2.name = 'wise') THEN 'Not directly supported - requires bank account intermediary'
    ELSE NULL
  END as notes
FROM public.psps p1, public.psps p2, public.currencies c
WHERE p1.id != p2.id 
AND c.code IN ('USD', 'EUR', 'GBP', 'CAD');