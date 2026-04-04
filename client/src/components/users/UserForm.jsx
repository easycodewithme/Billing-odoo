import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createUser, updateUser } from '@/api/users.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
};

export default function UserForm({ open, onOpenChange, user, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
      });
    } else {
      setForm(initialForm);
    }
  }, [user, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        const payload = {
          fullName: form.fullName,
          phone: form.phone,
        };
        await updateUser(user._id, payload);
        toast.success('User updated successfully');
      } else {
        const payload = {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        };
        await createUser(payload);
        toast.success('User created successfully');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the user details below.'
              : 'Fill in the details to create a new internal user.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userFullName">Full Name</Label>
            <Input
              id="userFullName"
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="userPhone">Phone</Label>
            <Input
              id="userPhone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Phone number"
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="userPassword">Password</Label>
              <Input
                id="userPassword"
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Password"
                required
                minLength={6}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
