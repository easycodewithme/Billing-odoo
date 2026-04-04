import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { addVariant, updateVariant, deleteVariant } from '@/api/products.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const emptyRow = { attribute: '', value: '', extraPrice: '' };

export default function VariantManager({ productId, variants = [], onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState(emptyRow);
  const [editId, setEditId] = useState(null);
  const [editRow, setEditRow] = useState(emptyRow);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAdd = async () => {
    if (!newRow.attribute || !newRow.value) {
      toast.error('Attribute and value are required');
      return;
    }
    try {
      await addVariant(productId, {
        attribute: newRow.attribute,
        value: newRow.value,
        extraPrice: Number(newRow.extraPrice) || 0,
      });
      toast.success('Variant added');
      setAdding(false);
      setNewRow(emptyRow);
      onRefresh?.();
    } catch {
      toast.error('Failed to add variant');
    }
  };

  const handleEditSave = async () => {
    if (!editRow.attribute || !editRow.value) {
      toast.error('Attribute and value are required');
      return;
    }
    try {
      await updateVariant(productId, editId, {
        attribute: editRow.attribute,
        value: editRow.value,
        extraPrice: Number(editRow.extraPrice) || 0,
      });
      toast.success('Variant updated');
      setEditId(null);
      onRefresh?.();
    } catch {
      toast.error('Failed to update variant');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVariant(productId, deleteTarget._id);
      toast.success('Variant deleted');
      onRefresh?.();
    } catch {
      toast.error('Failed to delete variant');
    }
  };

  const startEdit = (variant) => {
    setEditId(variant._id);
    setEditRow({
      attribute: variant.attribute || '',
      value: variant.value || '',
      extraPrice: variant.extraPrice ?? '',
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Variants</h3>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add Variant
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attribute</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Extra Price</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) =>
              editId === variant._id ? (
                <TableRow key={variant._id}>
                  <TableCell>
                    <Input
                      value={editRow.attribute}
                      onChange={(e) => setEditRow((prev) => ({ ...prev, attribute: e.target.value }))}
                      placeholder="Attribute"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editRow.value}
                      onChange={(e) => setEditRow((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder="Value"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editRow.extraPrice}
                      onChange={(e) => setEditRow((prev) => ({ ...prev, extraPrice: e.target.value }))}
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={handleEditSave}>
                        <Check className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditId(null)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={variant._id}>
                  <TableCell>{variant.attribute}</TableCell>
                  <TableCell>{variant.value}</TableCell>
                  <TableCell>${Number(variant.extraPrice).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => startEdit(variant)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(variant)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            )}

            {adding && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newRow.attribute}
                    onChange={(e) => setNewRow((prev) => ({ ...prev, attribute: e.target.value }))}
                    placeholder="Attribute"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newRow.value}
                    onChange={(e) => setNewRow((prev) => ({ ...prev, value: e.target.value }))}
                    placeholder="Value"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newRow.extraPrice}
                    onChange={(e) => setNewRow((prev) => ({ ...prev, extraPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={handleAdd}>
                      <Check className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setAdding(false);
                        setNewRow(emptyRow);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {variants.length === 0 && !adding && (
              <TableRow>
                <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                  No variants yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Variant"
        description={`Are you sure you want to delete the variant "${deleteTarget?.attribute}: ${deleteTarget?.value}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
