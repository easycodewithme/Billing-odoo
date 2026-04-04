import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function OverdueInvoices({ invoices = [] }) {
  const navigate = useNavigate();
  const top5 = invoices.slice(0, 5);

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue Invoices</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {top5.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-6">
            No overdue invoices.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Days Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5.map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell>
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => navigate(`/invoices/${inv._id}`)}
                    >
                      {inv.invoiceNo}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {inv.customerId?.name || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(inv.netAmount || inv.outstandingAmount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    {getDaysOverdue(inv.dueDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
