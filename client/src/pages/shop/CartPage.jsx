import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Minus, Plus, ShoppingCart, Tag } from 'lucide-react';
import { getCart, updateCartItem, removeCartItem, applyDiscountCode } from '@/api/shop.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const res = await getCart();
      setCart(res.data.data || res.data);
      if (window.__refreshCartCount) window.__refreshCartCount();
    } catch {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      const res = await updateCartItem(itemId, { quantity: newQty });
      setCart(res.data.data || res.data);
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const res = await removeCartItem(itemId);
      setCart(res.data.data || res.data);
      if (window.__refreshCartCount) window.__refreshCartCount();
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setApplyingDiscount(true);
    try {
      const res = await applyDiscountCode({ code: discountCode.trim() });
      setCart(res.data.data || res.data);
      toast.success('Discount applied');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid discount code');
    } finally {
      setApplyingDiscount(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" />;

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, i) => sum + Number(i.total || 0), 0);
  const discountAmount = Number(cart?.discountAmount || 0);
  const total = Number(cart?.total || Math.max(subtotal - discountAmount, 0));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart className="size-7" /> Cart
        </h1>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingCart className="size-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground">Your cart is empty</p>
              <Button className="mt-4" onClick={() => navigate('/shop')}>Browse Products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="size-16 bg-muted rounded flex items-center justify-center shrink-0">
                      {item.product?.image ? (
                        <img src={item.product.image.startsWith('http') ? item.product.image : `/uploads/products/${item.product.image}`} alt="" className="size-full object-cover rounded" />
                      ) : (
                        <span className="text-xl text-muted-foreground/30">{item.product?.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product?.name}</p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">{item.variant.attribute}: {item.variant.value}</p>
                      )}
                      <p className="text-sm text-muted-foreground">${Number(item.unitPrice).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="size-8" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="size-8" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <p className="font-bold w-20 text-right">${Number(item.total).toFixed(2)}</p>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleRemove(item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Discount Code */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleApplyDiscount} disabled={applyingDiscount}>
                      <Tag className="size-4" />
                    </Button>
                  </div>
                  {cart?.discountCode && (
                    <p className="text-xs text-green-600">Code "{cart.discountCode}" applied</p>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={() => navigate('/shop/checkout')}>
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
