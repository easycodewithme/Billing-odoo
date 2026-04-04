import PageHeader from '@/components/shared/PageHeader';
import InvoiceList from '@/components/invoices/InvoiceList';

export default function InvoicesPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Invoices" description="View and manage invoices" />
      <InvoiceList />
    </div>
  );
}
