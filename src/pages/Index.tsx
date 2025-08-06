import { useState } from 'react';
import { TransferSearch } from '@/components/TransferSearch';
import { TransferResult } from '@/components/TransferResult';
import { useTransferData } from '@/hooks/useTransferData';
import { TransferQuery, TransferResult as TransferResultType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [searchResult, setSearchResult] = useState<TransferResultType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { searchRoute, psps, currencies } = useTransferData();
  const { toast } = useToast();

  const generateAffiliateUrl = (templateUrl: string, pspName: string): string => {
    // Simple template replacement - in production, this would be more sophisticated
    return templateUrl.replace('{{referral_code}}', 'canisenddotapp');
  };

  const handleSearch = async (query: TransferQuery) => {
    setIsSearching(true);
    try {
      const route = await searchRoute(query.fromPsp, query.toPsp, query.currency);
      
      if (route) {
        const status = route.is_supported 
          ? 'yes' 
          : route.confidence_level && route.confidence_level > 30 
            ? 'maybe' 
            : 'no';
            
        const statusColor = status === 'yes' 
          ? 'hsl(var(--success))' 
          : status === 'no' 
            ? 'hsl(var(--destructive))' 
            : 'hsl(var(--warning))';

        const affiliateUrl = route.is_supported && route.to_psp?.affiliate_template
          ? generateAffiliateUrl(route.to_psp.affiliate_template, route.to_psp.name)
          : undefined;

        setSearchResult({
          ...route,
          status,
          statusColor,
          affiliateUrl
        });
      } else {
        // No route found in database - return "maybe" result
        const fromPsp = psps.find(p => p.id === query.fromPsp);
        const toPsp = psps.find(p => p.id === query.toPsp);
        const currency = currencies.find(c => c.id === query.currency);
        
        setSearchResult({
          id: '',
          from_psp_id: query.fromPsp,
          to_psp_id: query.toPsp,
          currency_id: query.currency,
          is_supported: false,
          status: 'maybe',
          statusColor: 'hsl(var(--warning))',
          confidence_level: 50,
          notes: 'Limited information available. This route may be possible through intermediary services.',
          from_psp: fromPsp,
          to_psp: toPsp,
          currency: currency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to check transfer route. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNewSearch = () => {
    setSearchResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
      <div className="container mx-auto">
        {!searchResult ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <TransferSearch onSearch={handleSearch} isLoading={isSearching} />
          </div>
        ) : (
          <div className="py-8">
            <TransferResult result={searchResult} onNewSearch={handleNewSearch} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
