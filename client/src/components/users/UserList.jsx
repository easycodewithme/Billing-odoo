import { useState, useEffect, useCallback } from 'react';
import { Pencil, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, activateUser, deactivateUser } from '@/api/users.api';
import { ROLE_LABELS } from '@/lib/constants';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function UserList({ onEdit, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search };
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await getUsers(params);
      setData(res.data.data);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleToggleStatus = async () => {
    if (!confirmAction) return;
    const { user, action } = confirmAction;
    try {
      if (action === 'activate') {
        await activateUser(user.id);
        toast.success('User activated successfully');
      } else {
        await deactivateUser(user.id);
        toast.success('User deactivated successfully');
      }
      fetchData();
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleRoleChange = (value) => {
    setRoleFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (val) => val || '-' },
    {
      key: 'role',
      label: 'Role',
      render: (val) => <Badge variant="secondary">{ROLE_LABELS[val] || val}</Badge>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => <StatusBadge status={val !== false ? 'active' : 'inactive'} />,
    },
  ];

  const actions = (row) => {
    const items = [
      { label: 'Edit', icon: Pencil, onClick: () => onEdit?.(row) },
    ];
    if (row.isActive !== false) {
      items.push({
        label: 'Deactivate',
        icon: UserX,
        variant: 'destructive',
        onClick: () => setConfirmAction({ user: row, action: 'deactivate' }),
      });
    } else {
      items.push({
        label: 'Activate',
        icon: UserCheck,
        onClick: () => setConfirmAction({ user: row, action: 'activate' }),
      });
    }
    return items;
  };

  return (
    <>
      <Tabs value={roleFilter} onValueChange={handleRoleChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="internal_user">Internal</TabsTrigger>
          <TabsTrigger value="portal_user">Portal</TabsTrigger>
        </TabsList>

        <TabsContent value={roleFilter}>
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onSearch={setSearch}
            searchPlaceholder="Search users..."
            actions={actions}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.action === 'activate' ? 'Activate User' : 'Deactivate User'}
        description={`Are you sure you want to ${confirmAction?.action} "${confirmAction?.user?.fullName}"?`}
        onConfirm={handleToggleStatus}
        variant={confirmAction?.action === 'activate' ? 'default' : 'destructive'}
      />
    </>
  );
}
