import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import DiscountList from '@/components/discounts/DiscountList';
import DiscountForm from '@/components/discounts/DiscountForm';
import { useAuth } from '@/hooks/useAuth';

export default function DiscountsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [formOpen, setFormOpen] = useState(false);
  const [editDiscount, setEditDiscount] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditDiscount(null);
    setFormOpen(true);
  };

  const handleEdit = (discount) => {
    setEditDiscount(discount);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Discounts" description="Manage discount codes and promotions">
        {isAdmin && (
          <Button onClick={handleAdd}>
            <Plus className="size-4" />
            Add Discount
          </Button>
        )}
      </PageHeader>

      <DiscountList onEdit={handleEdit} refreshKey={refreshKey} />

      <DiscountForm
        open={formOpen}
        onOpenChange={setFormOpen}
        discount={editDiscount}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
