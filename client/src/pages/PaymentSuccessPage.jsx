import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get('invoice_id');

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      if (invoiceId) {
        navigate(`/invoices/${invoiceId}`);
      } else {
        navigate('/payments');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [invoiceId, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment has been processed successfully. You will be redirected shortly.
          </p>
          <div className="flex gap-2 justify-center">
            {invoiceId && (
              <Button onClick={() => navigate(`/invoices/${invoiceId}`)}>
                View Invoice
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/payments')}>
              All Payments
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
