import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { getProduct } from '@/lib/catalog';
import {
  signSessionToken,
  verifySessionToken,
  signPeacReceipt,
  verifyX402Proof,
  nowIso,
  type PeacReceiptPayload,
  type SessionToken
} from '@/lib/peac';
import { sha256Hex, getPublicOrigin } from '@/lib/utils';

export const runtime = 'nodejs';

const CHAIN = process.env.X402_CHAIN || 'base';
const CURRENCY = process.env.X402_CURRENCY || 'USDC';

type CartItem = {
  sku: string;
  qty: number;
};

const ORDER_CACHE = new Map<string, { order: Record<string, unknown>; receipt: string }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: 'missing_items', message: 'items array required' },
        { status: 400 }
      );
    }

    const normalizedItems: CartItem[] = items.map(item => ({
      sku: item.sku,
      qty: Number(item.qty) || 1
    }));

    const itemsStr = JSON.stringify(normalizedItems.sort((a, b) => a.sku.localeCompare(b.sku)));
    const itemsSha = sha256Hex(itemsStr);

    const enrichedItems = [];
    let grandTotal = 0;

    for (const item of normalizedItems) {
      const product = getProduct(item.sku);
      if (!product) {
        return Response.json(
          { error: 'invalid_sku', message: `Product ${item.sku} not found` },
          { status: 400 }
        );
      }
      enrichedItems.push({
        sku: item.sku,
        title: product.title,
        qty: item.qty,
        unit_price_usd: product.price_usd
      });
      grandTotal += item.qty * product.price_usd;
    }

    grandTotal = Number(grandTotal.toFixed(2));

    const proofId = request.headers.get('x-402-proof');
    const sessionToken = request.headers.get('x-402-session');
    const idempotencyKey = request.headers.get('idempotency-key');

    if (!proofId) {
      const sessionId = 'sess_' + nanoid(10);
      const session = {
        sid: sessionId,
        subject: `direct-checkout`,
        amount: grandTotal,
        currency: CURRENCY,
        chain: CHAIN,
        rail: 'x402' as const,
        issued_at: nowIso(),
        items_sha256: itemsSha
      };

      const signedSession = await signSessionToken(session);

      return Response.json(
        {
          error: 'payment_required',
          message: 'Pay via x402 and retry with proof',
          x402: {
            session_id: sessionId,
            amount_usd: grandTotal,
            currency: CURRENCY,
            chain: CHAIN
          },
          session_token: signedSession,
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

    if (!sessionToken) {
      return Response.json(
        { error: 'missing_session', message: 'X-402-Session header required' },
        { status: 400 }
      );
    }

    let session: SessionToken;
    try {
      session = await verifySessionToken(sessionToken);
    } catch {
      return Response.json(
        { error: 'invalid_session', message: 'Session token verification failed' },
        { status: 400 }
      );
    }

    if (session.items_sha256 !== itemsSha) {
      return Response.json(
        { error: 'items_mismatch', message: 'Items do not match session' },
        { status: 400 }
      );
    }

    if (idempotencyKey) {
      const cached = ORDER_CACHE.get(idempotencyKey);
      if (cached) {
        return new Response(JSON.stringify(cached.order), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'PEAC-Receipt': cached.receipt,
            'Access-Control-Expose-Headers': 'PEAC-Receipt',
            'Cache-Control': 'no-store'
          }
        });
      }
    }

    const verification = await verifyX402Proof(proofId, session.sid);
    if (!verification.valid) {
      return Response.json(
        {
          error: 'payment_invalid',
          message: 'Payment verification failed',
          x402: {
            session_id: session.sid,
            amount_usd: grandTotal,
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

    const orderId = 'ord_' + sha256Hex(session.sid + itemsSha).slice(0, 10);

    const order = {
      order_id: orderId,
      items: enrichedItems,
      totals: {
        subtotal: grandTotal,
        tax: 0,
        fees: 0,
        grand_total: grandTotal
      },
      created_at: nowIso()
    };

    const orderBodyStr = JSON.stringify(order);
    const bodyHash = sha256Hex(orderBodyStr);

    const aiprefResponse = await fetch(`${getPublicOrigin()}/aipref.json`);
    const aiprefSnapshot = await aiprefResponse.json();

    const receiptPayload: PeacReceiptPayload = {
      receipt_version: '0.9.18',
      issued_at: nowIso(),
      subject: 'order',
      request: {
        method: 'POST',
        path: '/api/shop/checkout-direct',
        query: ''
      },
      response: {
        status: 200,
        body_sha256: bodyHash
      },
      payment: {
        rail: 'x402',
        amount: grandTotal,
        currency: CURRENCY,
        chain: CHAIN,
        proof_id: proofId,
        session_id: session.sid,
        payer: verification.payer || 'unknown'
      },
      order: {
        order_id: order.order_id,
        items: enrichedItems,
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

    if (idempotencyKey) {
      ORDER_CACHE.set(idempotencyKey, { order, receipt: receiptJws });
    }

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
    console.error('Checkout-direct error:', checkoutError);
    return Response.json(
      { error: 'internal_error', message: 'Checkout failed' },
      { status: 500 }
    );
  }
}
