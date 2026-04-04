import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  addOrderLine,
  updateOrderLine,
  deleteOrderLine,
} from '@/api/subscriptions.api';
import { getProducts, getProduct } from '@/api/products.api';
import { getTaxes } from '@/api/taxes.api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const initialLine = {
  productId: '',
  variantId: '',
  quantity: 1,
  unitPrice: '',
  taxId: '',
};

export default function OrderLineTable({
  subscriptionId,
  orderLines = [],
  editable: editableProp = false,
  readOnly = false,
  onRefresh,
}) {
  const editable = editableProp && !readOnly;
  const [formOpen, setFormOpen] = useState(false);
  const [editLine, setEditLine] = useState(null);
  const [deleteLine, setDeleteLine] = useState(null);
  const [form, setForm] = useState(initialLine);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [taxes, setTaxes] = useState([]);

  useEffect(() => {
    if (formOpen) {
      fetchProducts();
      fetchTaxes();
    }
  }, [formOpen]);

  const fetchProducts = async () => {
    try {
      const res = await getProducts({ limit: 100 });
      setProducts(res.data.data || []);
    } catch {
      toast.error('Failed to load products');
    }
  };

  const fetchTaxes = async () => {
    try {
      const res = await getTaxes({ limit: 100 });
      setTaxes(res.data.data || []);
    } catch {
      toast.error('Failed to load taxes');
    }
  };

  const fetchVariants = async (productId) => {
    try {
      const res = await getProduct(productId);
      const product = res.data.data || res.data;
      setVariants(product.variants || []);
    } catch {
      setVariants([]);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'productId') {
      setForm((prev) => ({ ...prev, variantId: '' }));
      setVariants([]);
      if (value) {
        fetchVariants(value);
        const product = products.find((p) => p.id === value);
        if (product) {
          setForm((prev) => ({ ...prev, unitPrice: product.salesPrice || '' }));
        }
      }
    }
  };

  const openAdd = () => {
    setEditLine(null);
    setForm(initialLine);
    setVariants([]);
    setFormOpen(true);
  };

  const openEdit = (line) => {
    setEditLine(line);
    setForm({
      productId: line.productId?.id || line.productId || '',
      variantId: line.variantId?.id || line.variantId || '',
      quantity: line.quantity || 1,
      unitPrice: line.unitPrice ?? '',
      taxId: line.taxId?.id || line.taxId || '',
    });
    const pid = line.productId?.id || line.productId;
    if (pid) fetchVariants(pid);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        productId: form.productId,
        variantId: form.variantId || undefined,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        taxId: form.taxId || undefined,
      };
      if (editLine) {
        await updateOrderLine(subscriptionId, editLine.id, payload);
        toast.success('Order line updated');
      } else {
        await addOrderLine(subscriptionId, payload);
        toast.success('Order line added');
      }
      setFormOpen(false);
      onRefresh?.();
    } catch {
      toast.error(editLine ? 'Failed to update order line' : 'Failed to add order line');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteLine) return;
    try {
      await deleteOrderLine(subscriptionId, deleteLine.id);
      toast.success('Order line deleted');
      onRefresh?.();
    } catch {
      toast.error('Failed to delete order line');
    }
  };

  const subtotal = orderLines.reduce((sum, line) => {
    const amount = (line.quantity || 0) * (line.unitPrice || 0);
    return sum + amount;
  }, 0);

  const taxTotal = orderLines.reduce((sum, line) => {
    const amount = (line.quantity || 0) * (line.unitPrice || 0);
    const taxRate = line.taxId?.rate || 0;
    return sum + amount * (taxRate / 100);
  }, 0);

  const grandTotal = subtotal + taxTotal;

  return (
    <div className="space-y-4">
      {editable && (
        <div className="flex justify-end">
          <Button onClick={openAdd}>
            <Plus className="size-4" />
            Add Order Line
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {editable && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderLines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={editable ? 7 : 6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No order lines yet.
                </TableCell>
              </TableRow>
            )}
            {orderLines.map((line) => {
              const lineAmount = (line.quantity || 0) * (line.unitPrice || 0);
              const taxRate = line.taxId?.rate || 0;
              return (
                <TableRow key={line.id}>
                  <TableCell>
                    {line.productId?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {line.variantId?.name || '-'}
                  </TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${Number(line.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {taxRate > 0 ? `${taxRate}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    ${lineAmount.toFixed(2)}
                  </TableCell>
                  {editable && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(line)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteLine(line)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}

            {/* Totals */}
            {orderLines.length > 0 && (
              <>
                <TableRow>
                  <TableCell
                    colSpan={editable ? 5 : 4}
                    className="text-right font-medium"
                  >
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${subtotal.toFixed(2)}
                  </TableCell>
                  {editable && <TableCell />}
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={editable ? 5 : 4}
                    className="text-right font-medium"
                  >
                    Tax
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${taxTotal.toFixed(2)}
                  </TableCell>
                  {editable && <TableCell />}
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={editable ? 5 : 4}
                    className="text-right text-base font-bold"
                  >
                    Total
                  </TableCell>
                  <TableCell className="text-right text-base font-bold">
                    ${grandTotal.toFixed(2)}
                  </TableCell>
                  {editable && <TableCell />}
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editLine ? 'Edit Order Line' : 'Add Order Line'}
            </DialogTitle>
            <DialogDescription>
              {editLine
                ? 'Update the order line details.'
                : 'Select a product and configure the order line.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ol-product">Product</Label>
              <Select
                value={form.productId}
                onValueChange={(val) => handleChange('productId', val)}
              >
                <SelectTrigger className="w-full" id="ol-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {variants.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="ol-variant">Variant</Label>
                <Select
                  value={form.variantId}
                  onValueChange={(val) => handleChange('variantId', val)}
                >
                  <SelectTrigger className="w-full" id="ol-variant">
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ol-quantity">Quantity</Label>
                <Input
                  id="ol-quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ol-unitPrice">Unit Price</Label>
                <Input
                  id="ol-unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => handleChange('unitPrice', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ol-tax">Tax</Label>
              <Select
                value={form.taxId}
                onValueChange={(val) => handleChange('taxId', val)}
              >
                <SelectTrigger className="w-full" id="ol-tax">
                  <SelectValue placeholder="No tax" />
                </SelectTrigger>
                <SelectContent>
                  {taxes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editLine ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteLine}
        onOpenChange={(open) => !open && setDeleteLine(null)}
        title="Delete Order Line"
        description="Are you sure you want to remove this order line? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
