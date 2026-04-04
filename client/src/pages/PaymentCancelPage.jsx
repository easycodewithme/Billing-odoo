import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get('invoice_id');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="size-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges were made.
          </p>
          <div className="flex gap-2 justify-center">
            {invoiceId && (
              <Button onClick={() => navigate(`/invoices/${invoiceId}`)}>
                Back to Invoice
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/invoices')}>
              All Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
