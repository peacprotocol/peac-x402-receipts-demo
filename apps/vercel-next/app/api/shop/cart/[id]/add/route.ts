// app/api/shop/cart/[id]/add/route.ts
import { NextRequest } from 'next/server';
import { getProduct } from '@/lib/catalog';
import { verifyCartToken, signCartToken, nowIso } from '@/lib/peac';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const { sku, qty = 1, cart_token } = body || {};

  if (!sku) {
    return Response.json(
      { error: 'missing_sku' },
      { status: 400 }
    );
  }

  if (!cart_token) {
    return Response.json(
      { error: 'missing_cart_token', message: 'Cart token required' },
      { status: 400 }
    );
  }

  const product = getProduct(sku);
  if (!product) {
    return Response.json(
      { error: 'invalid_sku', message: `Product ${sku} not found` },
      { status: 400 }
    );
  }

  // Verify and decode the cart token
  let cartData;
  try {
    cartData = await verifyCartToken(cart_token);
  } catch {
    return Response.json(
      { error: 'invalid_cart_token', message: 'Cart token verification failed' },
      { status: 400 }
    );
  }

  // Verify cart_id matches
  if (cartData.cart_id !== id) {
    return Response.json(
      { error: 'cart_id_mismatch', message: 'Cart ID does not match token' },
      { status: 400 }
    );
  }

  // Update cart items
  const existingItem = cartData.items.find(item => item.sku === sku);
  if (existingItem) {
    existingItem.qty += Number(qty);
  } else {
    cartData.items.push({ sku, qty: Number(qty) });
  }

  // Sign new cart token
  const newCartToken = await signCartToken({
    cart_id: cartData.cart_id,
    items: cartData.items,
    created_at: cartData.created_at || nowIso()
  });

  // Enrich cart items with product details
  const enrichedItems = cartData.items.map(item => {
    const product = getProduct(item.sku);
    return {
      sku: item.sku,
      title: product?.title || 'Unknown',
      price: product?.price_usd || 0,
      qty: item.qty
    };
  });

  return Response.json({ items: enrichedItems, cart_token: newCartToken });
}
