import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Check, ShoppingCart } from 'lucide-react';
import { getShopProduct, getShopPlans, submitSubscriptionRequest } from '@/api/shop.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const PERIOD_LABELS = { daily: '/day', weekly: '/week', monthly: '/month', yearly: '/year' };

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [prodRes, plansRes] = await Promise.all([
        getShopProduct(id),
        getShopPlans(),
      ]);
      setProduct(prodRes.data.data || prodRes.data);
      const planList = plansRes.data.data || plansRes.data || [];
      setPlans(Array.isArray(planList) ? planList : []);
    } catch {
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  // The subscription price is the plan price * quantity
  const planPrice = Number(selectedPlan?.price || 0);
  const totalPrice = planPrice * quantity;
  const lowestPlanPrice = plans.length > 0
    ? Math.min(...plans.map(p => Number(p.price)))
    : null;
  const lowestPlan = plans.find(p => Number(p.price) === lowestPlanPrice);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error('Please select a subscription plan');
      return;
    }
    setSubmitting(true);
    try {
      await submitSubscriptionRequest({
        planId: selectedPlan.id,
        items: [{
          productId: product.id,
          variantId: selectedVariant?.id || undefined,
          quantity,
        }],
        notes: notes || undefined,
      });
      toast.success('Subscription request submitted! Our team will review and send you a quotation.');
      navigate('/subscriptions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" />;
  if (!product) return null;

  const variantGroups = {};
  (product.variants || []).forEach((v) => {
    if (!variantGroups[v.attribute]) variantGroups[v.attribute] = [];
    variantGroups[v.attribute].push(v);
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <button onClick={() => navigate('/shop')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="size-4" /> Back to Shop
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-8xl text-muted-foreground/20">{product.name.charAt(0)}</div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            {product.productType && <Badge variant="secondary">{product.productType}</Badge>}
            <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
            {/* Show the plan-based price * quantity */}
            {selectedPlan ? (
              <div className="mt-2">
                <p className="text-3xl font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                  <span className="text-base font-normal text-muted-foreground">{PERIOD_LABELS[selectedPlan.billingPeriod]}</span>
                </p>
                {quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    ${planPrice.toFixed(2)} x {quantity} units
                  </p>
                )}
              </div>
            ) : lowestPlanPrice !== null ? (
              <p className="text-3xl font-bold text-primary mt-2">
                From ${lowestPlanPrice.toFixed(2)}
                <span className="text-base font-normal text-muted-foreground">{PERIOD_LABELS[lowestPlan?.billingPeriod]}</span>
              </p>
            ) : null}
          </div>

          {product.description && <p className="text-muted-foreground">{product.description}</p>}

          <Separator />

          {/* Variant Selection */}
          {Object.keys(variantGroups).length > 0 && (
            <div className="space-y-3">
              {Object.entries(variantGroups).map(([attr, variants]) => (
                <div key={attr}>
                  <Label className="mb-2 block">{attr}</Label>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <Button key={v.id} variant={selectedVariant?.id === v.id ? 'default' : 'outline'} size="sm"
                        onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}>
                        {v.value}
                        {selectedVariant?.id === v.id && <Check className="size-3 ml-1" />}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label className="mb-2 block">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
              <span className="w-12 text-center text-lg font-medium">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 1)}>+</Button>
            </div>
          </div>

          <Separator />

          {/* Plan Selection - this IS the pricing */}
          <div>
            <Label className="mb-2 block font-semibold">Select Subscription Plan *</Label>
            <div className="grid gap-2">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedPlan?.id === plan.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-4 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan?.id === plan.id ? 'border-primary' : 'border-muted-foreground/30'
                    }`}>
                      {selectedPlan?.id === plan.id && <div className="size-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">Billed {plan.billingPeriod}</p>
                    </div>
                  </div>
                  <p className="font-bold">${Number(plan.price).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">{PERIOD_LABELS[plan.billingPeriod]}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="mb-2 block">Additional Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requirements..." rows={2} />
          </div>

          {/* Subscribe Button */}
          <Button size="lg" className="w-full text-base h-12" onClick={handleSubscribe} disabled={submitting || !selectedPlan}>
            <ShoppingCart className="size-5 mr-2" />
            {submitting
              ? 'Submitting...'
              : selectedPlan
                ? `Subscribe - $${totalPrice.toFixed(2)}${PERIOD_LABELS[selectedPlan.billingPeriod]}`
                : 'Select a plan to subscribe'
            }
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your request will be reviewed by our team. You will receive a quotation to accept before payment.
          </p>
        </div>
      </div>
    </div>
  );
}
