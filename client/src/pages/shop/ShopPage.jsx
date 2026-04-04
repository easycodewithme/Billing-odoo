import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { getShopProducts } from '@/api/shop.api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ShopPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [productType, setProductType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search };
      if (sortBy) params.sortBy = sortBy;
      if (productType) params.productType = productType;
      const res = await getShopProducts(params);
      setProducts(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, productType]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold">Shop</h1>
          <p className="text-muted-foreground mt-1">Browse our subscription products</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={productType} onValueChange={(v) => { setProductType(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SaaS">SaaS</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              <SelectItem value="Service">Service</SelectItem>
              <SelectItem value="Goods">Goods</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v === 'default' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Grid */}
        {loading ? (
          <LoadingSpinner className="h-64" />
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer group overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  onClick={() => navigate(`/shop/${product.id}`)}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image.startsWith('http') ? product.image : `/uploads/products/${product.image}`} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl text-muted-foreground/30">{product.name.charAt(0)}</div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                        {product.productType && (
                          <Badge variant="secondary" className="mt-1 text-xs">{product.productType}</Badge>
                        )}
                      </div>
                      <p className="text-lg font-bold whitespace-nowrap">${Number(product.salesPrice).toFixed(2)}</p>
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
                    )}
                    {product.variants?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">{product.variants.length} variant(s) available</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
