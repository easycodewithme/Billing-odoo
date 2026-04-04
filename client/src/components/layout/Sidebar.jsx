import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  RefreshCw,
  CreditCard,
  FileText,
  Receipt,
  Wallet,
  Percent,
  Tag,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/plans', label: 'Recurring Plans', icon: RefreshCw },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/quotation-templates', label: 'Quotation Templates', icon: FileText },
    ],
  },
  {
    label: 'Billing',
    items: [
      { to: '/invoices', label: 'Invoices', icon: Receipt },
      { to: '/payments', label: 'Payments', icon: Wallet },
    ],
  },
  {
    label: 'Config',
    items: [
      { to: '/taxes', label: 'Taxes', icon: Percent },
      { to: '/discounts', label: 'Discounts', icon: Tag },
      { to: '/users', label: 'Users', icon: Users, adminOnly: true },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const userRole = user?.role;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">SubManager</span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn('ml-auto', collapsed && 'mx-auto')}
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <TooltipProvider delayDuration={0}>
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || userRole === 'admin'
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="mb-4">
                {!collapsed && (
                  <p className="mb-1 px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </p>
                )}
                {collapsed && <div className="mb-1" />}
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const linkContent = (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                            isActive && 'bg-accent text-accent-foreground',
                            collapsed && 'justify-center px-2'
                          )
                        }
                      >
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    );

                    if (collapsed) {
                      return (
                        <li key={item.to}>
                          <Tooltip>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{item.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        </li>
                      );
                    }

                    return <li key={item.to}>{linkContent}</li>;
                  })}
                </ul>
              </div>
            );
          })}
        </TooltipProvider>
      </nav>
    </aside>
  );
}

export { SIDEBAR_COLLAPSED_KEY };
