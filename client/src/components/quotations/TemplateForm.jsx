import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTemplate, updateTemplate } from '@/api/quotations.api';
import { getPlans } from '@/api/plans.api';
import { getProducts } from '@/api/products.api';
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

const emptyLine = { productId: '', quantity: 1, unitPrice: '' };

const initialForm = {
  name: '',
  validityDays: '',
  recurringPlanId: '',
  lines: [],
};

export default function TemplateForm({ open, onOpenChange, template, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);

  const isEdit = !!template;

  useEffect(() => {
    if (open) {
      getPlans({ limit: 100 })
        .then((res) => setPlans(res.data.data))
        .catch(() => {});
      getProducts({ limit: 100 })
        .then((res) => setProducts(res.data.data))
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name || '',
        validityDays: template.validityDays ?? '',
        recurringPlanId: template.recurringPlan?._id || template.recurringPlanId || '',
        lines: (template.lines || []).map((line) => ({
          productId: line.product?._id || line.productId || '',
          quantity: line.quantity ?? 1,
          unitPrice: line.unitPrice ?? '',
        })),
      });
    } else {
      setForm(initialForm);
    }
  }, [template, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      lines[index] = { ...lines[index], [field]: value };
      return { ...prev, lines };
    });
  };

  const addLine = () => {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, { ...emptyLine }] }));
  };

  const removeLine = (index) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        validityDays: form.validityDays ? Number(form.validityDays) : undefined,
        recurringPlanId: form.recurringPlanId || undefined,
        lines: form.lines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
        })),
      };
      if (isEdit) {
        await updateTemplate(template._id, payload);
        toast.success('Template updated successfully');
      } else {
        await createTemplate(payload);
        toast.success('Template created successfully');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update template' : 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Template' : 'Add Template'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the template details below.' : 'Fill in the details to create a new quotation template.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Template name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validityDays">Validity Days</Label>
              <Input
                id="validityDays"
                type="number"
                min="1"
                value={form.validityDays}
                onChange={(e) => handleChange('validityDays', e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurringPlanId">Recurring Plan</Label>
              <Select value={form.recurringPlanId} onValueChange={(val) => handleChange('recurringPlanId', val)}>
                <SelectTrigger className="w-full" id="recurringPlanId">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Product Lines</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="size-4" />
                Add Line
              </Button>
            </div>

            {form.lines.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                No product lines added yet.
              </p>
            )}

            {form.lines.map((line, index) => (
              <div key={index} className="flex items-end gap-2 rounded-lg border p-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <Select value={line.productId} onValueChange={(val) => handleLineChange(index, 'productId', val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeLine(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
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
