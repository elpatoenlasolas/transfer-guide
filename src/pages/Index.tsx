import { useState } from 'react';
import { TransferSearch } from '@/components/TransferSearch';
import { TransferResult } from '@/components/TransferResult';
import { useTransferData } from '@/hooks/useTransferData';
import { TransferQuery, TransferResult as TransferResultType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [searchResult, setSearchResult] = useState<TransferResultType | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { searchRoute, getAIInsights, psps, currencies } = useTransferData();
  const { toast } = useToast();

  const generateAffiliateUrl = (templateUrl: string, pspName: string): string => {
    // Simple template replacement - in production, this would be more sophisticated
    return templateUrl.replace('{{referral_code}}', 'canisenddotapp');
  };

  const handleSearch = async (query: TransferQuery) => {
    setIsSearching(true);
    try {
      const fromPsp = psps.find(p => p.id === query.fromPsp);
      const toPsp = psps.find(p => p.id === query.toPsp);
      const currency = currencies.find(c => c.id === query.currency);

      // Get both database route and AI insights in parallel
      const [route, aiInsights] = await Promise.all([
        searchRoute(query.fromPsp, query.toPsp, query.currency),
        getAIInsights(fromPsp?.display_name || '', toPsp?.display_name || '', currency?.code || '')
      ]);

      console.log('Database route:', route);
      console.log('AI insights:', aiInsights);

      // Combine database data with AI insights
      let finalResult;
      
      if (route) {
        // Use database data as base, enhance with AI insights
        const enhancedConfidence = aiInsights ? 
          Math.round((route.confidence_level! + aiInsights.confidence) / 2) : 
          route.confidence_level;

        const enhancedFee = aiInsights?.estimatedFee || route.estimated_fee_percentage;
        const enhancedTime = aiInsights?.estimatedTime || route.estimated_time_hours;

        const status = route.is_supported 
          ? 'yes' 
          : enhancedConfidence && enhancedConfidence > 30 
            ? 'maybe' 
            : 'no';
            
        const statusColor = status === 'yes' 
          ? 'hsl(var(--success))' 
          : status === 'no' 
            ? 'hsl(var(--destructive))' 
            : 'hsl(var(--warning))';

        const affiliateUrl = route.is_supported && route.to_psp?.affiliate_template && route.to_psp.name.toLowerCase().includes('revolut')
          ? generateAffiliateUrl(route.to_psp.affiliate_template, route.to_psp.name)
          : undefined;

        const enhancedNotes = aiInsights ? 
          `${route.notes || ''}\n\nAI Analysis: ${aiInsights.notes}`.trim() : 
          route.notes;

        finalResult = {
          ...route,
          status,
          statusColor,
          confidence_level: enhancedConfidence,
          estimated_fee_percentage: enhancedFee,
          estimated_time_hours: enhancedTime,
          notes: enhancedNotes,
          affiliateUrl
        };
      } else if (aiInsights) {
        // No database route, use AI insights only
        const status = aiInsights.isSupported 
          ? 'yes' 
          : aiInsights.confidence > 30 
            ? 'maybe' 
            : 'no';
            
        const statusColor = status === 'yes' 
          ? 'hsl(var(--success))' 
          : status === 'no' 
            ? 'hsl(var(--destructive))' 
            : 'hsl(var(--warning))';

        finalResult = {
          id: '',
          from_psp_id: query.fromPsp,
          to_psp_id: query.toPsp,
          currency_id: query.currency,
          is_supported: aiInsights.isSupported,
          status,
          statusColor,
          confidence_level: aiInsights.confidence,
          estimated_fee_percentage: aiInsights.estimatedFee,
          estimated_time_hours: aiInsights.estimatedTime,
          notes: `Google Gemini Powered Analysis: ${aiInsights.notes}\n\nSource: ${aiInsights.sourceInfo}`,
          from_psp: fromPsp,
          to_psp: toPsp,
          currency: currency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        // Fallback - no route and no AI insights
        finalResult = {
          id: '',
          from_psp_id: query.fromPsp,
          to_psp_id: query.toPsp,
          currency_id: query.currency,
          is_supported: false,
          status: 'maybe' as const,
          statusColor: 'hsl(var(--warning))',
          confidence_level: 40,
          notes: 'Limited information available. This route may be possible through intermediary services.',
          from_psp: fromPsp,
          to_psp: toPsp,
          currency: currency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      setSearchResult(finalResult);
      
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
