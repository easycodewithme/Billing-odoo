import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import PlanList from '@/components/plans/PlanList';
import PlanForm from '@/components/plans/PlanForm';

export default function PlansPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditPlan(null);
    setFormOpen(true);
  };

  const handleEdit = (plan) => {
    setEditPlan(plan);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Plans" description="Manage subscription plans">
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add Plan
        </Button>
      </PageHeader>

      <PlanList onEdit={handleEdit} refreshKey={refreshKey} />

      <PlanForm
        open={formOpen}
        onOpenChange={setFormOpen}
        plan={editPlan}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
