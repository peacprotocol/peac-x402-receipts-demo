// app/.well-known/peac.txt/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-static';

export async function GET() {
  const kid = process.env.PEAC_KID || 'peac-demo-key-1';

  const lines = [
    '# ≤20 lines, dev-phase: v0.9.18',
    'preferences: /aipref.json',
    'access_control: http-402',
    'payments: [x402]',
    'provenance: c2pa',
    'receipts: required',
    'verify: /api/verify',
    'openapi: /api/openapi.json',
    `public_keys: [{"kid":"${kid}","alg":"EdDSA","key":"/public-keys/${kid}.json"}]`
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
