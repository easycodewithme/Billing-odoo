import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
import { getDiscount, attachProduct, detachProduct, attachSubscription, detachSubscription } from '@/api/discounts.api';
import { getProducts } from '@/api/products.api';
import { getSubscriptions } from '@/api/subscriptions.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function DiscountScopeManager({ discountId }) {
  const [discount, setDiscount] = useState(null);
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDiscount = useCallback(async () => {
    try {
      const res = await getDiscount(discountId);
      setDiscount(res.data.data || res.data);
    } catch {
      toast.error('Failed to load discount details');
    }
  }, [discountId]);

  const fetchOptions = useCallback(async () => {
    try {
      const prodRes = await getProducts({ limit: 100 });
      setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error('Failed to load products for discount scope:', err);
    }
    try {
      const subRes = await getSubscriptions({ limit: 100 });
      setSubscriptions(subRes.data.data || []);
    } catch (err) {
      console.error('Failed to load subscriptions for discount scope:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDiscount(), fetchOptions()]).finally(() => setLoading(false));
  }, [fetchDiscount, fetchOptions]);

  const attachedProductIds = (discount?.discountProducts || []).map((dp) => dp.productId);
  const attachedSubscriptionIds = (discount?.discountSubscriptions || []).map((ds) => ds.subscriptionId);

  const availableProducts = products.filter((p) => !attachedProductIds.includes(p.id));
  const availableSubscriptions = subscriptions.filter((s) => !attachedSubscriptionIds.includes(s.id));

  const handleAttachProduct = async () => {
    if (!selectedProduct) return;
    try {
      await attachProduct(discountId, { productId: selectedProduct });
      toast.success('Product linked');
      setSelectedProduct('');
      fetchDiscount();
    } catch {
      toast.error('Failed to link product');
    }
  };

  const handleDetachProduct = async (productId) => {
    try {
      await detachProduct(discountId, productId);
      toast.success('Product unlinked');
      fetchDiscount();
    } catch {
      toast.error('Failed to unlink product');
    }
  };

  const handleAttachSubscription = async () => {
    if (!selectedSubscription) return;
    try {
      await attachSubscription(discountId, { subscriptionId: selectedSubscription });
      toast.success('Subscription linked');
      setSelectedSubscription('');
      fetchDiscount();
    } catch {
      toast.error('Failed to link subscription');
    }
  };

  const handleDetachSubscription = async (subscriptionId) => {
    try {
      await detachSubscription(discountId, subscriptionId);
      toast.success('Subscription unlinked');
      fetchDiscount();
    } catch {
      toast.error('Failed to unlink subscription');
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Products Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Applies to Products</Label>
        <div className="flex gap-2">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a product..." />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
              {availableProducts.length === 0 && (
                <SelectItem value="_none" disabled>No products available</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAttachProduct} disabled={!selectedProduct}>
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(discount?.discountProducts || []).map((dp) => (
            <Badge key={dp.productId} variant="secondary" className="gap-1 pr-1">
              {dp.product?.name || dp.productId}
              <button
                onClick={() => handleDetachProduct(dp.productId)}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {(discount?.discountProducts || []).length === 0 && (
            <p className="text-xs text-muted-foreground">No products linked (applies globally)</p>
          )}
        </div>
      </div>

      {/* Subscriptions Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Applies to Subscriptions</Label>
        <div className="flex gap-2">
          <Select value={selectedSubscription} onValueChange={setSelectedSubscription}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a subscription..." />
            </SelectTrigger>
            <SelectContent>
              {availableSubscriptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.subscriptionNo} {s.customer?.fullName ? `- ${s.customer.fullName}` : ''}
                </SelectItem>
              ))}
              {availableSubscriptions.length === 0 && (
                <SelectItem value="_none" disabled>No subscriptions available</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAttachSubscription} disabled={!selectedSubscription}>
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(discount?.discountSubscriptions || []).map((ds) => (
            <Badge key={ds.subscriptionId} variant="secondary" className="gap-1 pr-1">
              {ds.subscription?.subscriptionNo || ds.subscriptionId}
              <button
                onClick={() => handleDetachSubscription(ds.subscriptionId)}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {(discount?.discountSubscriptions || []).length === 0 && (
            <p className="text-xs text-muted-foreground">No subscriptions linked (applies globally)</p>
          )}
        </div>
      </div>
    </div>
  );
}
