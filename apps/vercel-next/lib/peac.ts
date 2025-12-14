// lib/peac.ts - PEAC protocol utilities
import { SignJWT, jwtVerify, importJWK, type JWK } from 'jose';

export type Money = {
  amount: number;
  currency: string;
  chain: string;
  rail: 'x402'
};

export type AIPref = Record<string, unknown>;

export type SessionToken = {
  sid: string;
  subject: string;
  amount: number;
  currency: string;
  chain: string;
  rail: 'x402';
  issued_at: string;
  items_sha256?: string;
};

export type PeacReceiptPayload = {
  receipt_version: string;
  issued_at: string;
  subject: string;
  request: {
    method: string;
    path: string;
    query: string;
  };
  response: {
    status: number;
    body_sha256: string;
  };
  payment: {
    rail: 'x402';
    amount: number;
    currency: string;
    chain: string;
    proof_id: string;
    session_id: string;
    payer: string;
  };
  order?: Record<string, unknown>;
  policy: {
    aipref_url: string;
    aipref_snapshot: AIPref;
  };
  provenance: {
    c2pa: null;
  };
  verify_url: string;
};

export async function getSigner() {
  const jwk = JSON.parse(process.env.PEAC_SIGNING_JWK!);
  return importJWK(jwk, 'EdDSA');
}

export function getKid() {
  return process.env.PEAC_KID || 'peac-demo-key-1';
}

export function getPublicJWK(): JWK {
  const jwk = JSON.parse(process.env.PEAC_SIGNING_JWK!);
  const publicJwk = { ...jwk };
  delete publicJwk.d;
  return {
    ...publicJwk,
    kid: getKid(),
    alg: 'EdDSA',
    use: 'sig'
  };
}

export function nowIso() {
  return new Date().toISOString();
}

export async function signPeacReceipt(payload: PeacReceiptPayload): Promise<string> {
  const signer = await getSigner();
  return await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'EdDSA', kid: getKid(), typ: 'peac-receipt+jws' })
    .sign(signer);
}

export async function verifyPeacReceipt(jws: string, jwkPub: JWK) {
  const pub = await importJWK(jwkPub, 'EdDSA');
  return await jwtVerify(jws, pub, { algorithms: ['EdDSA'] });
}

// Stateless 402 session token (JWS)
export async function signSessionToken(session: SessionToken): Promise<string> {
  const signer = await getSigner();
  return await new SignJWT(session as Record<string, unknown>)
    .setProtectedHeader({ alg: 'EdDSA', kid: getKid(), typ: 'peac-session+jws' })
    .sign(signer);
}

export async function verifySessionToken(jws: string): Promise<SessionToken> {
  const pub = getPublicJWK();
  const { payload } = await jwtVerify(jws, await importJWK(pub, 'EdDSA'), {
    algorithms: ['EdDSA']
  });
  return payload as SessionToken;
}

// Stateless cart token (serverless-friendly)
export type CartToken = {
  cart_id: string;
  items: Array<{ sku: string; qty: number }>;
  created_at: string;
};

export async function signCartToken(cart: CartToken): Promise<string> {
  const signer = await getSigner();
  return await new SignJWT(cart as Record<string, unknown>)
    .setProtectedHeader({ alg: 'EdDSA', kid: getKid(), typ: 'peac-cart+jws' })
    .sign(signer);
}

export async function verifyCartToken(jws: string): Promise<CartToken> {
  const pub = getPublicJWK();
  const { payload } = await jwtVerify(jws, await importJWK(pub, 'EdDSA'), {
    algorithms: ['EdDSA']
  });
  return payload as unknown as CartToken;
}

export async function verifyX402Proof(proof_id: string, session_id: string): Promise<{
  valid: boolean;
  payer?: string;
  amount?: number;
  currency?: string;
  chain?: string;
}> {
  // Demo mode
  if (process.env.DEMO_MODE === 'true') {
    const demoToken = process.env.DEMO_TOKEN || 'demo-pay-ok-123';
    return {
      valid: proof_id === demoToken,
      payer: 'demo-payer'
    };
  }

  // Real x402 facilitator verification
  const url = process.env.FACILITATOR_VERIFY_URL;
  const key = process.env.FACILITATOR_API_KEY;

  if (!url || !key) {
    console.warn('Facilitator not configured');
    return { valid: false };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({ session_id, proof_id })
    });

    if (!response.ok) {
      return { valid: false };
    }

    return await response.json();
  } catch (error) {
    console.error('Facilitator verification error:', error);
    return { valid: false };
  }
}
