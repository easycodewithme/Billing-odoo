import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getTemplates, deleteTemplate } from '@/api/quotations.api';
import DataTable from '@/components/shared/DataTable';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function TemplateList({ onEdit, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTemplates({ page: pagination.page, limit: pagination.limit, search });
      setData(res.data.data);
      setPagination((prev) => ({ ...prev, total: res.data.total }));
    } catch {
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate(deleteTarget._id);
      toast.success('Template deleted successfully');
      fetchData();
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const columns = [
    { key: 'name', label: 'Template Name' },
    { key: 'validityDays', label: 'Validity Days', render: (val) => val ?? '-' },
    {
      key: 'recurringPlan',
      label: 'Recurring Plan',
      render: (val) => {
        if (!val) return '-';
        if (typeof val === 'object') return val.name || '-';
        return val;
      },
    },
    {
      key: 'lines',
      label: 'Line Count',
      render: (val) => (Array.isArray(val) ? val.length : 0),
    },
  ];

  const actions = (row) => [
    { label: 'Edit', icon: Pencil, onClick: () => onEdit?.(row) },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteTarget(row) },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onSearch={setSearch}
        searchPlaceholder="Search templates..."
        actions={actions}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Template"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
