import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: {
    variant: 'secondary',
    className: '',
  },
  quotation: {
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  confirmed: {
    variant: 'secondary',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  active: {
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  paid: {
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  completed: {
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  paused: {
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  pending: {
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  closed: {
    variant: 'destructive',
    className: '',
  },
  cancelled: {
    variant: 'destructive',
    className: '',
  },
  failed: {
    variant: 'destructive',
    className: '',
  },
  refunded: {
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

export default function StatusBadge({ status }) {
  const normalizedStatus = (status || '').toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    variant: 'outline',
    className: '',
  };

  return (
    <Badge variant={config.variant} className={cn(config.className)}>
      {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
    </Badge>
  );
}
