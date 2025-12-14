'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CopyButton from '../components/CopyButton';

type Product = {
  sku: string;
  title: string;
  price_usd: number;
};

type CartItem = {
  sku: string;
  title: string;
  price: number;
  qty: number;
};

export default function ShopPage() {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [cartId, setCartId] = useState<string>('');
  const [cartToken, setCartToken] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [receipt, setReceipt] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const createCart = useCallback(async (): Promise<{ cartId: string; cartToken: string } | null> => {
    try {
      const res = await fetch('/api/shop/cart', { method: 'POST' });
      if (!res.ok) {
        console.error('Cart creation failed:', res.status, res.statusText);
        throw new Error('Failed to create cart');
      }
      const data = await res.json();
      setCartId(data.cart_id);
      setCartToken(data.cart_token || '');
      setCartItems([]);
      return data.cart_token ? { cartId: data.cart_id, cartToken: data.cart_token } : null;
    } catch (error) {
      console.error('Cart error:', error);
      setMessage('Failed to create cart. Please refresh the page.');
      return null;
    }
  }, []);

  useEffect(() => {
    async function init() {
      setInitializing(true);
      await Promise.all([fetchCatalog(), createCart()]);
      setInitializing(false);
    }
    init();

    // Recreate cart when page becomes visible (handles back button)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        createCart();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [createCart]);

  async function fetchCatalog() {
    try {
      const res = await fetch('/api/shop/catalog');
      if (!res.ok) {
        console.error('Catalog fetch failed:', res.status, res.statusText);
        setMessage(`Failed to load catalog: ${res.status}`);
        return;
      }
      const data = await res.json();
      setCatalog(data.items || []);
    } catch (error) {
      console.error('Catalog error:', error);
      setMessage('Failed to load catalog');
    }
  }

  async function addToCart(sku: string) {
    let currentCartId = cartId;
    let currentCartToken = cartToken;

    // If no cart token, try to create a new cart first
    if (!currentCartToken) {
      const newCart = await createCart();
      if (!newCart) {
        setMessage('Cart session expired. Please refresh the page.');
        return;
      }
      currentCartId = newCart.cartId;
      currentCartToken = newCart.cartToken;
    }

    try {
      const res = await fetch(`/api/shop/cart/${currentCartId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, qty: 1, cart_token: currentCartToken })
      });

      const data = await res.json();
      if (data.items && data.cart_token) {
        setCartItems(data.items);
        setCartToken(data.cart_token);
        setMessage('Added to cart!');
        setTimeout(() => setMessage(''), 2000);
      } else if (data.error) {
        console.error('Add to cart error:', data);
        setMessage(`Error: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      setMessage('Error adding to cart');
    }
  }

  async function checkout() {
    if (!cartId || !cartToken) {
      setMessage('Cart not ready. Please refresh the page.');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_id: cartId, cart_token: cartToken })
      });

      const data = await res.json();

      if (res.status === 402) {
        setMessage(`Payment Required: $${data.x402.amount_usd} USDC. Using demo token...`);

        setTimeout(async () => {
          const paidRes = await fetch('/api/shop/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-402-Proof': 'demo-pay-ok-123',
              'X-402-Session': data.session_token
            },
            body: JSON.stringify({ cart_id: cartId, cart_token: cartToken })
          });

          if (paidRes.ok) {
            const receiptJws = paidRes.headers.get('PEAC-Receipt');
            const order = await paidRes.json();

            setReceipt(receiptJws || '');
            setMessage(`Order ${order.order_id} complete! Add items to start a new order.`);
            setCartItems([]);

            await createCart();
          } else {
            const errorData = await paidRes.json().catch(() => ({}));
            setMessage(`Payment verification failed: ${errorData.message || 'Unknown error'}`);
          }
          setLoading(false);
        }, 1000);
      } else if (data.error) {
        setMessage(`Checkout failed: ${data.message || data.error}`);
        setLoading(false);
      } else {
        setMessage('Checkout failed');
        setLoading(false);
      }
    } catch (error) {
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(false);
    }
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-900 font-bold text-xl">
            PEAC × x402
          </Link>
          <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            ← Back to Home
          </Link>
        </nav>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Shop Demo
          </h1>
          <p className="text-xl text-gray-600">
            Add items → Checkout → Auto-pay with x402 → Get PEAC Receipt
          </p>
        </div>

        {message && (
          <div className={`max-w-4xl mx-auto mb-6 card p-4 text-center font-semibold ${
            message.includes('complete')
              ? 'bg-green-50 border-green-200 text-green-700'
              : message.includes('Error') || message.includes('failed')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'text-gray-900 border-brand/20'
          }`}>
            {message.includes('complete') && <span className="mr-2">✓</span>}
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="lg:col-span-2 card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-brand">
              Catalog
            </h2>
            <div className="space-y-4">
              {catalog.map((product) => (
                <div
                  key={product.sku}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-brand hover:shadow-md transition-all"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{product.title}</h3>
                    <p className="text-brand font-bold text-xl">
                      ${product.price_usd.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(product.sku)}
                    className="btn-primary"
                    disabled={!cartId || !cartToken || initializing}
                  >
                    {initializing ? 'Loading...' : 'Add to Cart'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-brand">
              Cart
            </h2>

            {cartItems.length === 0 ? (
              receipt ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✓</div>
                  <p className="text-green-600 font-semibold text-lg">Order Complete!</p>
                  <p className="text-gray-500 text-sm mt-2">Add more items to start a new order</p>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              )
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-3 border-b border-gray-200">
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">Qty: {item.qty}</div>
                      </div>
                      <div className="font-semibold text-gray-900">${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-brand">
                  <div className="flex justify-between mb-6">
                    <span className="text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-brand">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={checkout}
                    disabled={loading || cartItems.length === 0 || !cartToken}
                    className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none text-base py-3"
                  >
                    {loading ? 'Processing...' : 'Checkout with x402'}
                  </button>
                </div>
              </>
            )}

            {cartId && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Cart ID</div>
                <div className="text-xs font-mono break-all text-gray-900">{cartId}</div>
              </div>
            )}
          </div>
        </div>

        {receipt && (
          <div className="max-w-6xl mx-auto mt-8 card p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                PEAC Receipt (JWS)
              </h2>
              <CopyButton text={receipt} label="Copy Receipt" />
            </div>
            <textarea
              readOnly
              value={receipt}
              aria-label="PEAC Receipt JWS token"
              className="w-full h-32 p-4 font-mono text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <div className="mt-6 flex gap-4">
              <Link
                href="/verify/offline"
                className="btn-primary"
              >
                Verify Receipt
              </Link>
              <a
                href="/api/openapi.json"
                className="btn-secondary"
              >
                View API Docs
              </a>
            </div>
          </div>
        )}

        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <div className="max-w-6xl mx-auto mt-8 text-center text-gray-500 text-sm">
            <p>Demo Mode: Using token &quot;demo-pay-ok-123&quot; - No real payment required</p>
          </div>
        )}
      </div>
    </div>
  );
}
