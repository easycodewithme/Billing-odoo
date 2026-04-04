import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createTax, updateTax } from '@/api/taxes.api';
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

const initialForm = {
  name: '',
  rate: '',
  type: '',
  description: '',
};

export default function TaxForm({ open, onOpenChange, tax, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!tax;

  useEffect(() => {
    if (tax) {
      setForm({
        name: tax.name || '',
        rate: tax.rate ?? '',
        type: tax.type || '',
        description: tax.description || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [tax, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        rate: Number(form.rate),
      };
      if (isEdit) {
        await updateTax(tax._id, payload);
        toast.success('Tax updated successfully');
      } else {
        await createTax(payload);
        toast.success('Tax created successfully');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update tax' : 'Failed to create tax');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tax' : 'Add Tax'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the tax details below.' : 'Fill in the details to create a new tax.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxName">Name</Label>
            <Input
              id="taxName"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Tax name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(e) => handleChange('rate', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxType">Type</Label>
              <Input
                id="taxType"
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder="e.g. VAT, GST"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxDescription">Description</Label>
            <Textarea
              id="taxDescription"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Tax description"
              rows={3}
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
