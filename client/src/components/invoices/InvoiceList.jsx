import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { getInvoices } from '@/api/invoices.api';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INVOICE_STATUS } from '@/lib/constants';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: INVOICE_STATUS.DRAFT, label: 'Draft' },
  { value: INVOICE_STATUS.CONFIRMED, label: 'Confirmed' },
  { value: INVOICE_STATUS.PAID, label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export default function InvoiceList({ refreshKey }) {
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
      if (statusFilter === 'overdue') {
        params.status = INVOICE_STATUS.CONFIRMED;
        params.overdue = true;
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await getInvoices(params);
      setData(res.data.data || []);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch {
      toast.error('Failed to fetch invoices');
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

  const getDisplayStatus = (row) => {
    if (
      row.status === INVOICE_STATUS.CONFIRMED &&
      row.dueDate &&
      new Date(row.dueDate) < new Date()
    ) {
      return 'overdue';
    }
    return row.status;
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No' },
    {
      key: 'customer',
      label: 'Customer',
      render: (val, row) => row.customer?.fullName || val?.fullName || '-',
    },
    {
      key: 'subscription',
      label: 'Subscription No',
      render: (val, row) => row.subscription?.subscriptionNo || val?.subscriptionNo || '-',
    },
    {
      key: 'issueDate',
      label: 'Issue Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'netAmount',
      label: 'Net Amount',
      render: (val) => `$${Number(val || 0).toFixed(2)}`,
    },
    {
      key: 'paidAmount',
      label: 'Paid',
      render: (val) => `$${Number(val || 0).toFixed(2)}`,
    },
    {
      key: 'outstandingAmount',
      label: 'Outstanding',
      render: (val, row) => {
        const outstanding = Number(row.netAmount || 0) - Number(row.paidAmount || 0);
        return `$${outstanding.toFixed(2)}`;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_val, row) => <StatusBadge status={getDisplayStatus(row)} />,
    },
  ];

  const actions = (row) => [
    {
      label: 'View',
      icon: Eye,
      onClick: () => navigate(`/invoices/${row.id}`),
    },
  ];

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
        searchPlaceholder="Search invoices..."
        actions={actions}
      />
    </div>
  );
}
