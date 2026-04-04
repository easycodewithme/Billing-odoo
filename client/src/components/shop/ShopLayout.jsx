import { Outlet } from 'react-router-dom';
import ShopNav from './ShopNav';

export default function ShopLayout() {
  return (
    <div className="min-h-screen bg-background">
      <ShopNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
