import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_CHART_COLORS = {
  draft: '#9ca3af',
  quotation: '#3b82f6',
  confirmed: '#6366f1',
  active: '#22c55e',
  paused: '#eab308',
  closed: '#ef4444',
};

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#6366f1', '#9ca3af'];

export default function SubscriptionChart({ data = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No subscription data available.
          </p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, count }) =>
                    `${status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}: ${count}`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.status || index}
                      fill={
                        STATUS_CHART_COLORS[entry.status] ||
                        DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => [value, name ? name.charAt(0).toUpperCase() + name.slice(1) : '']}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) =>
                    value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
