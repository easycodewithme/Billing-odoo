import { useState } from 'react';
import { toast } from 'sonner';
import { confirmInvoice, cancelInvoice, sendInvoice, downloadInvoicePDF, revertInvoiceToDraft } from '@/api/invoices.api';
import { createCheckout } from '@/api/payments.api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import PaymentForm from '@/components/payments/PaymentForm';
import { INVOICE_STATUS, PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { CheckCircle, XCircle, CreditCard, Download, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function InvoiceDetail({ invoice, onRefresh }) {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'internal_user';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!invoice) return null;

  const customer = invoice.customer || {};
  const lines = invoice.invoiceLines || [];
  const payments = invoice.payments || [];

  const subtotal = lines.reduce(
    (sum, l) => sum + (l.quantity || 0) * (l.unitPrice || 0),
    0
  );
  const taxTotal = lines.reduce((sum, l) => {
    const amount = (l.quantity || 0) * (l.unitPrice || 0);
    const taxRate = l.tax?.rate || 0;
    return sum + amount * (taxRate / 100);
  }, 0);
  const discountTotal = lines.reduce(
    (sum, l) => sum + Number(l.discountAmount || 0),
    0
  );
  const netTotal = Number(invoice.netAmount || subtotal + taxTotal - discountTotal);
  const paidAmount = Number(invoice.paidAmount || 0);
  const outstandingAmount = netTotal - paidAmount;

  const canConfirm = invoice.status === INVOICE_STATUS.DRAFT;
  const canCancel =
    (invoice.status === INVOICE_STATUS.DRAFT ||
      invoice.status === INVOICE_STATUS.CONFIRMED) &&
    paidAmount === 0;
  const canRecordPayment =
    invoice.status === INVOICE_STATUS.CONFIRMED && outstandingAmount > 0;

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await confirmInvoice(invoice.id);
      toast.success('Invoice confirmed');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm invoice');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      await cancelInvoice(invoice.id);
      toast.success('Invoice cancelled');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invoice');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    setProcessing(true);
    try {
      const response = await downloadInvoicePDF(invoice.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNo}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendInvoice = async () => {
    setProcessing(true);
    try {
      await sendInvoice(invoice.id);
      toast.success('Invoice sent to customer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invoice');
    } finally {
      setProcessing(false);
    }
  };

  const handleRevertDraft = async () => {
    setProcessing(true);
    try {
      await revertInvoiceToDraft(invoice.id);
      toast.success('Invoice reverted to draft');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revert invoice');
    } finally {
      setProcessing(false);
    }
  };

  const handleStripeCheckout = async () => {
    setProcessing(true);
    try {
      const response = await createCheckout(invoice.id);
      const { url } = response.data?.data || response.data || {};
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Could not create checkout session');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create Stripe checkout');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice {invoice.invoiceNo}</CardTitle>
            <StatusBadge status={invoice.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
              <p className="text-sm">
                {invoice.issuedAt
                  ? new Date(invoice.issuedAt).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Due Date</p>
              <p className="text-sm">
                {invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{customer.fullName || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{customer.email || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No line items.
                  </TableCell>
                </TableRow>
              )}
              {lines.map((line, idx) => {
                const lineAmount =
                  (line.quantity || 0) * (line.unitPrice || 0);
                return (
                  <TableRow key={line.id || idx}>
                    <TableCell>{line.product?.name || '-'}</TableCell>
                    <TableCell>{line.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      {line.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(line.unitPrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.tax?.rate
                        ? `${line.tax?.rate}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(line.discountAmount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${lineAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>${taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span>-${discountTotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Net Total</span>
              <span>${netTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid</span>
              <span className="text-green-600">${paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Outstanding</span>
              <span className={outstandingAmount > 0 ? 'text-red-600' : ''}>
                ${outstandingAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {isStaff && canConfirm && (
              <Button onClick={() => setConfirmOpen(true)} disabled={processing}>
                <CheckCircle className="size-4" />
                Confirm
              </Button>
            )}
            {canRecordPayment && isStaff && (
              <Button
                variant="secondary"
                onClick={() => setPaymentOpen(true)}
              >
                <CreditCard className="size-4" />
                Record Payment
              </Button>
            )}
            {canRecordPayment && (
              <Button
                onClick={handleStripeCheckout}
                disabled={processing}
                className="bg-[#635BFF] hover:bg-[#5851db] text-white"
              >
                <CreditCard className="size-4" />
                Pay with Stripe
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={processing}
            >
              <Download className="size-4" />
              Download PDF
            </Button>
            {isStaff && invoice.status !== 'draft' && invoice.status !== 'cancelled' && (
              <Button
                variant="outline"
                onClick={handleSendInvoice}
                disabled={processing}
              >
                <Send className="size-4" />
                Send Email
              </Button>
            )}
            {isStaff && canCancel && (
              <Button
                variant="destructive"
                onClick={() => setCancelOpen(true)}
                disabled={processing}
              >
                <XCircle className="size-4" />
                Cancel
              </Button>
            )}
            {isStaff && invoice.status === 'cancelled' && (
              <Button variant="outline" onClick={handleRevertDraft} disabled={processing}>
                Revert to Draft
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABELS[p.method] || p.method || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(p.amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{p.reference || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Invoice"
        description="Are you sure you want to confirm this invoice? This will make it available for payment."
        onConfirm={handleConfirm}
        confirmText="Confirm"
        variant="default"
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Invoice"
        description="Are you sure you want to cancel this invoice? This action cannot be undone."
        onConfirm={handleCancel}
      />

      {/* Payment Form Dialog */}
      <PaymentForm
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoiceId={invoice.id}
        outstandingAmount={outstandingAmount}
        onSuccess={onRefresh}
      />
    </div>
  );
}
