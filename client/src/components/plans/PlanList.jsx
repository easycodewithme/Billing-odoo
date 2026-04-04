import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Pause, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getPlans, deletePlan } from '@/api/plans.api';
import { BILLING_PERIOD_LABELS } from '@/lib/constants';
import DataTable from '@/components/shared/DataTable';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PlanList({ onEdit, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [billingFilter, setBillingFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search };
      if (billingFilter) params.billingPeriod = billingFilter;
      const res = await getPlans(params);
      setData(res.data.data);
      setPagination((prev) => ({ ...prev, total: res.data.total }));
    } catch {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, billingFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlan(deleteTarget._id);
      toast.success('Plan deleted successfully');
      fetchData();
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'price', label: 'Price', render: (val) => `$${Number(val).toFixed(2)}` },
    {
      key: 'billingPeriod',
      label: 'Billing Period',
      render: (val) => <Badge variant="secondary">{BILLING_PERIOD_LABELS[val] || val}</Badge>,
    },
    { key: 'minQuantity', label: 'Min Qty', render: (val) => val ?? 1 },
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
      key: 'flags',
      label: 'Flags',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.pausable && <Pause className="size-4 text-yellow-600" title="Pausable" />}
          {row.closable && <X className="size-4 text-red-600" title="Closable" />}
          {row.renewable && <RefreshCw className="size-4 text-green-600" title="Renewable" />}
        </div>
      ),
    },
  ];

  const actions = (row) => [
    { label: 'Edit', icon: Pencil, onClick: () => onEdit?.(row) },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteTarget(row) },
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Select value={billingFilter} onValueChange={(val) => { setBillingFilter(val); setPagination((prev) => ({ ...prev, page: 1 })); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Periods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Periods</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onSearch={setSearch}
        searchPlaceholder="Search plans..."
        actions={actions}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Plan"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
