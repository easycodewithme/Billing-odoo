import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Zap } from 'lucide-react';
import { getShopPlans, getShopProducts, submitSubscriptionRequest } from '@/api/shop.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const PERIOD_LABELS = {
  daily: '/day',
  weekly: '/week',
  monthly: '/month',
  yearly: '/year',
};

export default function ShopPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, productsRes] = await Promise.all([
        getShopPlans(),
        getShopProducts({ limit: 50 }),
      ]);
      setPlans(plansRes.data.data || plansRes.data || []);
      setProducts(productsRes.data.data || []);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setSelectedProducts([]);
    setDialogOpen(true);
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const productItems = selectedProducts.map(pid => ({
        productId: pid,
        quantity: 1,
      }));

      const res = await submitSubscriptionRequest({
        planId: selectedPlan.id,
        products: productItems.length > 0 ? productItems : undefined,
      });

      toast.success('Subscription created successfully!');
      setDialogOpen(false);
      navigate('/subscriptions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-2 text-lg">Select a subscription plan that fits your needs</p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const isPopular = i === 1 || plan.name.toLowerCase().includes('pro');
            return (
              <Card key={plan.id} className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${Number(plan.price).toFixed(2)}</span>
                    <span className="text-muted-foreground">{PERIOD_LABELS[plan.billingPeriod] || '/month'}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2 mb-6 flex-1">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-green-500 shrink-0" />
                      <span>Min {plan.minQuantity} unit(s)</span>
                    </li>
                    {plan.renewable && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="size-4 text-green-500 shrink-0" />
                        <span>Auto-renewable</span>
                      </li>
                    )}
                    {plan.pausable && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="size-4 text-green-500 shrink-0" />
                        <span>Pausable anytime</span>
                      </li>
                    )}
                    {plan.closable && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="size-4 text-green-500 shrink-0" />
                        <span>Cancel anytime</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-green-500 shrink-0" />
                      <span>Billed {plan.billingPeriod}</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSelectPlan(plan)}
                  >
                    <Zap className="size-4 mr-1" />
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Subscribe Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subscribe to {selectedPlan?.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-medium">${Number(selectedPlan?.price || 0).toFixed(2)} {PERIOD_LABELS[selectedPlan?.billingPeriod]}</p>
                <p className="text-sm text-muted-foreground">Billed {selectedPlan?.billingPeriod}</p>
              </div>

              {products.length > 0 && (
                <div>
                  <Label className="mb-2 block">Add products to your subscription (optional):</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border p-3">
                    {products.map((p) => (
                      <label key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded p-1.5">
                        <Checkbox
                          checked={selectedProducts.includes(p.id)}
                          onCheckedChange={() => toggleProduct(p.id)}
                        />
                        <span className="flex-1 text-sm">{p.name}</span>
                        <span className="text-sm font-medium">${Number(p.salesPrice).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubscribe} disabled={subscribing}>
                {subscribing ? 'Subscribing...' : 'Confirm Subscription'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
