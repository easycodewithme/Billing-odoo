import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, icon: Icon, description, trend }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-6 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.startsWith('+') || trend.startsWith('↑')
                      ? 'text-green-600'
                      : trend.startsWith('-') || trend.startsWith('↓')
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                  )}
                >
                  {trend}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
