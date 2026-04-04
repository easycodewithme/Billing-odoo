import api from './axios';

export const getShopProducts = (params) => api.get('/shop/products', { params });
export const getShopProduct = (id) => api.get(`/shop/products/${id}`);
export const getCart = () => api.get('/shop/cart');
export const addToCart = (data) => api.post('/shop/cart/add', data);
export const updateCartItem = (itemId, data) => api.put(`/shop/cart/item/${itemId}`, data);
export const removeCartItem = (itemId) => api.delete(`/shop/cart/item/${itemId}`);
export const applyDiscountCode = (data) => api.post('/shop/cart/discount', data);
export const shopCheckout = (data) => api.post('/shop/checkout', data);
export const shopStripeCheckout = () => api.post('/shop/checkout/stripe');
export const getMyOrders = (params) => api.get('/shop/orders', { params });
export const getMyOrder = (id) => api.get(`/shop/orders/${id}`);
