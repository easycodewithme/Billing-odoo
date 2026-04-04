import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createSubscription, applyTemplate } from '@/api/subscriptions.api';
import { getUsers } from '@/api/users.api';
import { getPlans } from '@/api/plans.api';
import { getTemplates } from '@/api/quotations.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ROLES } from '@/lib/constants';

const initialForm = {
  customerId: '',
  planId: '',
  templateId: '',
  startDate: '',
  expirationDate: '',
  paymentTerms: '',
  notes: '',
};

export default function SubscriptionForm({ open, onOpenChange, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setSelectedTemplate(null);
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      const [customersRes, plansRes, templatesRes] = await Promise.all([
        getUsers({ role: ROLES.PORTAL, limit: 100 }),
        getPlans({ limit: 100 }),
        getTemplates({ limit: 100 }),
      ]);
      setCustomers(customersRes.data.data || []);
      setPlans(plansRes.data.data || []);
      setTemplates(templatesRes.data.data || []);
    } catch {
      toast.error('Failed to load form options');
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'templateId') {
      const tmpl = templates.find((t) => t.id === value);
      setSelectedTemplate(tmpl || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (form.startDate && form.expirationDate && new Date(form.expirationDate) <= new Date(form.startDate)) {
      toast.error('Expiration date must be after start date');
      setSubmitting(false);
      return;
    }
    try {
      const payload = {
        customerId: form.customerId,
        planId: form.planId,
        startDate: form.startDate,
        expirationDate: form.expirationDate || undefined,
        paymentTerms: form.paymentTerms || undefined,
        notes: form.notes || undefined,
      };
      const res = await createSubscription(payload);
      const subscriptionId = res.data.data?.id || res.data.id;

      if (form.templateId && subscriptionId) {
        await applyTemplate(subscriptionId, { templateId: form.templateId });
      }

      toast.success('Subscription created successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Subscription</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new subscription.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <Select
              value={form.customerId}
              onValueChange={(val) => handleChange('customerId', val)}
            >
              <SelectTrigger className="w-full" id="customerId">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planId">Plan</Label>
            <Select
              value={form.planId}
              onValueChange={(val) => handleChange('planId', val)}
            >
              <SelectTrigger className="w-full" id="planId">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateId">Quotation Template (Optional)</Label>
            <Select
              value={form.templateId}
              onValueChange={(val) => handleChange('templateId', val)}
            >
              <SelectTrigger className="w-full" id="templateId">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 text-sm">
                <p className="font-medium">{selectedTemplate.name}</p>
                {selectedTemplate.description && (
                  <p className="text-muted-foreground mt-1">
                    {selectedTemplate.description}
                  </p>
                )}
                {selectedTemplate.lines?.length > 0 && (
                  <p className="text-muted-foreground mt-1">
                    {selectedTemplate.lines.length} order line(s) will be applied
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={form.expirationDate}
                onChange={(e) => handleChange('expirationDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input
              id="paymentTerms"
              value={form.paymentTerms}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
              placeholder="e.g. Net 30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
