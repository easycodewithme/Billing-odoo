import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderConfirmedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Thank you for your order!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Your payment has been processed. You can view your orders from your account.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/shop/orders')}>View My Orders</Button>
            <Button variant="outline" onClick={() => navigate('/shop')}>Continue Shopping</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
