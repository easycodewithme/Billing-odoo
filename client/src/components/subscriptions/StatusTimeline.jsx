import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';

const DOT_COLORS = {
  draft: 'bg-gray-400',
  quotation: 'bg-blue-500',
  confirmed: 'bg-indigo-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  closed: 'bg-red-500',
  paid: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export default function StatusTimeline({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No status history available.
      </p>
    );
  }

  return (
    <div className="relative space-y-0 pl-8">
      {/* Vertical line */}
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />

      {logs.map((log, index) => {
        const toColor = DOT_COLORS[log.toStatus] || 'bg-gray-400';
        const changedBy = log.changedBy?.name || log.changedBy?.email || 'System';
        const date = log.createdAt
          ? new Date(log.createdAt).toLocaleString()
          : '-';

        return (
          <div key={log._id || index} className="relative pb-8 last:pb-0">
            {/* Dot */}
            <div
              className={cn(
                'absolute -left-[20.5px] top-1 size-3 rounded-full ring-4 ring-background',
                toColor
              )}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'inline-block rounded px-2 py-0.5 text-xs font-medium',
                    STATUS_COLORS[log.fromStatus] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {log.fromStatus
                    ? log.fromStatus.charAt(0).toUpperCase() + log.fromStatus.slice(1)
                    : 'New'}
                </span>
                <span className="text-muted-foreground text-xs">→</span>
                <span
                  className={cn(
                    'inline-block rounded px-2 py-0.5 text-xs font-medium',
                    STATUS_COLORS[log.toStatus] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {log.toStatus
                    ? log.toStatus.charAt(0).toUpperCase() + log.toStatus.slice(1)
                    : '-'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{changedBy}</span>
                <span>&middot;</span>
                <span>{date}</span>
              </div>

              {log.reason && (
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;{log.reason}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
