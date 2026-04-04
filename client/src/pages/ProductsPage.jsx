import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import ProductList from '@/components/products/ProductList';
import ProductForm from '@/components/products/ProductForm';

export default function ProductsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Products" description="Manage your product catalog">
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add Product
        </Button>
      </PageHeader>

      <ProductList onEdit={handleEdit} refreshKey={refreshKey} />

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editProduct}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
