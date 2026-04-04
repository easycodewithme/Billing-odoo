export const ROLES = {
  ADMIN: 'admin',
  INTERNAL: 'internal_user',
  PORTAL: 'portal_user',
}

export const ROLE_LABELS = {
  admin: 'Admin',
  internal_user: 'Internal User',
  portal_user: 'Portal User',
}

export const SUBSCRIPTION_STATUS = {
  DRAFT: 'draft',
  QUOTATION: 'quotation',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
}

export const SUBSCRIPTION_STATUS_LABELS = {
  draft: 'Draft',
  quotation: 'Quotation',
  confirmed: 'Confirmed',
  active: 'Active',
  paused: 'Paused',
  closed: 'Closed',
}

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  CANCELLED: 'cancelled',
}

export const INVOICE_STATUS_LABELS = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
}

export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  OTHER: 'other',
}

export const PAYMENT_METHOD_LABELS = {
  stripe: 'Stripe',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
}

export const BILLING_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

export const BILLING_PERIOD_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

export const DISCOUNT_TYPES = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
}

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  quotation: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
}
