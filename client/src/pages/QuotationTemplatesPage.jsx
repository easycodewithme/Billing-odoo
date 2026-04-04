import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import TemplateList from '@/components/quotations/TemplateList';
import TemplateForm from '@/components/quotations/TemplateForm';

export default function QuotationTemplatesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditTemplate(null);
    setFormOpen(true);
  };

  const handleEdit = (template) => {
    setEditTemplate(template);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Quotation Templates" description="Manage quotation templates">
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add Template
        </Button>
      </PageHeader>

      <TemplateList onEdit={handleEdit} refreshKey={refreshKey} />

      <TemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editTemplate}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
