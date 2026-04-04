import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createManualPayment } from '@/api/payments.api';
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

const initialForm = {
  method: 'cash',
  amount: '',
  reference: '',
  notes: '',
};

export default function PaymentForm({
  open,
  onOpenChange,
  invoiceId,
  outstandingAmount = 0,
  onSuccess,
}) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...initialForm, amount: outstandingAmount > 0 ? outstandingAmount : '' });
    }
  }, [open, outstandingAmount]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }
    if (amount > outstandingAmount) {
      toast.error(`Amount cannot exceed outstanding amount ($${outstandingAmount.toFixed(2)})`);
      return;
    }

    setSubmitting(true);
    try {
      await createManualPayment({
        invoiceId,
        method: form.method,
        amount,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Payment recorded successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Outstanding balance: ${Number(outstandingAmount).toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pay-method">Payment Method</Label>
            <Select
              value={form.method}
              onValueChange={(val) => handleChange('method', val)}
            >
              <SelectTrigger className="w-full" id="pay-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              type="number"
              min="0.01"
              step="0.01"
              max={outstandingAmount}
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-reference">Reference</Label>
            <Input
              id="pay-reference"
              value={form.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              placeholder="e.g. Bank transfer ref"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notes</Label>
            <Textarea
              id="pay-notes"
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
              {submitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
