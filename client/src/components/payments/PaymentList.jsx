import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getPayments } from '@/api/payments.api';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

const METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export default function PaymentList({ refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (methodFilter !== 'all') {
        params.method = methodFilter;
      }
      const res = await getPayments(params);
      setData(res.data.data || []);
      setPagination((prev) => ({ ...prev, total: res.data.total }));
    } catch {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, methodFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const columns = [
    {
      key: 'paymentDate',
      label: 'Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'invoiceId',
      label: 'Invoice No',
      render: (val) => val?.invoiceNo || '-',
    },
    {
      key: 'method',
      label: 'Method',
      render: (val) => (
        <Badge variant="outline">
          {PAYMENT_METHOD_LABELS[val] || val || '-'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (val) => `$${Number(val || 0).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (val) => val || '-',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={methodFilter}
          onValueChange={(val) => {
            setMethodFilter(val);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
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
        searchPlaceholder="Search payments..."
      />
    </div>
  );
}
