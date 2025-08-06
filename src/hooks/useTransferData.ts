import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PSP, Currency, TransferRoute } from '@/types/database';

export const useTransferData = () => {
  const { data: psps, isLoading: pspsLoading } = useQuery({
    queryKey: ['psps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psps')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data as PSP[];
    }
  });

  const { data: currencies, isLoading: currenciesLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code');
      
      if (error) throw error;
      return data as Currency[];
    }
  });

  const searchRoute = async (fromPspId: string, toPspId: string, currencyId: string) => {
    const { data, error } = await supabase
      .from('transfer_routes')
      .select(`
        *,
        from_psp:psps!transfer_routes_from_psp_id_fkey(*),
        to_psp:psps!transfer_routes_to_psp_id_fkey(*),
        currency:currencies(*)
      `)
      .eq('from_psp_id', fromPspId)
      .eq('to_psp_id', toPspId)
      .eq('currency_id', currencyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as TransferRoute | null;
  };

  const trackAffiliateClick = async (routeId: string) => {
    const { error } = await supabase
      .from('affiliate_clicks')
      .insert({
        route_id: routeId,
        user_ip: null,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      });

    if (error) console.error('Failed to track affiliate click:', error);
  };

  return {
    psps: psps || [],
    currencies: currencies || [],
    isLoading: pspsLoading || currenciesLoading,
    searchRoute,
    trackAffiliateClick
  };
};