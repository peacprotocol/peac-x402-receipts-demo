export const runtime = 'nodejs';
export const dynamic = 'force-static';

export async function GET() {
  const spec = {
    openapi: '3.0.1',
    info: {
      title: 'PEAC x402 Demo API',
      version: '0.9.27',
      description: 'Agent-to-agent commerce with HTTP 402 payments and cryptographic receipts'
    },
    servers: [
      {
        url: 'https://x402.peacprotocol.org',
        description: 'Production'
      }
    ],
    paths: {
      '/api/shop/catalog': {
        get: {
          summary: 'Get product catalog',
          responses: {
            '200': {
              description: 'Catalog items',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            sku: { type: 'string' },
                            title: { type: 'string' },
                            price_usd: { type: 'number' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/shop/checkout-direct': {
        post: {
          summary: 'Stateless agent checkout',
          description: 'Direct checkout without cart state. Returns 402 for payment, then 200 with PEAC-Receipt',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          sku: { type: 'string' },
                          qty: { type: 'number' }
                        },
                        required: ['sku', 'qty']
                      }
                    }
                  },
                  required: ['items']
                }
              }
            }
          },
          responses: {
            '402': {
              description: 'Payment Required (x402)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      x402: {
                        type: 'object',
                        properties: {
                          session_id: { type: 'string' },
                          amount_usd: { type: 'number' },
                          currency: { type: 'string' },
                          chain: { type: 'string' }
                        }
                      },
                      session_token: { type: 'string', description: 'JWS token for retry' }
                    }
                  }
                }
              }
            },
            '200': {
              description: 'Order complete with PEAC-Receipt',
              headers: {
                'PEAC-Receipt': {
                  description: 'Cryptographic receipt (JWS)',
                  schema: { type: 'string' }
                }
              },
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      order_id: { type: 'string' },
                      items: { type: 'array' },
                      totals: { type: 'object' },
                      created_at: { type: 'string' }
                    }
                  }
                }
              }
            }
          },
          parameters: [
            {
              name: 'X-402-Session',
              in: 'header',
              description: 'Session token from 402 response',
              schema: { type: 'string' }
            },
            {
              name: 'X-402-Proof',
              in: 'header',
              description: 'Payment proof ID',
              schema: { type: 'string' }
            },
            {
              name: 'Idempotency-Key',
              in: 'header',
              description: 'Optional idempotency key for safe retries',
              schema: { type: 'string' }
            }
          ]
        }
      },
      '/api/verify': {
        post: {
          summary: 'Verify PEAC receipt',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    receipt: { type: 'string', description: 'PEAC-Receipt JWS token' }
                  },
                  required: ['receipt']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Verification result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean' },
                      payload: { type: 'object' },
                      header: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return Response.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
