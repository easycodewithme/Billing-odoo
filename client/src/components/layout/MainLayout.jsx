import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar, { SIDEBAR_COLLAPSED_KEY } from './Sidebar';
import Header from './Header';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // localStorage unavailable
    }
  }, [collapsed]);

  const toggleSidebar = () => {
    // On mobile, toggle the sheet; on desktop, toggle collapsed
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </div>

      {/* Mobile sidebar in Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0" showCloseButton={false}>
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Header */}
      <Header onToggleSidebar={toggleSidebar} collapsed={collapsed} />

      {/* Main content */}
      <main
        className={cn(
          'pt-14 transition-all duration-300',
          collapsed ? 'md:pl-[70px]' : 'md:pl-[260px]'
        )}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
