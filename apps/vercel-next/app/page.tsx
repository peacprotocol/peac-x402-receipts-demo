import Link from 'next/link';
import CopyButton from './components/CopyButton';

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-gray-900 font-bold text-xl">
            PEAC × x402
          </div>
          <div className="flex gap-6 items-center">
            <Link
              href="/.well-known/peac.txt"
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              peac.txt
            </Link>
            <Link
              href="/verify/offline"
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Verify
            </Link>
            <Link
              href="/shop"
              className="btn-primary"
            >
              Try Demo
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6">
        <section className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Verifiable Receipts for
            <br />
            <span className="text-brand">Paid API Calls</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            Every <code className="bg-gray-100 px-2 py-1 rounded text-brand font-mono text-base">200 OK</code> comes with a cryptographic receipt.
            <br />
            Pay with x402 (Base/USDC) → Get proof of what you bought, from whom, under which policy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/shop" className="btn-primary text-base">
              Try Shop Demo
            </Link>
            <Link href="#for-agents" className="btn-secondary text-base">
              Agent API
            </Link>
            <Link
              href="#how-it-works"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              How It Works
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            <a
              href="https://peacprotocol.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand transition-colors"
            >
              PEAC Protocol
            </a>
            <span>·</span>
            <Link href="/.well-known/peac.txt" className="hover:text-brand transition-colors">
              peac.txt
            </Link>
            <span>·</span>
            <Link href="/aipref.json" className="hover:text-brand transition-colors">
              AIPREF
            </Link>
            <span>·</span>
            <Link href="/api/openapi.json" className="hover:text-brand transition-colors">
              OpenAPI
            </Link>
            <span>·</span>
            <a
              href="https://github.com/peacprotocol/peac-x402-receipts-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand transition-colors"
            >
              GitHub
            </a>
          </div>
        </section>

        <section className="max-w-6xl mx-auto py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-8">
              <div className="text-3xl font-bold text-brand mb-3">HTTP 402</div>
              <div className="text-gray-600 text-sm">Payment Required → x402 → Receipt</div>
            </div>
            <div className="card p-8">
              <div className="text-3xl font-bold text-brand mb-3">EdDSA</div>
              <div className="text-gray-600 text-sm">Cryptographically signed receipts</div>
            </div>
            <div className="card p-8">
              <div className="text-3xl font-bold text-brand mb-3">Base/USDC</div>
              <div className="text-gray-600 text-sm">On-chain payments, verifiable proofs</div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="max-w-5xl mx-auto py-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                title: 'Discovery',
                description: 'Agent reads /.well-known/peac.txt to learn payment options, receipt policy, and public keys'
              },
              {
                step: '2',
                title: 'HTTP 402',
                description: 'API returns 402 Payment Required with session_id and amount (e.g., $0.05 USDC)'
              },
              {
                step: '3',
                title: 'Pay via x402',
                description: 'Agent pays on Base with USDC, gets proof_id from facilitator'
              },
              {
                step: '4',
                title: 'Get Receipt',
                description: '200 OK with PEAC-Receipt header: cryptographic proof of purchase, verifiable forever'
              }
            ].map((item) => (
              <div key={item.step} className="card p-6">
                <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="for-agents" className="max-w-5xl mx-auto py-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-6">
            Agent-to-Agent Commerce
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Autonomous agents can discover, purchase, and verify digital goods using machine-readable APIs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Discovery</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Start with <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">/.well-known/peac.txt</code> to learn payment options and policies.
              </p>
              <Link
                href="/.well-known/peac.txt"
                className="text-brand hover:text-brand-hover text-sm font-medium"
              >
                View peac.txt →
              </Link>
            </div>

            <div className="card p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">OpenAPI Spec</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Complete API documentation with schemas, endpoints, and examples.
              </p>
              <Link
                href="/api/openapi.json"
                className="text-brand hover:text-brand-hover text-sm font-medium"
              >
                View OpenAPI →
              </Link>
            </div>

            <div className="card p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Documentation</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                curl examples, headless buyer agent code, receipt format details.
              </p>
              <a
                href="https://github.com/peacprotocol/peac-x402-receipts-demo/blob/main/docs/AGENT_TO_AGENT.md"
                className="text-brand hover:text-brand-hover text-sm font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Docs →
              </a>
            </div>
          </div>

          <div className="card p-8 border-2 border-brand/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Stateless Checkout Endpoint</h3>
                <p className="text-gray-900 mt-2 font-mono text-sm">
                  POST /api/shop/checkout-direct
                </p>
              </div>
              <CopyButton
                text={`curl -X POST https://x402.peacprotocol.org/api/shop/checkout-direct -H "Content-Type: application/json" -d '{"items":[{"sku":"sku_tea","qty":1}]}'`}
                label="Copy curl"
              />
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              No cart state required. Send items array, get 402 → pay via x402 → retry with proof → receive cryptographic receipt.
            </p>
            <div className="code-block">
              <div className="mb-2 text-gray-400"># Step 1: Attempt checkout</div>
              <div className="text-green-400">curl -X POST /api/shop/checkout-direct \</div>
              <div className="text-green-400 ml-4">  -d {`'{"items":[{"sku":"sku_tea","qty":1}]}'`}</div>
              <div className="mt-4 mb-2 text-gray-400"># Step 2: Get session_id from 402 response, pay via x402</div>
              <div className="mt-4 mb-2 text-gray-400"># Step 3: Retry with proof</div>
              <div className="text-cyan-400">curl -X POST /api/shop/checkout-direct \</div>
              <div className="text-cyan-400 ml-4">  -H {`"X-402-Session: $TOKEN"`} \</div>
              <div className="text-cyan-400 ml-4">  -H {`"X-402-Proof: $PROOF_ID"`} \</div>
              <div className="text-cyan-400 ml-4">  -d {`'{"items":[{"sku":"sku_tea","qty":1}]}'`}</div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto py-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Works with Coinbase Payments MCP
              </h2>
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">NEW</span>
            </div>

            <p className="text-lg text-gray-700 text-center mb-8 leading-relaxed">
              <strong>MCP pays. PEAC proves.</strong> Coinbase Payments MCP equips agents with wallets and x402 payment capability.
              Our API issues cryptographic receipts that prove what agents bought - portable, policy-bound, and independently verifiable.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Install Payments MCP</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm mb-4">
                  npx @coinbase/payments-mcp
                </div>
                <p className="text-gray-600 text-sm">
                  Give your agents an embedded wallet, USDC onramp, and automatic x402 payment capability.
                  Works with Claude Desktop, Gemini CLI, and any MCP-compatible client.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Integration Flow</h3>
                <ol className="text-sm text-gray-700 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">1.</span>
                    <span>Agent calls <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/api/shop/checkout-direct</code></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">2.</span>
                    <span>Receives 402 Payment Required</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">3.</span>
                    <span><strong>MCP pays automatically</strong> via x402 (USDC on Base)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">4.</span>
                    <span>Agent retries with proof</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">5.</span>
                    <span>Receives 200 OK + <strong>PEAC-Receipt</strong> (EdDSA-signed JWS)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">6.</span>
                    <span>Receipt proves: payment made, content delivered, policy bound</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3">Try It in Claude Desktop</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 font-mono">
                  &gt; &quot;Buy 1 tea from https://x402.peacprotocol.org/api/shop/checkout-direct and show me the receipt&quot;
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                With Payments MCP installed, Claude will automatically discover payment requirements, pay via x402,
                and receive the cryptographic PEAC-Receipt - all autonomously.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href="https://docs.cdp.coinbase.com/payments-mcp/welcome"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Payments MCP Docs →
                </a>
                <a
                  href="https://docs.cdp.coinbase.com/x402/mcp-server"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  MCP Server with x402 →
                </a>
                <Link
                  href="/docs/mcp-integration"
                  className="text-brand hover:text-brand-hover font-medium underline"
                >
                  Integration Guide →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto py-20">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Why PEAC Receipts?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Portable Proofs',
                description: 'Receipts are self-contained JWS tokens. Verify anywhere with the public key.'
              },
              {
                title: 'Policy-Bound',
                description: 'Every receipt embeds the AIPREF snapshot: license terms, retention, refund policy.'
              },
              {
                title: 'Content Integrity',
                description: 'Response body SHA256 hash proves you got exactly what you paid for.'
              },
              {
                title: 'Rail-Agnostic',
                description: 'x402 today. Same receipt format works with any future payment rail.'
              }
            ].map((feature) => (
              <div key={feature.title} className="card p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto py-20 text-center">
          <div className="card p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Try It Now
            </h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Complete a real checkout with $0.05 USDC demo payment,
              <br />
              get a cryptographic receipt, verify it instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop" className="btn-primary text-base">
                Open Shop Demo
              </Link>
              <Link href="/verify/offline" className="btn-secondary text-base">
                Verify Offline
              </Link>
            </div>
          </div>
        </section>

        <footer className="max-w-5xl mx-auto py-12 border-t border-gray-200 text-center text-gray-500">
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-6">
            <Link href="/.well-known/peac.txt" className="hover:text-gray-900 transition-colors text-sm">
              peac.txt
            </Link>
            <Link href="/aipref.json" className="hover:text-gray-900 transition-colors text-sm">
              aipref.json
            </Link>
            <Link href="/api/openapi.json" className="hover:text-gray-900 transition-colors text-sm">
              openapi.json
            </Link>
            <Link href="/api/verify" className="hover:text-gray-900 transition-colors text-sm">
              /api/verify
            </Link>
            <a
              href="https://github.com/peacprotocol/peac-x402-receipts-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors text-sm"
            >
              GitHub
            </a>
            <a
              href="https://github.com/peacprotocol/peac-x402-receipts-demo/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors text-sm"
            >
              Apache-2.0
            </a>
          </div>
          <p className="text-sm mb-4">
            PEAC Protocol v0.9.27 · Demo amounts: $0.01-$0.05 USDC on Base
          </p>
          <p className="text-xs text-gray-400 max-w-2xl mx-auto leading-relaxed">
            <a
              href="https://peacprotocol.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              PEAC Protocol
            </a>
            {' '}is an open-source project stewarded by{' '}
            <a
              href="https://www.originary.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Originary
            </a>
            {' '}and the broader open-source community.
            <br />
            <a
              href="https://github.com/peacprotocol/peac/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Contribution guidelines
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
