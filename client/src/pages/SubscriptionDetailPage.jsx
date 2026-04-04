import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getSubscription } from '@/api/subscriptions.api';
import { getInvoices, generateInvoice } from '@/api/invoices.api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import SubscriptionDetail from '@/components/subscriptions/SubscriptionDetail';
import OrderLineTable from '@/components/subscriptions/OrderLineTable';
import StatusTimeline from '@/components/subscriptions/StatusTimeline';
import { SUBSCRIPTION_STATUS } from '@/lib/constants';

export default function SubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubscription(id);
      setSubscription(res.data.data || res.data);
    } catch {
      toast.error('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const res = await getInvoices({ subscriptionId: id, limit: 50 });
      setInvoices(res.data.data || []);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubscription();
    fetchInvoices();
  }, [fetchSubscription, fetchInvoices]);

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    try {
      await generateInvoice(id);
      toast.success('Invoice generated successfully');
      fetchInvoices();
    } catch {
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  if (!subscription) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Subscription not found.
      </div>
    );
  }

  const isEditable =
    subscription.status === SUBSCRIPTION_STATUS.DRAFT ||
    subscription.status === 'quotation';

  const invoiceColumns = [
    { key: 'invoiceNo', label: 'Invoice No' },
    {
      key: 'issueDate',
      label: 'Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'netAmount',
      label: 'Amount',
      render: (val) => `$${Number(val || 0).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  const invoiceActions = (row) => [
    {
      label: 'View',
      icon: FileText,
      onClick: () => navigate(`/invoices/${row.id}`),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <button
        onClick={() => navigate('/subscriptions')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="size-4" /> Back to Subscriptions
      </button>
      <PageHeader
        title={`Subscription ${subscription.subscriptionNo || ''}`}
        description={subscription.customer?.fullName || ''}
      >
        <Button variant="outline" onClick={() => navigate('/subscriptions')}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </PageHeader>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="orderlines">Order Lines</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="history">Status History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <SubscriptionDetail
            subscription={subscription}
            onRefresh={fetchSubscription}
          />
        </TabsContent>

        <TabsContent value="orderlines" className="mt-6">
          <OrderLineTable
            subscriptionId={subscription.id}
            orderLines={subscription.orderLines || []}
            editable={isEditable}
            readOnly={!['draft', 'quotation'].includes(subscription.status)}
            onRefresh={fetchSubscription}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleGenerateInvoice} disabled={generating}>
              <FileText className="size-4" />
              {generating ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </div>
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            loading={invoicesLoading}
            actions={invoiceActions}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <StatusTimeline logs={subscription.statusLogs || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
