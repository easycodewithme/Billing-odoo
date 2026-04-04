import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Activity, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import {
  getDashboardStats,
  getRevenueReport,
  getSubscriptionReport,
  getOverdueInvoices,
} from '@/api/reports.api';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatsCard from '@/components/dashboard/StatsCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import SubscriptionChart from '@/components/dashboard/SubscriptionChart';
import OverdueInvoices from '@/components/dashboard/OverdueInvoices';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

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

      // Revenue: backend returns array directly in data
      const revData = revenueRes.data.data || revenueRes.data || [];
      setRevenueData(Array.isArray(revData) ? revData : []);

      // Subscriptions: backend returns { byStatus: { draft: 1, active: 2 }, trend: [...] }
      // Transform byStatus object into array for PieChart: [{ status: 'draft', count: 1 }, ...]
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

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  const activeSubscriptions = stats?.activeSubscriptions ?? 0;
  const mrr = stats?.mrr ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const overdueCount = stats?.overdueInvoicesCount ?? stats?.overdueInvoices ?? overdueInvoices.length;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Dashboard" description="Overview of your subscription business" />

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Subscriptions"
          value={activeSubscriptions}
          icon={Activity}
          description="Currently active"
        />
        <StatsCard
          title="MRR"
          value={`$${Number(mrr).toFixed(2)}`}
          icon={DollarSign}
          description="Monthly recurring revenue"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${Number(totalRevenue).toFixed(2)}`}
          icon={TrendingUp}
          description="All-time revenue"
        />
        <StatsCard
          title="Overdue Invoices"
          value={overdueCount}
          icon={AlertCircle}
          description="Requires attention"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={revenueData} />

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SubscriptionChart data={subscriptionData} />
        </div>
        <div className="lg:col-span-2">
          <OverdueInvoices invoices={overdueInvoices} />
        </div>
      </div>
    </div>
  );
}
