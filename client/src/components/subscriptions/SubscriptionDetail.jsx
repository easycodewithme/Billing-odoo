import { useState } from 'react';
import { toast } from 'sonner';
import { updateSubscriptionStatus, renewSubscription } from '@/api/subscriptions.api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/shared/StatusBadge';
import { SUBSCRIPTION_STATUS } from '@/lib/constants';
import {
  Send,
  CheckCircle,
  Play,
  Pause,
  XCircle,
  RotateCcw,
} from 'lucide-react';

const STATUS_TRANSITIONS = {
  [SUBSCRIPTION_STATUS.DRAFT]: [
    { target: 'quotation', label: 'Send Quotation', icon: Send, variant: 'default' },
  ],
  quotation: [
    { target: 'confirmed', label: 'Confirm', icon: CheckCircle, variant: 'default' },
  ],
  [SUBSCRIPTION_STATUS.CONFIRMED]: [
    { target: 'active', label: 'Activate', icon: Play, variant: 'default' },
  ],
  [SUBSCRIPTION_STATUS.ACTIVE]: [
    { target: 'paused', label: 'Pause', icon: Pause, variant: 'secondary', requirePausable: true },
    { target: 'closed', label: 'Close', icon: XCircle, variant: 'destructive', requireClosable: true },
  ],
  [SUBSCRIPTION_STATUS.PAUSED]: [
    { target: 'active', label: 'Resume', icon: RotateCcw, variant: 'default' },
    { target: 'closed', label: 'Close', icon: XCircle, variant: 'destructive' },
  ],
};

export default function SubscriptionDetail({ subscription, onRefresh }) {
  const [statusDialog, setStatusDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!subscription) return null;

  const plan = subscription.planId || {};
  const customer = subscription.customerId || {};

  const availableTransitions = (STATUS_TRANSITIONS[subscription.status] || []).filter(
    (t) => {
      if (t.requirePausable && !plan.pausable) return false;
      if (t.requireClosable && !plan.closable) return false;
      return true;
    }
  );

  const handleRenew = async () => {
    setSubmitting(true);
    try {
      await renewSubscription(subscription.id);
      toast.success('Subscription renewed successfully');
      onRefresh?.();
    } catch {
      toast.error('Failed to renew subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusDialog) return;
    setSubmitting(true);
    try {
      await updateSubscriptionStatus(subscription.id, {
        status: statusDialog.target,
        reason: reason || undefined,
      });
      toast.success(`Subscription ${statusDialog.label.toLowerCase()} successfully`);
      setStatusDialog(null);
      setReason('');
      onRefresh?.();
    } catch {
      toast.error('Failed to update subscription status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscription Information</CardTitle>
            <StatusBadge status={subscription.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subscription No</p>
              <p className="text-sm">{subscription.subscriptionNo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer</p>
              <p className="text-sm">{customer.fullName || '-'}</p>
              <p className="text-xs text-muted-foreground">{customer.email || ''}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan</p>
              <p className="text-sm">{plan.name || '-'}</p>
              <p className="text-xs text-muted-foreground">
                {plan.billingPeriod
                  ? `Billing: ${plan.billingPeriod.charAt(0).toUpperCase() + plan.billingPeriod.slice(1)}`
                  : ''}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p className="text-sm">
                {subscription.startDate
                  ? new Date(subscription.startDate).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
              <p className="text-sm">
                {subscription.expirationDate
                  ? new Date(subscription.expirationDate).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
              <p className="text-sm">{subscription.paymentTerms || '-'}</p>
            </div>
          </div>
          {subscription.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm mt-1">{subscription.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Actions */}
      {(availableTransitions.length > 0 || subscription.status === 'closed') && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((transition) => {
                const Icon = transition.icon;
                return (
                  <Button
                    key={transition.target}
                    variant={transition.variant}
                    onClick={() => setStatusDialog(transition)}
                  >
                    <Icon className="size-4" />
                    {transition.label}
                  </Button>
                );
              })}
              {subscription.status === 'closed' && plan.renewable !== false && (
                <Button onClick={handleRenew} disabled={submitting}>
                  <RotateCcw className="size-4" />
                  Renew
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Change Dialog */}
      <Dialog
        open={!!statusDialog}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog(null);
            setReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{statusDialog?.label}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {statusDialog?.label.toLowerCase()} this subscription?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a reason..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialog(null);
                setReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={statusDialog?.variant || 'default'}
              onClick={handleStatusChange}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : statusDialog?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
