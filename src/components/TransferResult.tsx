import { CheckCircle, XCircle, AlertCircle, ExternalLink, Clock, CreditCard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransferResult as TransferResultType } from '@/types/database';
import { useTransferData } from '@/hooks/useTransferData';

interface TransferResultProps {
  result: TransferResultType;
  onNewSearch: () => void;
}

export const TransferResult = ({ result, onNewSearch }: TransferResultProps) => {
  const { trackAffiliateClick } = useTransferData();

  const getStatusIcon = () => {
    switch (result.status) {
      case 'yes':
        return <CheckCircle className="h-12 w-12 text-success" />;
      case 'no':
        return <XCircle className="h-12 w-12 text-destructive" />;
      case 'maybe':
        return <AlertCircle className="h-12 w-12 text-warning" />;
    }
  };

  const getStatusText = () => {
    switch (result.status) {
      case 'yes':
        return 'Yes, transfer possible!';
      case 'no':
        return 'No, transfer not supported';
      case 'maybe':
        return 'Maybe, limited information';
    }
  };

  const getStatusBadge = () => {
    switch (result.status) {
      case 'yes':
        return <Badge className="bg-success text-success-foreground">Supported</Badge>;
      case 'no':
        return <Badge variant="destructive">Not Supported</Badge>;
      case 'maybe':
        return <Badge className="bg-warning text-warning-foreground">Uncertain</Badge>;
    }
  };

  const handleAffiliateClick = async () => {
    await trackAffiliateClick(result.id);
    if (result.affiliateUrl) {
      window.open(result.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Status Card */}
      <Card className="border-2" style={{ borderColor: result.statusColor }}>
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center gap-4">
            {getStatusIcon()}
            <div>
              <h2 className="text-3xl font-bold">{getStatusText()}</h2>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-semibold">{result.from_psp?.display_name}</p>
                </div>
                <div className="text-2xl">→</div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-semibold">{result.to_psp?.display_name}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-semibold">{result.currency?.code}</p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details Card */}
      {result.status !== 'no' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Transfer Details</h3>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.estimated_fee_percentage && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Fee</p>
                    <p className="font-semibold">~{result.estimated_fee_percentage}%</p>
                  </div>
                </div>
              )}

              {result.estimated_time_hours && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Transfer Time</p>
                    <p className="font-semibold">
                      ~{result.estimated_time_hours} hour{result.estimated_time_hours !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}

              {result.kyc_required !== undefined && (
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">KYC Required</p>
                    <p className="font-semibold">{result.kyc_required ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </div>

            {result.confidence_level && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence Level</span>
                  <span className="font-medium">{result.confidence_level}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${result.confidence_level}%` }}
                  />
                </div>
              </div>
            )}

            {result.notes && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{result.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={onNewSearch} variant="outline" className="flex-1">
          Check Another Transfer
        </Button>
        
        {result.status === 'yes' && result.affiliateUrl && (
          <Button onClick={handleAffiliateClick} className="flex-1">
            <ExternalLink className="mr-2 h-4 w-4" />
            Get Started with {result.to_psp?.display_name}
          </Button>
        )}
      </div>

      {/* Affiliate Disclaimer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          We may earn a commission if you use our referral links. 
          This helps us keep the service free.
        </p>
      </div>
    </div>
  );
};