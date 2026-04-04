import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getRevenueReport,
  getSubscriptionReport,
  getPaymentReport,
  getOverdueInvoices,
} from '@/api/reports.api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Download } from 'lucide-react';

function downloadCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_COLORS = {
  draft: '#9ca3af',
  quotation: '#3b82f6',
  confirmed: '#6366f1',
  active: '#22c55e',
  paused: '#eab308',
  closed: '#ef4444',
};

const PAYMENT_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#6366f1'];

export default function ReportsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data states
  const [revenueData, setRevenueData] = useState({ monthly: [], total: 0 });
  const [subscriptionData, setSubscriptionData] = useState({
    byStatus: [],
    monthlyTrend: [],
  });
  const [paymentData, setPaymentData] = useState({
    byMethod: [],
    totalPaid: 0,
    totalOutstanding: 0,
  });
  const [overdueData, setOverdueData] = useState([]);

  const fetchTabData = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      switch (activeTab) {
        case 'revenue': {
          const res = await getRevenueReport(params);
          const d = res.data.data || res.data;
          setRevenueData({
            monthly: d.monthly || [],
            total: d.total || 0,
          });
          break;
        }
        case 'subscriptions': {
          const res = await getSubscriptionReport(params);
          const d = res.data.data || res.data;
          setSubscriptionData({
            byStatus: d.byStatus || [],
            monthlyTrend: d.monthlyTrend || d.monthly || [],
          });
          break;
        }
        case 'payments': {
          const res = await getPaymentReport(params);
          const d = res.data.data || res.data;
          setPaymentData({
            byMethod: d.byMethod || [],
            totalPaid: d.totalPaid || 0,
            totalOutstanding: d.totalOutstanding || 0,
          });
          break;
        }
        case 'overdue': {
          const res = await getOverdueInvoices(params);
          setOverdueData(res.data.data || res.data || []);
          break;
        }
      }
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const diff = Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Reports" description="Analytics and business reports" />

      {/* Date Range Filter */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-1">
            <Label htmlFor="report-start">Start Date</Label>
            <Input
              id="report-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="report-end">End Date</Label>
            <Input
              id="report-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-44"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        {loading ? (
          <LoadingSpinner className="h-64 mt-6" />
        ) : (
          <>
            {/* Revenue Tab */}
            <TabsContent value="revenue" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Total Revenue</CardTitle>
                    <span className="text-2xl font-bold">
                      ${Number(revenueData.total).toFixed(2)}
                    </span>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueData.monthly.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No revenue data for the selected period.
                    </p>
                  ) : (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueData.monthly}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#revGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => downloadCSV(revenueData.monthly, 'revenue-report')}>
                  <Download className="size-4 mr-1" /> Export CSV
                </Button>
              </div>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="mt-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Status Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscriptionData.byStatus.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No subscription data available.
                      </p>
                    ) : (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={subscriptionData.byStatus}
                              cx="50%"
                              cy="45%"
                              innerRadius={50}
                              outerRadius={85}
                              paddingAngle={2}
                              dataKey="count"
                              nameKey="status"
                            >
                              {subscriptionData.byStatus.map((entry, i) => (
                                <Cell
                                  key={entry.status || i}
                                  fill={STATUS_COLORS[entry.status] || PAYMENT_COLORS[i % PAYMENT_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend
                              formatter={(v) =>
                                v ? v.charAt(0).toUpperCase() + v.slice(1) : ''
                              }
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Trend Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscriptionData.monthlyTrend.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No trend data available.
                      </p>
                    ) : (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={subscriptionData.monthlyTrend}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => downloadCSV(subscriptionData.byStatus, 'subscriptions-report')}>
                  <Download className="size-4 mr-1" /> Export CSV
                </Button>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${Number(paymentData.totalPaid).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Outstanding
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      ${Number(paymentData.totalOutstanding).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Payments by Method</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentData.byMethod.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No payment data available.
                    </p>
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentData.byMethod}
                            cx="50%"
                            cy="45%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="total"
                            nameKey="method"
                            label={({ method, total }) =>
                              `${method || 'Unknown'}: $${Number(total).toFixed(0)}`
                            }
                          >
                            {paymentData.byMethod.map((entry, i) => (
                              <Cell
                                key={entry.method || i}
                                fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Amount']}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => downloadCSV(paymentData.byMethod, 'payments-report')}>
                  <Download className="size-4 mr-1" /> Export CSV
                </Button>
              </div>
            </TabsContent>

            {/* Overdue Tab */}
            <TabsContent value="overdue" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overdue Invoices</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {overdueData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 px-6">
                      No overdue invoices.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Outstanding</TableHead>
                          <TableHead className="text-right">Days Overdue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overdueData.map((inv) => {
                          const outstanding =
                            Number(inv.netAmount || 0) - Number(inv.paidAmount || 0);
                          return (
                            <TableRow key={inv.id}>
                              <TableCell>
                                <Button
                                  variant="link"
                                  className="h-auto p-0"
                                  onClick={() => navigate(`/invoices/${inv.id}`)}
                                >
                                  {inv.invoiceNo}
                                </Button>
                              </TableCell>
                              <TableCell>{inv.customerId?.name || '-'}</TableCell>
                              <TableCell>
                                {inv.dueDate
                                  ? new Date(inv.dueDate).toLocaleDateString()
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                ${Number(inv.netAmount || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                ${outstanding.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-red-600">
                                {getDaysOverdue(inv.dueDate)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => downloadCSV(overdueData, 'overdue-report')}>
                  <Download className="size-4 mr-1" /> Export CSV
                </Button>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
