import Link from 'next/link';

export default function McpIntegrationPage() {
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              MCP Integration Guide
            </h1>
            <p className="text-xl text-gray-600">
              How to use Coinbase Payments MCP with PEAC x402 APIs
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r-lg">
              <p className="text-lg font-semibold text-blue-900 mb-2">
                MCP pays. PEAC proves.
              </p>
              <p className="text-gray-700">
                Coinbase Payments MCP handles the payment infrastructure (wallets, onramps, x402 transactions).
                PEAC provides cryptographic receipts that prove what was delivered and under what policy.
              </p>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
              <p className="text-lg font-semibold text-amber-900 mb-2">
                MCP Convenience Headers vs Pure x402 v2
              </p>
              <p className="text-gray-700 mb-3">
                This demo uses <strong>MCP convenience headers</strong> (<code className="bg-amber-100 px-1 rounded">X-402-Session</code>, <code className="bg-amber-100 px-1 rounded">X-402-Proof</code>)
                for simpler agent integration. These are <em>in addition to</em> the standard x402 v2 flow.
              </p>
              <p className="text-gray-700 mb-3">
                <strong>Pure x402 v2 clients</strong> can use the standard <code className="bg-amber-100 px-1 rounded">Payment-Required</code> header
                (base64-encoded) which is also present in the 402 response. PEAC advertises receipt capability via
                the <code className="bg-amber-100 px-1 rounded">extensions.peac-receipts</code> field.
              </p>
              <p className="text-sm text-amber-800">
                Any standard x402 client can pay unchanged - the PEAC-Receipt header on success is optional/additive.
              </p>
            </div>

            {/* For Agents Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-brand">
                For Agents (Using MCP)
              </h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Installation</h3>
              <div className="code-block mb-6">
                <div className="text-green-400">npx @coinbase/payments-mcp</div>
              </div>
              <p className="text-gray-700 mb-6">
                This installs the Payments MCP server and wallet app. You&apos;ll need to:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
                <li>Sign in with email/OTP (creates embedded wallet)</li>
                <li>Fund your wallet with USDC via Coinbase Onramp</li>
                <li>Set spending limits (per-transaction and per-session)</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Expected 402 Response Format</h3>
              <p className="text-gray-700 mb-4">
                When your agent calls a PEAC-enabled x402 endpoint without payment, expect this 402 response:
              </p>
              <div className="code-block mb-6">
                <pre className="text-sm">{`{
  "error": "payment_required",
  "message": "Pay via x402 and retry with proof",
  "x402": {
    "session_id": "sess_abc123",
    "amount_usd": 0.01,
    "currency": "USDC",
    "chain": "base"
  },
  "session_token": "eyJhbGciOiJFZERTQSIs...",
  "peac": {
    "policy": "https://x402.peacprotocol.org/.well-known/peac.txt",
    "receipts": "required"
  }
}`}</pre>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Key Fields for MCP</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">x402.session_id</code> - Unique payment session identifier</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">x402.amount_usd</code> - Amount to pay in USD (e.g., 0.01)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">x402.currency</code> - Payment currency (USDC)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">x402.chain</code> - Blockchain network (base)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">session_token</code> - EdDSA-signed JWS to include in retry</li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Retry Headers After Payment</h3>
              <p className="text-gray-700 mb-4">
                After MCP completes the x402 payment, retry the request with these headers:
              </p>
              <div className="code-block mb-6">
                <pre className="text-sm">{`POST /api/shop/checkout-direct
Content-Type: application/json
X-402-Session: <session_token from 402 response>
X-402-Proof: <proof_id from MCP payment>
Idempotency-Key: order-<session_id>  (optional but recommended)

{
  "items": [{"sku": "sku_tea", "qty": 1}]
}`}</pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Reading the PEAC-Receipt</h3>
              <p className="text-gray-700 mb-4">
                On successful payment (200 OK), the response includes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Header:</strong> <code className="bg-gray-100 px-2 py-1 rounded">PEAC-Receipt</code> - EdDSA-signed JWS token</li>
                <li><strong>Body:</strong> Order details (order_id, items, totals, created_at)</li>
              </ul>

              <div className="code-block mb-6">
                <pre className="text-sm">{`HTTP/1.1 200 OK
PEAC-Receipt: eyJhbGciOiJFZERTQSIsImtpZCI6InBlYWMtZGVtby1rZXktMSIsInR5cCI6InBlYWMtcmVjZWlwdCtqd3MifQ...

{
  "order_id": "ord_abc123",
  "items": [...],
  "totals": { "grand_total": 0.01 },
  "created_at": "2025-10-26T14:00:00.000Z"
}`}</pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">Verifying Receipts</h3>
              <p className="text-gray-700 mb-4">
                Receipts are cryptographically signed JWS tokens. Verify them by calling:
              </p>
              <div className="code-block mb-6">
                <pre className="text-sm">{`POST /api/verify
Content-Type: application/json

{
  "receipt": "<PEAC-Receipt JWS token>"
}`}</pre>
              </div>
              <p className="text-gray-700 mb-6">
                Returns <code className="bg-gray-100 px-2 py-1 rounded">{`{"valid": true, "payload": {...}, "header": {...}}`}</code>
              </p>

              <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg">
                <p className="text-sm text-green-900">
                  <strong>Pro Tip:</strong> Store the PEAC-Receipt alongside your order data. It&apos;s portable - anyone can verify it
                  independently using the public key at <code className="bg-green-100 px-2 py-1 rounded">/public-keys/peac-demo-key-1.json</code>
                </p>
              </div>
            </section>

            {/* For Publishers Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-brand">
                For Publishers (Integrating PEAC)
              </h2>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">1. Discovery: peac.txt</h3>
              <p className="text-gray-700 mb-4">
                Create <code className="bg-gray-100 px-2 py-1 rounded">/.well-known/peac.txt</code> (≤20 lines) to advertise your capabilities:
              </p>
              <div className="code-block mb-6">
                <pre className="text-sm">{`# ≤20 lines, dev-phase: v0.9.27

preferences: /aipref.json
access_control: http-402
payments: [x402]

provenance: c2pa
receipts: required

verify: /api/verify
openapi: /api/openapi.json

public_keys: [{"kid":"your-key-1","alg":"EdDSA","key":"/public-keys/your-key-1.json"}]`}</pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">2. Emit 402 Responses</h3>
              <p className="text-gray-700 mb-4">
                When a request lacks payment proof, return <code className="bg-gray-100 px-2 py-1 rounded">402 Payment Required</code>:
              </p>
              <div className="code-block mb-6">
                <pre className="text-sm">{`HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "error": "payment_required",
  "x402": {
    "session_id": "sess_<random>",
    "amount_usd": 0.01,
    "currency": "USDC",
    "chain": "base"
  },
  "session_token": "<EdDSA-signed JWS with session details>",
  "peac": {
    "policy": "https://yoursite.com/.well-known/peac.txt",
    "receipts": "required"
  }
}`}</pre>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">3. Issue PEAC-Receipts</h3>
              <p className="text-gray-700 mb-4">
                After verifying payment (via x402 proof_id), return <code className="bg-gray-100 px-2 py-1 rounded">200 OK</code> with:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Header: <code className="bg-gray-100 px-2 py-1 rounded">PEAC-Receipt: &lt;EdDSA-signed JWS&gt;</code></li>
                <li>Body: Order/resource details (JSON)</li>
              </ul>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Receipt Payload Must Include</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">receipt_version</code> - e.g., &quot;0.9.27&quot;</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">issued_at</code> - ISO 8601 timestamp</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">subject</code> - e.g., &quot;order&quot;, &quot;article&quot;</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">payment.proof_id</code> - x402 proof identifier</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">payment.amount</code>, <code className="bg-gray-100 px-2 py-1 rounded">currency</code>, <code className="bg-gray-100 px-2 py-1 rounded">chain</code></li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">response.body_sha256</code> - SHA256 hash of response body</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">policy</code> - AIPREF snapshot (license, retention, etc.)</li>
                </ul>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">4. OpenAPI Discovery</h3>
              <p className="text-gray-700 mb-4">
                Provide <code className="bg-gray-100 px-2 py-1 rounded">/api/openapi.json</code> with:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
                <li>All endpoints (catalog, checkout, verify)</li>
                <li>402 and 200 response schemas</li>
                <li>Request/response examples</li>
              </ul>
              <p className="text-gray-700 mb-6">
                See our <Link href="/api/openapi.json" className="text-brand hover:text-brand-hover underline">reference OpenAPI spec</Link> for a complete example.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">5. Stateless Checkout Pattern</h3>
              <p className="text-gray-700 mb-4">
                For agent-friendly APIs, use a stateless checkout endpoint:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
                <li>Accept items array in request body (no cart session required)</li>
                <li>Return deterministic <code className="bg-gray-100 px-2 py-1 rounded">order_id</code> based on session</li>
                <li>Support <code className="bg-gray-100 px-2 py-1 rounded">Idempotency-Key</code> header for safe retries</li>
                <li>Expose <code className="bg-gray-100 px-2 py-1 rounded">PEAC-Receipt</code> header via <code className="bg-gray-100 px-2 py-1 rounded">Access-Control-Expose-Headers</code></li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-900">
                  <strong>Note:</strong> Our reference implementation at{' '}
                  <a href="https://github.com/peacprotocol/peac-x402-receipts-demo" className="underline" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                  {' '}includes full code for 402 handling, receipt generation, and verification.
                </p>
              </div>
            </section>

            {/* Resources Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-brand">
                Resources
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Payments MCP</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <a href="https://docs.cdp.coinbase.com/payments-mcp/welcome" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-hover underline">
                        Welcome to Payments MCP
                      </a>
                    </li>
                    <li>
                      <a href="https://docs.cdp.coinbase.com/x402/mcp-server" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-hover underline">
                        MCP Server with x402
                      </a>
                    </li>
                    <li>
                      <a href="https://github.com/coinbase/payments-mcp" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-hover underline">
                        GitHub Repository
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">PEAC Protocol</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <Link href="/.well-known/peac.txt" className="text-brand hover:text-brand-hover underline">
                        peac.txt Spec
                      </Link>
                    </li>
                    <li>
                      <Link href="/api/openapi.json" className="text-brand hover:text-brand-hover underline">
                        OpenAPI Reference
                      </Link>
                    </li>
                    <li>
                      <Link href="/aipref.json" className="text-brand hover:text-brand-hover underline">
                        AIPREF Policy Document
                      </Link>
                    </li>
                    <li>
                      <a href="https://github.com/peacprotocol/peac-x402-receipts-demo" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-hover underline">
                        Reference Implementation
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <div className="bg-gradient-to-r from-brand/10 to-purple-100 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Build?
              </h3>
              <p className="text-gray-700 mb-6">
                Try our live demo or explore the headless buyer agent code.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/shop" className="btn-primary">
                  Try Shop Demo
                </Link>
                <Link href="/verify/offline" className="btn-secondary">
                  Verify Receipt
                </Link>
                <a
                  href="https://github.com/peacprotocol/peac-x402-receipts-demo/tree/main/agents/headless-buyer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  View Agent Code
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
