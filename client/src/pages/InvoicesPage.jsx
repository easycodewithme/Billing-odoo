import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import InvoiceList from '@/components/invoices/InvoiceList';

export default function InvoicesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Invoices" description="View and manage invoices">
        <Button variant="outline" size="icon" onClick={() => setRefreshKey(k => k + 1)}>
          <RefreshCw className="size-4" />
        </Button>
      </PageHeader>
      <InvoiceList refreshKey={refreshKey} />
    </div>
  );
}
