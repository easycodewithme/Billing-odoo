import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getTaxes, deleteTax } from '@/api/taxes.api';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function TaxList({ onEdit, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTaxes({ page: pagination.page, limit: pagination.limit, search });
      setData(res.data.data);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch {
      toast.error('Failed to fetch taxes');
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
      await deleteTax(deleteTarget.id);
      toast.success('Tax deleted successfully');
      fetchData();
    } catch {
      toast.error('Failed to delete tax');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'rate', label: 'Rate (%)', render: (val) => `${Number(val).toFixed(2)}%` },
    { key: 'type', label: 'Type', render: (val) => val || '-' },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => <StatusBadge status={val !== false ? 'active' : 'inactive'} />,
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
        searchPlaceholder="Search taxes..."
        actions={actions}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Tax"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
