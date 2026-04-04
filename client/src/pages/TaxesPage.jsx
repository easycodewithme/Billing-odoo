import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import TaxList from '@/components/taxes/TaxList';
import TaxForm from '@/components/taxes/TaxForm';

export default function TaxesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTax, setEditTax] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditTax(null);
    setFormOpen(true);
  };

  const handleEdit = (tax) => {
    setEditTax(tax);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Taxes" description="Manage tax configurations">
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add Tax
        </Button>
      </PageHeader>

      <TaxList onEdit={handleEdit} refreshKey={refreshKey} />

      <TaxForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tax={editTax}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
