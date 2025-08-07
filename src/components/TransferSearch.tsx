import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransferData } from '@/hooks/useTransferData';
import { TransferQuery } from '@/types/database';

interface TransferSearchProps {
  onSearch: (query: TransferQuery) => void;
  isLoading?: boolean;
}

export const TransferSearch = ({ onSearch, isLoading }: TransferSearchProps) => {
  const { psps, currencies, isLoading: dataLoading } = useTransferData();
  const [query, setQuery] = useState<TransferQuery>({
    fromPsp: '',
    toPsp: '',
    currency: ''
  });

  const handleSearch = () => {
    if (query.fromPsp && query.toPsp && query.currency) {
      onSearch(query);
    }
  };

  const isFormValid = query.fromPsp && query.toPsp && query.currency && query.fromPsp !== query.toPsp;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Can I Send?
          </h1>
          <p className="text-xl text-muted-foreground">
            Check if money transfers are possible between payment providers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">From</label>
            <Select
              value={query.fromPsp}
              onValueChange={(value) => setQuery(prev => ({ ...prev, fromPsp: value }))}
              disabled={dataLoading}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select sending PSP" />
              </SelectTrigger>
              <SelectContent>
                {psps.map((psp) => (
                  <SelectItem key={psp.id} value={psp.id}>
                    {psp.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:flex justify-center items-center">
            <div className="text-2xl text-primary animate-pulse">💸</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">To</label>
            <Select
              value={query.toPsp}
              onValueChange={(value) => setQuery(prev => ({ ...prev, toPsp: value }))}
              disabled={dataLoading}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select receiving PSP" />
              </SelectTrigger>
              <SelectContent>
                {psps.filter(psp => psp.id !== query.fromPsp).map((psp) => (
                  <SelectItem key={psp.id} value={psp.id}>
                    {psp.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Currency</label>
            <Select
              value={query.currency}
              onValueChange={(value) => setQuery(prev => ({ ...prev, currency: value }))}
              disabled={dataLoading}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{currency.code}</span>
                      <span className="text-muted-foreground">{currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={handleSearch}
            disabled={!isFormValid || isLoading || dataLoading}
            size="lg"
            className="w-full md:w-auto px-8 py-6 text-lg"
          >
            <Search className="mr-2 h-5 w-5" />
            {isLoading ? 'Checking...' : 'Check Transfer'}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Find the best way to send money between payment service providers</p>
        </div>
      </CardContent>
    </Card>
  );
};