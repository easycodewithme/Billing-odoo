import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { getMyOrder } from '@/api/shop.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await getMyOrder(id);
      setOrder(res.data.data || res.data);
    } catch {
      toast.error('Order not found');
      navigate('/shop/orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" />;
  if (!order) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <button onClick={() => navigate('/shop/orders')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="size-4" /> Back to My Orders
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order {order.orderNo}</h1>
            <p className="text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Shipping Info */}
          {order.shippingName && (
            <Card>
              <CardHeader><CardTitle>Shipping Details</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{order.shippingName}</p>
                <p className="text-muted-foreground">{order.shippingEmail}</p>
                <p className="text-muted-foreground">{order.shippingPhone}</p>
                <p className="text-muted-foreground">{order.shippingAddress}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Method: <span className="font-medium capitalize">{order.paymentMethod || '-'}</span></p>
              {order.paidAt && <p>Paid on: {new Date(order.paidAt).toLocaleDateString()}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card className="mt-6">
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(order.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.product?.name}
                      {item.variant && <span className="text-xs text-muted-foreground ml-1">({item.variant.value})</span>}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${Number(item.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="mt-4">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
                <span>-${Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
