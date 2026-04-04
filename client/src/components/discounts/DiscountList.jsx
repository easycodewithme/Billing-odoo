import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDiscounts, deleteDiscount } from '@/api/discounts.api';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';

export default function DiscountList({ onEdit, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDiscounts({ page: pagination.page, limit: pagination.limit, search });
      setData(res.data.data);
      setPagination((prev) => ({ ...prev, total: res.data.total }));
    } catch {
      toast.error('Failed to fetch discounts');
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
      await deleteDiscount(deleteTarget._id);
      toast.success('Discount deleted successfully');
      fetchData();
    } catch {
      toast.error('Failed to delete discount');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <Badge variant="outline">
          {val === 'percentage' ? '%' : 'Fixed'}
        </Badge>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (val, row) =>
        row.type === 'percentage' ? `${Number(val).toFixed(2)}%` : `$${Number(val).toFixed(2)}`,
    },
    {
      key: 'minPurchase',
      label: 'Min Purchase',
      render: (val) => (val ? `$${Number(val).toFixed(2)}` : '-'),
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (_, row) => {
        const current = row.currentUsage ?? 0;
        const limit = row.limitUsage;
        return limit ? `${current}/${limit}` : `${current}`;
      },
    },
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
        searchPlaceholder="Search discounts..."
        actions={actions}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Discount"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
