import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, DollarSign, TrendingUp, AlertCircle, CreditCard, FileText, Receipt, RefreshCw } from 'lucide-react';
import {
  getDashboardStats,
  getRevenueReport,
  getSubscriptionReport,
  getOverdueInvoices,
} from '@/api/reports.api';
import { getSubscriptions } from '@/api/subscriptions.api';
import { getInvoices } from '@/api/invoices.api';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatsCard from '@/components/dashboard/StatsCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import SubscriptionChart from '@/components/dashboard/SubscriptionChart';
import OverdueInvoices from '@/components/dashboard/OverdueInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';

// ── Admin/Internal Dashboard ──
function StaffDashboard({ refreshKey }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, [refreshKey]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, subRes, overdueRes] = await Promise.all([
        getDashboardStats(),
        getRevenueReport(),
        getSubscriptionReport(),
        getOverdueInvoices(),
      ]);
      setStats(statsRes.data.data || statsRes.data);

      const revData = revenueRes.data.data || revenueRes.data || [];
      setRevenueData(Array.isArray(revData) ? revData : []);

      const subData = subRes.data.data || subRes.data || {};
      const byStatus = subData.byStatus || {};
      if (Array.isArray(byStatus)) {
        setSubscriptionData(byStatus);
      } else {
        setSubscriptionData(
          Object.entries(byStatus).map(([status, count]) => ({ status, count }))
        );
      }

      const overdueData = overdueRes.data.data || overdueRes.data || [];
      setOverdueInvoices(Array.isArray(overdueData) ? overdueData : []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" />;

  const activeSubscriptions = stats?.activeSubscriptions ?? 0;
  const mrr = stats?.mrr ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const overdueCount = stats?.overdueInvoicesCount ?? stats?.overdueInvoices ?? overdueInvoices.length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Active Subscriptions" value={activeSubscriptions} icon={Activity} description="Currently active" />
        <StatsCard title="MRR" value={`$${Number(mrr).toFixed(2)}`} icon={DollarSign} description="Monthly recurring revenue" />
        <StatsCard title="Total Revenue" value={`$${Number(totalRevenue).toFixed(2)}`} icon={TrendingUp} description="All-time revenue" />
        <StatsCard title="Overdue Invoices" value={overdueCount} icon={AlertCircle} description="Requires attention" />
      </div>
      <RevenueChart data={revenueData} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SubscriptionChart data={subscriptionData} />
        </div>
        <div className="lg:col-span-2">
          <OverdueInvoices invoices={overdueInvoices} />
        </div>
      </div>
    </>
  );
}

// ── Portal User Dashboard ──
function PortalDashboard({ refreshKey }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchPortalData();
  }, [refreshKey]);

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        getSubscriptions({ limit: 100 }),
        getInvoices({ limit: 100 }),
      ]);
      setSubscriptions(subRes.data.data || []);
      setInvoices(invRes.data.data || []);
    } catch {
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" />;

  const activeSubs = subscriptions.filter(s => s.status === 'active').length;
  const totalSubs = subscriptions.length;
  const pendingInvoices = invoices.filter(i => i.status === 'confirmed').length;
  const totalOutstanding = invoices
    .filter(i => i.status === 'confirmed')
    .reduce((sum, i) => sum + Number(i.outstandingAmount || 0), 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="My Subscriptions" value={totalSubs} icon={CreditCard} description={`${activeSubs} active`} />
        <StatsCard title="Pending Invoices" value={pendingInvoices} icon={FileText} description="Awaiting payment" />
        <StatsCard title="Outstanding Amount" value={`$${totalOutstanding.toFixed(2)}`} icon={DollarSign} description="Total due" />
        <StatsCard title="Active Plans" value={activeSubs} icon={Activity} description="Currently running" />
      </div>

      {/* Recent Subscriptions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><CreditCard className="size-5" /> My Subscriptions</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/subscriptions')}>View All</Button>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No subscriptions yet.</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.slice(0, 5).map(sub => (
                <div key={sub.id} className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:bg-accent/50" onClick={() => navigate(`/subscriptions/${sub.id}`)}>
                  <div>
                    <p className="text-sm font-medium">{sub.subscriptionNo}</p>
                    <p className="text-xs text-muted-foreground">{sub.plan?.name || '-'}</p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Receipt className="size-5" /> Pending Invoices</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>View All</Button>
        </CardHeader>
        <CardContent>
          {invoices.filter(i => i.status === 'confirmed').length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending invoices.</p>
          ) : (
            <div className="space-y-3">
              {invoices.filter(i => i.status === 'confirmed').slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:bg-accent/50" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <div>
                    <p className="text-sm font-medium">{inv.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <p className="text-sm font-bold">${Number(inv.outstandingAmount || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Main Dashboard ──
export default function DashboardPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'internal_user';
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={isStaff ? 'Dashboard' : `Welcome, ${user?.fullName || 'User'}`}
        description={isStaff ? 'Overview of your subscription business' : 'Your subscription portal'}
      >
        <Button variant="outline" size="icon" onClick={() => setRefreshKey(k => k + 1)}>
          <RefreshCw className="size-4" />
        </Button>
      </PageHeader>
      {isStaff ? <StaffDashboard refreshKey={refreshKey} /> : <PortalDashboard refreshKey={refreshKey} />}
    </div>
  );
}
