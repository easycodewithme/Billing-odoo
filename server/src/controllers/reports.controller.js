const prisma = require('../utils/prisma');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /reports/dashboard-stats
 * Return key dashboard statistics.
 */
const dashboardStats = async (req, res) => {
  try {
    const [
      totalSubscriptions,
      activeSubscriptions,
      totalCustomers,
      revenueResult,
      overdueInvoicesCount,
      mrrResult,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: 'portal_user' } }),
      prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { netAmount: true },
      }),
      prisma.invoice.count({
        where: {
          dueDate: { lt: new Date() },
          status: { notIn: ['paid', 'cancelled'] },
        },
      }),
      // MRR: sum netAmount of invoices linked to active subscriptions, divided by billing period months
      prisma.subscription.findMany({
        where: { status: 'active' },
        include: {
          plan: { select: { billingPeriod: true, price: true } },
        },
      }),
    ]);

    // Calculate MRR from active subscriptions
    const mrr = mrrResult.reduce((total, sub) => {
      const price = Number(sub.plan?.price || 0);
      const period = sub.plan?.billingPeriod;

      switch (period) {
        case 'monthly':
          return total + price;
        case 'quarterly':
          return total + price / 3;
        case 'yearly':
        case 'annual':
          return total + price / 12;
        case 'weekly':
          return total + price * 4.33;
        default:
          return total + price;
      }
    }, 0);

    return success(res, {
      totalSubscriptions,
      activeSubscriptions,
      totalCustomers,
      totalRevenue: revenueResult._sum.netAmount || 0,
      overdueInvoicesCount,
      mrr: Math.round(mrr * 100) / 100,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return error(res, 'Failed to fetch dashboard stats');
  }
};

/**
 * GET /reports/revenue
 * Monthly revenue for the last 12 months.
 */
const revenueReport = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        paymentDate: { gte: twelveMonthsAgo },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
      orderBy: { paymentDate: 'asc' },
    });

    // Group payments by month
    const monthlyRevenue = {};
    payments.forEach((payment) => {
      const date = new Date(payment.paymentDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyRevenue[key]) {
        monthlyRevenue[key] = 0;
      }
      monthlyRevenue[key] += payment.amount;
    });

    // Build array for last 12 months
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: key,
        revenue: Math.round((monthlyRevenue[key] || 0) * 100) / 100,
      });
    }

    return success(res, result);
  } catch (err) {
    console.error('Revenue report error:', err);
    return error(res, 'Failed to fetch revenue report');
  }
};

/**
 * GET /reports/subscriptions
 * Subscription count by status and new subscriptions trend by month.
 */
const subscriptionReport = async (req, res) => {
  try {
    const statusCounts = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const byStatus = {};
    statusCounts.forEach((item) => {
      byStatus[item.status] = item._count.id;
    });

    // New subscriptions by month for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const subscriptions = await prisma.subscription.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyTrend = {};
    subscriptions.forEach((sub) => {
      const date = new Date(sub.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyTrend[key]) {
        monthlyTrend[key] = 0;
      }
      monthlyTrend[key]++;
    });

    const trend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      trend.push({
        month: key,
        count: monthlyTrend[key] || 0,
      });
    }

    return success(res, { byStatus, trend });
  } catch (err) {
    console.error('Subscription report error:', err);
    return error(res, 'Failed to fetch subscription report');
  }
};

/**
 * GET /reports/payments
 * Total paid vs outstanding and breakdown by payment method.
 */
const paymentReport = async (req, res) => {
  try {
    const [paidResult, outstandingResult, methodBreakdown] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { notIn: ['paid', 'cancelled'] } },
        _sum: { outstandingAmount: true },
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: { status: 'completed' },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const byMethod = methodBreakdown.map((item) => ({
      method: item.method,
      totalAmount: item._sum.amount || 0,
      count: item._count.id,
    }));

    return success(res, {
      totalPaid: paidResult._sum.paidAmount || 0,
      totalOutstanding: outstandingResult._sum.outstandingAmount || 0,
      byMethod,
    });
  } catch (err) {
    console.error('Payment report error:', err);
    return error(res, 'Failed to fetch payment report');
  }
};

/**
 * GET /reports/overdue-invoices
 * List invoices where dueDate < now and status = confirmed (not paid).
 */
const overdueInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: 'confirmed',
      },
      include: {
        customer: { select: { fullName: true, email: true } },
        subscription: { select: { subscriptionNo: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return success(res, invoices);
  } catch (err) {
    console.error('Overdue invoices error:', err);
    return error(res, 'Failed to fetch overdue invoices');
  }
};

module.exports = {
  dashboardStats,
  revenueReport,
  subscriptionReport,
  paymentReport,
  overdueInvoices,
};
