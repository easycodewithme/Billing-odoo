import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart, ChevronLeft, Minus, Plus, Check } from 'lucide-react';
import { getShopProduct } from '@/api/shop.api';
import { addToCart } from '@/api/shop.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await getShopProduct(id);
      setProduct(res.data.data || res.data);
    } catch {
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = Number(product?.salesPrice || 0) + Number(selectedVariant?.extraPrice || 0);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant?.id || undefined,
        quantity,
      });
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" />;
  if (!product) return null;

  // Group variants by attribute
  const variantGroups = {};
  (product.variants || []).forEach((v) => {
    if (!variantGroups[v.attribute]) variantGroups[v.attribute] = [];
    variantGroups[v.attribute].push(v);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="size-4" /> Back to Shop
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Image */}
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {product.image ? (
              <img src={product.image.startsWith('http') ? product.image : `/uploads/products/${product.image}`} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-8xl text-muted-foreground/20">{product.name.charAt(0)}</div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.productType && <Badge variant="secondary">{product.productType}</Badge>}
              <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
              <p className="text-3xl font-bold text-primary mt-2">${currentPrice.toFixed(2)}</p>
              {selectedVariant && (
                <p className="text-sm text-muted-foreground">
                  Base ${Number(product.salesPrice).toFixed(2)} + ${Number(selectedVariant.extraPrice).toFixed(2)} ({selectedVariant.attribute}: {selectedVariant.value})
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}

            <Separator />

            {/* Variant Selection */}
            {Object.keys(variantGroups).length > 0 && (
              <div className="space-y-4">
                {Object.entries(variantGroups).map(([attr, variants]) => (
                  <div key={attr}>
                    <label className="text-sm font-medium mb-2 block">{attr}</label>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v) => (
                        <Button
                          key={v.id}
                          variant={selectedVariant?.id === v.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                        >
                          {v.value}
                          {Number(v.extraPrice) > 0 && ` (+$${Number(v.extraPrice).toFixed(2)})`}
                          {selectedVariant?.id === v.id && <Check className="size-3 ml-1" />}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus className="size-4" />
                </Button>
                <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 1)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Add to Cart */}
            <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={adding}>
              <ShoppingCart className="size-5 mr-2" />
              {adding ? 'Adding...' : `Add to Cart - $${(currentPrice * quantity).toFixed(2)}`}
            </Button>

            {/* Guarantees */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>30-day money back guarantee</p>
              <p>Terms and conditions apply</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
