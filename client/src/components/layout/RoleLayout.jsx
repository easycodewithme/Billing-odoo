import { useAuth } from '@/hooks/useAuth';
import MainLayout from './MainLayout';
import ShopLayout from '../shop/ShopLayout';

export default function RoleLayout() {
  const { user } = useAuth();

  if (user?.role === 'portal_user') {
    return <ShopLayout />;
  }

  return <MainLayout />;
}
