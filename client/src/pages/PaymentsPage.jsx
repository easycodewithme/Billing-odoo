import PageHeader from '@/components/shared/PageHeader';
import PaymentList from '@/components/payments/PaymentList';

export default function PaymentsPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Payments" description="View payment transactions" />
      <PaymentList />
    </div>
  );
}
