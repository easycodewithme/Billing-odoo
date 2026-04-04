import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getInvoice } from '@/api/invoices.api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageHeader from '@/components/shared/PageHeader';
import InvoiceDetail from '@/components/invoices/InvoiceDetail';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoice(id);
      setInvoice(res.data.data || res.data);
    } catch {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Invoice not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNo || ''}`}
        description={invoice.customerId?.name || ''}
      >
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </PageHeader>

      <InvoiceDetail invoice={invoice} onRefresh={fetchInvoice} />
    </div>
  );
}
