// app/api/shop/cart/route.ts
import { nanoid } from 'nanoid';
import { signCartToken, nowIso } from '@/lib/peac';

export const runtime = 'nodejs';

export async function POST() {
  const cart_id = 'cart_' + nanoid(10);

  // Create stateless cart token (serverless-friendly)
  const cartData = {
    cart_id,
    items: [] as Array<{ sku: string; qty: number }>,
    created_at: nowIso()
  };

  const cart_token = await signCartToken(cartData);

  return Response.json({
    cart_id,
    items: [],
    cart_token
  });
}
