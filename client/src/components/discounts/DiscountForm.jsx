import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createDiscount, updateDiscount } from '@/api/discounts.api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialForm = {
  name: '',
  type: 'fixed',
  value: '',
  minPurchase: '',
  minQuantity: '',
  startDate: '',
  endDate: '',
  limitUsage: '',
};

export default function DiscountForm({ open, onOpenChange, discount, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!discount;

  useEffect(() => {
    if (discount) {
      setForm({
        name: discount.name || '',
        type: discount.type || 'fixed',
        value: discount.value ?? '',
        minPurchase: discount.minPurchase ?? '',
        minQuantity: discount.minQuantity ?? '',
        startDate: discount.startDate ? discount.startDate.slice(0, 10) : '',
        endDate: discount.endDate ? discount.endDate.slice(0, 10) : '',
        limitUsage: discount.limitUsage ?? '',
      });
    } else {
      setForm(initialForm);
    }
  }, [discount, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        value: Number(form.value),
        minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
        minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        limitUsage: form.limitUsage ? Number(form.limitUsage) : undefined,
      };
      if (isEdit) {
        await updateDiscount(discount._id, payload);
        toast.success('Discount updated successfully');
      } else {
        await createDiscount(payload);
        toast.success('Discount created successfully');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update discount' : 'Failed to create discount');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Discount' : 'Add Discount'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the discount details below.' : 'Fill in the details to create a new discount.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discountName">Name</Label>
            <Input
              id="discountName"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Discount name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountType">Type</Label>
              <Select value={form.type} onValueChange={(val) => handleChange('type', val)}>
                <SelectTrigger className="w-full" id="discountType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">Value</Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => handleChange('value', e.target.value)}
                placeholder={form.type === 'percentage' ? '0%' : '0.00'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPurchase">Min Purchase</Label>
              <Input
                id="minPurchase"
                type="number"
                min="0"
                step="0.01"
                value={form.minPurchase}
                onChange={(e) => handleChange('minPurchase', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Min Quantity</Label>
              <Input
                id="minQuantity"
                type="number"
                min="0"
                value={form.minQuantity}
                onChange={(e) => handleChange('minQuantity', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountStartDate">Start Date</Label>
              <Input
                id="discountStartDate"
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountEndDate">End Date</Label>
              <Input
                id="discountEndDate"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limitUsage">Usage Limit</Label>
            <Input
              id="limitUsage"
              type="number"
              min="0"
              value={form.limitUsage}
              onChange={(e) => handleChange('limitUsage', e.target.value)}
              placeholder="Leave empty for unlimited"
            />
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
