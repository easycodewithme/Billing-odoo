import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { getSubscriptions } from '@/api/subscriptions.api';
import { useAuth } from '@/hooks/useAuth';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUBSCRIPTION_STATUS } from '@/lib/constants';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: SUBSCRIPTION_STATUS.DRAFT, label: 'Draft' },
  { value: SUBSCRIPTION_STATUS.ACTIVE, label: 'Active' },
  { value: SUBSCRIPTION_STATUS.PAUSED, label: 'Paused' },
  { value: SUBSCRIPTION_STATUS.CLOSED, label: 'Closed' },
];

export default function SubscriptionList({ refreshKey }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await getSubscriptions(params);
      setData(res.data.data);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch {
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const columns = [
    { key: 'subscriptionNo', label: 'Sub No' },
    {
      key: 'customer',
      label: 'Customer Name',
      render: (val) => val?.fullName || '-',
    },
    {
      key: 'plan',
      label: 'Plan Name',
      render: (val) => val?.name || '-',
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '-',
    },
    {
      key: 'expirationDate',
      label: 'Expiry Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'internal_user';

  const actions = (row) => {
    const items = [
      {
        label: 'View',
        icon: Eye,
        onClick: () => navigate(`/subscriptions/${row.id}`),
      },
    ];
    // Only staff can edit, and only in draft/quotation status
    if (isStaff && (row.status === SUBSCRIPTION_STATUS.DRAFT || row.status === 'quotation')) {
      items.push({
        label: 'Edit',
        icon: Pencil,
        onClick: () => navigate(`/subscriptions/${row.id}`),
      });
    }
    return items;
  };

  return (
    <div className="space-y-4">
      <Tabs value={statusFilter} onValueChange={handleStatusChange}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onSearch={setSearch}
        searchPlaceholder="Search by subscription number or customer..."
        actions={actions}
      />
    </div>
  );
}
