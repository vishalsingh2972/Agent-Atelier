# WebMCP Testing Environment

This document describes the database configuration, safety boundaries, and execution procedures for the Bridge to Agentia test infrastructure.

## Database Safety Boundary

The test infrastructure distinguishes between two database classes to prevent accidental data loss:

| Class | Environment Variable | Permitted Use |
|-------|---------------------|--------------|
| Application / Development | `DATABASE_URL` | Local development, manual testing, deployed runtime |
| Disposable Integration | `TEST_DATABASE_URL` | Migration, seed/reset, and integration test execution |

### Safety Gates

Integration commands enforce the following preconditions:

1. `WEBMCP_TEST_DATABASE=true` must be set. Without this, integration commands refuse to execute.
2. A distinct `TEST_DATABASE_URL` is required by default. To reuse `DATABASE_URL`, set `WEBMCP_ALLOW_SHARED_DATABASE=true` as an explicit acknowledgement that the integration runner will reset and reseed the database.
3. The broad integration suite additionally requires `WEBMCP_RUN_INTEGRATION=true`, which the dedicated runner sets automatically. This ensures `npm test` remains database-free even when shared-database permission is configured locally.

## Setup

1. **Recommended**: Create a separate Neon database branch for integration testing.
   **Alternative**: Set `WEBMCP_ALLOW_SHARED_DATABASE=true` if the database contains only disposable demo data.
2. Copy `.env.test.example` to `.env.test` (git-ignored) and populate the required variables.
3. Verify the configuration: `npm run db:test:verify`.
4. Execute integration tests: `npm run test:webmcp:integration`.

The integration runner applies tracked migrations, resets the target database, seeds it with standard demo data, and then executes the test suite. It destructively resets whichever database is selected.

## Reproducible Local Verification

```bash
npm install
npm test                              # 90 deterministic tests (no database)
npm run eval:webmcp                   # 16 eval case schema validation (no database)
npm run db:test:verify                # Verify database configuration
npm run test:webmcp:integration       # 23 integration tests (requires database)
npm run dev                           # Start application for E2E and manual testing
npm run test:webmcp:e2e              # 7 browser E2E specs (requires running app)
```

## Deterministic Test Coverage

The database-free Vitest suites validate the complete 34-tool inventory through the exported `webmcpTools` list:

| Concern | Coverage |
|---------|----------|
| Request contracts | Every tool's relative endpoint, HTTP method, encoded identifiers, and JSON request body |
| Input validation | Required fields, type checking, integer validation, enum constraints, and min/max bounds |
| Authentication | Every protected tool is hidden from guest discovery and rejected before execution |
| Security Defenses | PII response redaction, prompt injection defense, indirect injection sanitization, audit logging |
| API failure forwarding | Every tool correctly returns structured error payloads from upstream API responses |
| State mutations | Cart, wishlist, order, and address tools use explicit HTTP methods and request bodies |
| Multi-step journeys | Four journey sequences (A–D) validated through sequential tool execution |
| Failure modes | 18 failure scenarios covering wrong order, wrong arguments, missing data, network failures, and mid-chain failures |
| Auth tools | Request contracts, response formats, registry integration for all 4 auth tools |

These tests use generic runtime identifiers and inputs. Catalog-specific fixtures remain in the seed data and integration suite.

## Environment Record

| Component | Version |
|-----------|---------|
| Node.js | 20+ (see `netlify.toml`) |
| Framework | Next.js 14, React 18 |
| ORM | Prisma 5 |
| Database | PostgreSQL (Neon) |
| Deterministic runner | Vitest 2 |
| Browser E2E runner | Playwright |
| Browser | Chrome with `chrome://flags/#enable-webmcp-testing` enabled |
| LLM evaluations | OpenAI Responses API via `npm run eval:webmcp:llm` (requires `OPENAI_API_KEY`) |
