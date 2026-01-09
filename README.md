# PEAC × x402: Verifiable Receipts for Paid API Calls

**Live Demo:** [x402.peacprotocol.org](https://x402.peacprotocol.org)

Every `200 OK` with a cryptographic receipt. Pay with x402 (Base/USDC) and get portable proof of purchase.

## Overview

This repository demonstrates **HTTP 402 Payment Required** combined with **PEAC receipts** to create verifiable proof-of-purchase for API interactions. Perfect for agent-to-agent commerce, micropayments, and auditable AI workflows.

### Key Features

- **HTTP 402 Payments**: Standards-compliant payment-required responses
- **x402 Integration**: On-chain payments via Base/USDC
- **Cryptographic Receipts**: EdDSA-signed JWS tokens
- **Policy-Bound**: Embeds AIPREF snapshot (license, retention, terms)
- **Stateless Sessions**: No database required, serverless-friendly
- **Offline Verification**: Anyone can verify receipts with public key

## Quick Start

```bash
# Try the Express demo locally
cd apps/express-demo
npm install
npm run dev
# Visit http://localhost:8787/shop
```

## Repository Structure

```
/apps
  /express-demo      # Node.js/Express demo (video recording)
  /vercel-next       # Next.js 15 production app (Vercel deploy)
/docs
  demo-shotlist.md   # Recording script
  receipts-spec.md   # PEAC-Receipt JWS schema
LICENSE (Apache-2.0)
README.md
```

## How It Works

1. **Discovery**: Agent reads `/.well-known/peac.txt` to learn payment options
2. **HTTP 402**: API returns `402 Payment Required` with `session_id` and amount
3. **Pay**: Agent pays via x402 (Base/USDC), receives `proof_id`
4. **Receipt**: Retry with proof → `200 OK` + `PEAC-Receipt` header (JWS)
5. **Verify**: Anyone can verify receipt using public key from `peac.txt`

## PEAC Receipt Structure

```json
{
  "receipt_version": "0.9.27",
  "issued_at": "2025-01-15T12:00:00Z",
  "subject": "order",
  "request": {"method": "POST", "path": "/api/shop/checkout"},
  "response": {"status": 200, "body_sha256": "abc123..."},
  "payment": {
    "rail": "x402",
    "amount": 0.05,
    "currency": "USDC",
    "chain": "base",
    "proof_id": "...",
    "session_id": "...",
    "payer": "0x..."
  },
  "order": {...},
  "policy": {
    "aipref_url": "/aipref.json",
    "aipref_snapshot": {...}
  },
  "provenance": {"c2pa": null},
  "verify_url": "/api/verify"
}
```

## Testing

### Test 402 Challenge

```bash
curl https://x402.peacprotocol.org/api/shop/checkout \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"cart_xyz"}' | jq .
```

### Test with Demo Token

```bash
curl -i https://x402.peacprotocol.org/api/shop/checkout \
  -H "Content-Type: application/json" \
  -H "X-402-Session: <session_token>" \
  -H "X-402-Proof: demo-pay-ok-123" \
  -d '{"cart_id":"cart_xyz"}'
```

### Verify Receipt

```bash
curl -X POST https://x402.peacprotocol.org/api/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt":"<JWS>"}' | jq .
```

## Deploy to Vercel

See [apps/vercel-next/README.md](apps/vercel-next/README.md) for deployment instructions.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PEAC_SIGNING_JWK` | ✅ | Private Ed25519 JWK for signing |
| `PEAC_KID` | ✅ | Key ID (e.g., `peac-prod-key-1`) |
| `DEMO_MODE` | ✅ | `true` for demo, `false` for production |
| `X402_CHAIN` | ✅ | Blockchain (e.g., `base`) |
| `X402_CURRENCY` | ✅ | Currency (e.g., `USDC`) |
| `FACILITATOR_VERIFY_URL` | Production | x402 facilitator endpoint |
| `FACILITATOR_API_KEY` | Production | Facilitator API key |
| `PUBLIC_ORIGIN` | ✅ | Public URL |

## Security

- Private keys stored in environment variables only
- EdDSA (Ed25519) signatures
- Session tokens are time-bound
- Payment proof verified before issuing receipt
- No secrets in client code

## Specification

- **PEAC Protocol**: v0.9.27
- **Payment Rail**: x402 v2 (HTTP 402 + on-chain verification)
- **Signature**: EdDSA (Ed25519)
- **Receipt Format**: JWS (JSON Web Signature)
- **x402 Extension**: `extensions.peac-receipts` for receipt discovery

## Resources

- [PEAC Protocol](https://peacprotocol.org)
- [x402 Documentation](https://x402.org)
- [HTTP 402 (RFC 9110)](https://www.rfc-editor.org/rfc/rfc9110.html#status.402)

## License

Apache-2.0 - See [LICENSE](LICENSE) for details

## Contributing

Contributions welcome! Please open an issue or pull request.

---

**Built with Next.js 15, TypeScript, and Tailwind CSS**

---

**Project Stewardship:** PEAC Protocol is an open-source project stewarded by Originary and the broader open-source community.

**Contribution Guidelines:** https://github.com/peacprotocol/peac/blob/main/CONTRIBUTING.md
