import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/shared/PageHeader';
import SubscriptionList from '@/components/subscriptions/SubscriptionList';
import SubscriptionForm from '@/components/subscriptions/SubscriptionForm';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'internal_user';
  const [formOpen, setFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Subscriptions"
        description={isStaff ? 'Manage customer subscriptions' : 'Your subscriptions'}
      >
        {isStaff && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            New Subscription
          </Button>
        )}
      </PageHeader>

      <SubscriptionList refreshKey={refreshKey} />

      {isStaff && (
        <SubscriptionForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
