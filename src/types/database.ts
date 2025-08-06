export interface PSP {
  id: string;
  name: string;
  display_name: string;
  logo_url?: string;
  website_url?: string;
  affiliate_template?: string;
  description?: string;
  is_active: boolean;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  flag_url?: string;
  is_active: boolean;
}

export interface TransferRoute {
  id: string;
  from_psp_id: string;
  to_psp_id: string;
  currency_id: string;
  is_supported: boolean;
  confidence_level?: number;
  estimated_fee_percentage?: number;
  estimated_time_hours?: number;
  kyc_required?: boolean;
  notes?: string;
  from_psp?: PSP;
  to_psp?: PSP;
  currency?: Currency;
}

export interface TransferQuery {
  fromPsp: string;
  toPsp: string;
  currency: string;
}

export interface TransferResult extends TransferRoute {
  status: 'yes' | 'no' | 'maybe';
  statusColor: string;
  affiliateUrl?: string;
  created_at?: string;
  updated_at?: string;
}