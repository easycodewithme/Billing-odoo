import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import UserList from '@/components/users/UserList';
import UserForm from '@/components/users/UserForm';

export default function UsersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Users" description="Manage system users">
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add User
        </Button>
      </PageHeader>

      <UserList onEdit={handleEdit} refreshKey={refreshKey} />

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editUser}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
