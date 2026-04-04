import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createPlan, updatePlan } from '@/api/plans.api';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialForm = {
  name: '',
  price: '',
  billingPeriod: 'monthly',
  minQuantity: 1,
  startDate: '',
  endDate: '',
  autoClose: false,
  closable: false,
  pausable: false,
  renewable: false,
};

export default function PlanForm({ open, onOpenChange, plan, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!plan;

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name || '',
        price: plan.price ?? '',
        billingPeriod: plan.billingPeriod || 'monthly',
        minQuantity: plan.minQuantity ?? 1,
        startDate: plan.startDate ? plan.startDate.slice(0, 10) : '',
        endDate: plan.endDate ? plan.endDate.slice(0, 10) : '',
        autoClose: plan.autoClose ?? false,
        closable: plan.closable ?? false,
        pausable: plan.pausable ?? false,
        renewable: plan.renewable ?? false,
      });
    } else {
      setForm(initialForm);
    }
  }, [plan, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        minQuantity: Number(form.minQuantity),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (isEdit) {
        await updatePlan(plan._id, payload);
        toast.success('Plan updated successfully');
      } else {
        await createPlan(payload);
        toast.success('Plan created successfully');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update plan' : 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the plan details below.' : 'Fill in the details to create a new plan.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Name</Label>
            <Input
              id="planName"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Plan name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planPrice">Price</Label>
              <Input
                id="planPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingPeriod">Billing Period</Label>
              <Select value={form.billingPeriod} onValueChange={(val) => handleChange('billingPeriod', val)}>
                <SelectTrigger className="w-full" id="billingPeriod">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minQuantity">Min Quantity</Label>
            <Input
              id="minQuantity"
              type="number"
              min="1"
              value={form.minQuantity}
              onChange={(e) => handleChange('minQuantity', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoClose">Auto Close</Label>
              <Switch
                id="autoClose"
                checked={form.autoClose}
                onCheckedChange={(val) => handleChange('autoClose', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="closable">Closable</Label>
              <Switch
                id="closable"
                checked={form.closable}
                onCheckedChange={(val) => handleChange('closable', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pausable">Pausable</Label>
              <Switch
                id="pausable"
                checked={form.pausable}
                onCheckedChange={(val) => handleChange('pausable', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="renewable">Renewable</Label>
              <Switch
                id="renewable"
                checked={form.renewable}
                onCheckedChange={(val) => handleChange('renewable', val)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
