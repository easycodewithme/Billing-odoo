import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { getCart, shopCheckout, shopStripeCheckout } from '@/api/shop.api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    shippingName: '',
    shippingEmail: '',
    shippingPhone: '',
    shippingAddress: '',
  });

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        shippingName: f.shippingName || user.fullName || '',
        shippingEmail: f.shippingEmail || user.email || '',
        shippingPhone: f.shippingPhone || user.phone || '',
      }));
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await getCart();
      const data = res.data.data || res.data;
      if (!data?.items?.length) {
        toast.error('Cart is empty');
        navigate('/shop/cart');
        return;
      }
      setCart(data);
    } catch {
      navigate('/shop/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleStripeCheckout = async () => {
    setSubmitting(true);
    try {
      const res = await shopStripeCheckout();
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        if (window.__refreshCartCount) window.__refreshCartCount();
        window.location.href = url;
      } else {
        toast.error('Failed to create payment session');
      }
    } catch {
      toast.error('Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCOD = async () => {
    setSubmitting(true);
    try {
      await shopCheckout({ ...form, paymentMethod: 'cash' });
      if (window.__refreshCartCount) window.__refreshCartCount();
      navigate('/shop/order-confirmed');
    } catch {
      toast.error('Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" />;
  if (!cart) return null;

  const items = cart.items || [];
  const subtotal = Number(cart.subtotal || 0);
  const discount = Number(cart.discountAmount || 0);
  const total = Number(cart.total || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Address Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader><CardTitle>Shipping Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={form.shippingName} onChange={(e) => handleChange('shippingName', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.shippingEmail} onChange={(e) => handleChange('shippingEmail', e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.shippingPhone} onChange={(e) => handleChange('shippingPhone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={form.shippingAddress} onChange={(e) => handleChange('shippingAddress', e.target.value)} placeholder="Street, City, State, ZIP" required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-[#635BFF] hover:bg-[#5851db] text-white" size="lg" onClick={handleStripeCheckout} disabled={submitting}>
                  <CreditCard className="size-5 mr-2" />
                  {submitting ? 'Processing...' : `Pay $${total.toFixed(2)} with Stripe`}
                </Button>
                <div className="text-center text-sm text-muted-foreground">or</div>
                <Button variant="outline" className="w-full" size="lg" onClick={handleCOD} disabled={submitting}>
                  Cash on Delivery
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="truncate flex-1">
                      {item.product?.name}{item.variant ? ` (${item.variant.value})` : ''} x{item.quantity}
                    </span>
                    <span className="font-medium ml-2">${Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({cart.discountCode})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
