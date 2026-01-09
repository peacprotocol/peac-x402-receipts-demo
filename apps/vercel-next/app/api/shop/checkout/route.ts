// app/api/shop/checkout/route.ts
import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { getProduct } from '@/lib/catalog';
import {
  signSessionToken,
  verifySessionToken,
  signPeacReceipt,
  verifyX402Proof,
  verifyCartToken,
  nowIso,
  type PeacReceiptPayload
} from '@/lib/peac';
import { sha256Hex, getPublicOrigin } from '@/lib/utils';

export const runtime = 'nodejs';

const CHAIN = process.env.X402_CHAIN || 'base';
const CURRENCY = process.env.X402_CURRENCY || 'USDC';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cart_id, cart_token } = body || {};

    if (!cart_id) {
      return Response.json(
        { error: 'missing_cart_id' },
        { status: 400 }
      );
    }

    if (!cart_token) {
      return Response.json(
        { error: 'missing_cart_token', message: 'Cart token required for checkout' },
        { status: 400 }
      );
    }

    // Verify cart token (stateless cart)
    let cartData;
    try {
      cartData = await verifyCartToken(cart_token);
    } catch {
      return Response.json(
        { error: 'invalid_cart_token', message: 'Cart token verification failed' },
        { status: 400 }
      );
    }

    if (cartData.cart_id !== cart_id) {
      return Response.json(
        { error: 'cart_id_mismatch', message: 'Cart ID does not match token' },
        { status: 400 }
      );
    }

    if (!cartData.items || cartData.items.length === 0) {
      return Response.json(
        { error: 'empty_cart', message: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate totals from cart token data
    const items = cartData.items.map(item => {
      const product = getProduct(item.sku);
      return {
        sku: item.sku,
        qty: item.qty,
        unit_price_usd: product?.price_usd || 0
      };
    });

    const subtotal = Number(
      items.reduce((sum, item) => sum + item.qty * item.unit_price_usd, 0).toFixed(2)
    );
    const tax = 0;
    const fees = 0;
    const grand_total = subtotal;

    // Check for payment proof
    const proof_id = request.headers.get('x-402-proof');
    const session_token = request.headers.get('x-402-session');

    // No proof → return 402 with stateless session token
    if (!proof_id) {
      const session = {
        sid: 'sess_' + nanoid(10),
        subject: `cart:${cart_id}`,
        amount: grand_total,
        currency: CURRENCY,
        chain: CHAIN,
        rail: 'x402' as const,
        issued_at: nowIso()
      };

      const signed_session = await signSessionToken(session);

      return Response.json(
        {
          error: 'payment_required',
          message: 'Pay via x402 and retry with proof',
          x402: {
            session_id: session.sid,
            amount_usd: grand_total,
            currency: CURRENCY,
            chain: CHAIN,
            facilitator_verify: !!process.env.FACILITATOR_VERIFY_URL
          },
          session_token: signed_session,
          peac: {
            policy: `${getPublicOrigin()}/.well-known/peac.txt`,
            receipts: 'required'
          }
        },
        {
          status: 402,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // With proof → verify session token + x402 proof
    if (!session_token) {
      return Response.json(
        { error: 'missing_session', message: 'X-402-Session header required' },
        { status: 400 }
      );
    }

    // Verify session token
    let session;
    try {
      session = await verifySessionToken(session_token);
    } catch {
      return Response.json(
        { error: 'invalid_session', message: 'Session token verification failed' },
        { status: 400 }
      );
    }

    // Verify x402 proof with facilitator
    const verification = await verifyX402Proof(proof_id, session.sid);
    if (!verification.valid) {
      return Response.json(
        {
          error: 'payment_invalid',
          message: 'Payment verification failed',
          x402: {
            session_id: session.sid,
            amount_usd: grand_total,
            currency: CURRENCY,
            chain: CHAIN
          }
        },
        {
          status: 402,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Payment verified → create order
    const order = {
      order_id: 'ord_' + nanoid(8),
      items,
      totals: {
        subtotal,
        tax,
        fees,
        grand_total
      },
      created_at: nowIso()
    };

    const orderBodyStr = JSON.stringify(order);
    const bodyHash = sha256Hex(orderBodyStr);

    // Fetch aipref snapshot
    const aiprefResponse = await fetch(`${getPublicOrigin()}/aipref.json`);
    const aiprefSnapshot = await aiprefResponse.json();

    // Create PEAC receipt
    const receiptPayload: PeacReceiptPayload = {
      receipt_version: '0.9.27',
      issued_at: nowIso(),
      subject: 'order',
      request: {
        method: 'POST',
        path: '/api/shop/checkout',
        query: ''
      },
      response: {
        status: 200,
        body_sha256: bodyHash
      },
      payment: {
        rail: 'x402',
        amount: grand_total,
        currency: CURRENCY,
        chain: CHAIN,
        proof_id,
        session_id: session.sid,
        payer: verification.payer || 'unknown'
      },
      order: {
        order_id: order.order_id,
        items,
        totals: order.totals
      },
      policy: {
        aipref_url: `${getPublicOrigin()}/aipref.json`,
        aipref_snapshot: aiprefSnapshot
      },
      provenance: {
        c2pa: null
      },
      verify_url: `${getPublicOrigin()}/api/verify`
    };

    const receiptJws = await signPeacReceipt(receiptPayload);

    // Return order with PEAC-Receipt header
    return new Response(orderBodyStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'PEAC-Receipt': receiptJws,
        'Access-Control-Expose-Headers': 'PEAC-Receipt',
        'Cache-Control': 'no-store'
      }
    });
  } catch (checkoutError) {
    console.error('Checkout error:', checkoutError);
    return Response.json(
      { error: 'internal_error', message: 'Checkout failed' },
      { status: 500 }
    );
  }
}
