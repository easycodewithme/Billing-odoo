import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, X, Link as LinkIcon } from 'lucide-react';
import { createProduct, updateProduct } from '@/api/products.api';
import { uploadFile } from '@/api/upload.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialForm = {
  name: '',
  productType: 'SaaS',
  salesPrice: '',
  costPrice: '',
  description: '',
  image: '',
};

export default function ProductForm({ open, onOpenChange, product, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState('upload'); // 'upload' or 'url'
  const fileRef = useRef(null);

  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        productType: product.productType || 'SaaS',
        salesPrice: product.salesPrice ?? '',
        costPrice: product.costPrice ?? '',
        description: product.description || '',
        image: product.image || '',
      });
      setImageMode(product.image?.startsWith('http') ? 'url' : 'upload');
    } else {
      setForm(initialForm);
      setImageMode('upload');
    }
  }, [product, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadFile('products', file);
      const data = res.data?.data || res.data;
      const imagePath = data?.path || data?.filename || '';
      handleChange('image', `/uploads/products/${imagePath}`);
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        salesPrice: Number(form.salesPrice),
        costPrice: Number(form.costPrice),
      };
      if (isEdit) {
        await updateProduct(product.id, payload);
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload);
        toast.success('Product created successfully');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the product details below.' : 'Fill in the details to create a new product.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productType">Type</Label>
            <Select value={form.productType} onValueChange={(val) => handleChange('productType', val)}>
              <SelectTrigger className="w-full" id="productType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SaaS">SaaS</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Goods">Goods</SelectItem>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesPrice">Sales Price</Label>
              <Input
                id="salesPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.salesPrice}
                onChange={(e) => handleChange('salesPrice', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={(e) => handleChange('costPrice', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Product description"
              rows={3}
            />
          </div>

          {/* Image Upload / URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Product Image</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={imageMode === 'upload' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setImageMode('upload')}
                >
                  <Upload className="size-3 mr-1" /> Upload
                </Button>
                <Button
                  type="button"
                  variant={imageMode === 'url' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => setImageMode('url')}
                >
                  <LinkIcon className="size-3 mr-1" /> URL
                </Button>
              </div>
            </div>

            {imageMode === 'upload' ? (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="size-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Choose Image'}
                </Button>
              </div>
            ) : (
              <Input
                value={form.image}
                onChange={(e) => handleChange('image', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            )}

            {/* Preview */}
            {form.image && (
              <div className="relative inline-block">
                <img
                  src={form.image}
                  alt="Preview"
                  className="h-24 w-24 object-cover rounded-lg border"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  onClick={() => handleChange('image', '')}
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
