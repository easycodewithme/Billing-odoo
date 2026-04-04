import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/api/users.api';
import { changePassword } from '@/api/auth.api';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [changingPw, setChangingPw] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(user.id, form);
      toast.success('Profile updated');
      setEditing(false);
      checkAuth();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPw(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Profile" description="Manage your account details" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              {editing ? (
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              ) : (
                <p className="text-sm">{user.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Mail className="size-3.5" /> Email</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Phone className="size-3.5" /> Phone</Label>
              {editing ? (
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              ) : (
                <p className="text-sm">{user.phone || '-'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              {editing ? (
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, City, State, ZIP"
                />
              ) : (
                <p className="text-sm">{user.address || '-'}</p>
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge variant="secondary" className="capitalize">{user.role?.replace('_', ' ')}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Status</Label>
              <div>
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
              </p>
            </div>

            <Separator className="my-4" />
            <div className="space-y-3">
              <Label className="font-medium">Change Password</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPw.current ? 'text' : 'password'}
                    placeholder="Current password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}>
                    {showPw.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPw.new ? 'text' : 'password'}
                    placeholder="New password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}>
                    {showPw.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPw.confirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}>
                    {showPw.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleChangePassword} disabled={changingPw || !pwForm.currentPassword || !pwForm.newPassword}>
                {changingPw ? 'Changing...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
