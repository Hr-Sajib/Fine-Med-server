# FineMed — Next Upgrade Plan

Architecture and scalability suggestions for taking this project from "working demo" to
"presentable and explainable in a mid-level full-stack / software engineer interview,"
written from a senior engineer / hiring manager perspective. Grounded in real issues found
while working in this codebase (a privilege-escalation bug, a payment-verification gap, a
stale-cache PII leak, a stock race condition, and several dependency/consistency issues).

## If you only have two weeks, do these six things

1. **Add tests.** This project has zero automated tests. At 1 YOE, "I write tests" is the
   single biggest thing that separates you from other mid-level candidates. You don't need
   90% coverage — pick the paths that matter: auth (login, token refresh, the role-escalation
   bug you can now write a regression test for), order creation (including the race condition
   below), and 3-5 Playwright/Cypress E2E flows (register → login → add to cart → checkout,
   admin CRUD). A repo with 15 well-chosen tests beats one with 0, every time.

2. **Fix (and be ready to talk about) the stock race condition.** `order.service.ts::createOrderIntoDB`
   does read-quantity → check → write-quantity as three separate steps. Two concurrent orders
   can both read `quantity: 1`, both pass the check, both decrement — you oversell. Fix it with
   an atomic `findOneAndUpdate({ _id, quantity: { $gte: qty } }, { $inc: { quantity: -qty } })`
   and reject if it returns null. This is a genuinely great "tell me about a bug you found"
   interview story — it's subtle, it's a real correctness issue, and the fix demonstrates you
   understand concurrency, not just CRUD.

3. **Actually verify the payment webhook.** Right now `payment-success/:transID` just trusts
   whatever the redirect says and flips the order to `processing`. Real SSLCommerz integrations
   call their `validate` API server-side and check the amount matches before trusting the
   callback. You don't need to fully build it out — even documenting "known limitation: IPN
   isn't cryptographically verified, here's what a real implementation needs" in the README
   shows you understand the difference between "it works in the demo" and "it's safe with real
   money."

4. **CI pipeline.** A GitHub Actions workflow that runs `tsc --noEmit`, `eslint`, and your new
   tests on every push. Maybe 20 minutes of work, and it's the first thing a hiring manager
   checks for on GitHub — a green checkmark says "this person ships professionally" before
   they've read a line of code.

5. **One-command local setup (Docker Compose).** Right now getting this running requires
   knowing to pin Node to 22.x (a hard crash occurs on Node 26 due to a JWT dependency), knowing
   which env vars matter, and no `docker-compose.yml` exists. A `docker-compose up` that starts
   Mongo + server + client tells an interviewer "I think about environment parity," and removes
   all friction from someone actually trying your project instead of just skimming the README.

6. **Rewrite the README as an engineering document, not a feature list.** Right now it's
   marketing copy ("frontend routes planned and under active development"). Replace it with: an
   architecture diagram (even a simple mermaid one), a "Known Limitations / Next Steps" section
   (payment verification, rate limiting coverage, caching), and a short "Engineering Decisions"
   section explaining *why* you chose Redux Toolkit + RTK Query, this auth strategy, this DB
   shape. Hiring managers skim repos in under two minutes — this is what gets read in that
   window, and self-awareness about limitations reads as far more senior than pretending
   everything's finished.

## The fuller list, by category

### Backend

- Structured logging (pino/winston) instead of scattered `console.log` — add request IDs for
  traceability
- Rate limiting beyond the one ad hoc limiter on `/send-mail` — apply to login (brute-force)
  and review/coupon endpoints (abuse)
- Add indexes for actual query patterns (e.g., `orders.userEmail`, `products.category`) — even
  just running `.explain()` on a few queries and writing up what you found is a good
  scalability talking point
- OpenAPI/Swagger spec for the API — signals you think about API-as-a-contract, useful for
  full-stack roles specifically
- Consistent pagination — `GET /users` currently returns everything, unbounded

### Frontend

- Component tests (Vitest + React Testing Library) for the trickier pieces — the
  `ProtectedRoute` role logic, the cart slice, the coupon generator
- Audit what else `redux-persist` is holding onto — the `allUsers` PII leak was fixed, but
  `orders` is still persisted; worth deciding deliberately rather than by default
- Dedupe `reveiwApi.ts` (typo'd file) vs `review/reviewApi.ts` — small, but "I found and cleaned
  up dead/duplicate code" is a real code-review skill to demonstrate
- Code-split heavy libraries (chart.js, swiper) so the public shop pages aren't shipping
  admin-dashboard weight
- An accessibility pass — keyboard nav through the floating coupon widget, focus trapping in
  modals, `aria-live` on toasts

### DevOps

- Env var validation at startup (a small Zod schema) instead of silently running with
  `undefined` values — stale Mongo/email credentials caused exactly this failure mode during
  development
- Secrets audit — the ImgBB key is still a plaintext literal in client source; move it
  server-side or to an env var
- Mention (even without building) error monitoring (Sentry) and a caching layer (Redis for the
  product catalog) as "next steps" — shows you know the next scaling step even if this project
  doesn't need it yet

### Presentation for interviews specifically

- Prepare 2-3 STAR-format stories from real bugs in *this* codebase: the privilege-escalation
  registration bug, the stock race condition, the stale-localStorage PII leak on the admin
  routes. These are concrete, technical, and yours — far stronger than "I built a CRUD app."
- A short demo GIF or screenshots in the README (bonus points if it shows the admin dashboard
  charts, not just the shop)

## One thing to deliberately *not* do

Don't reach for microservices, Kubernetes, or event-driven architecture on a solo portfolio
project at this stage. For a mid-level bar, that reads as resume-driven development rather than
judgment — a hiring manager will ask "why did a single-team CRUD app need this?" and there's no
good answer. The signal you want is: **tests, correctness under concurrency, security awareness,
clean docs, and knowing what you'd do next but haven't yet.** That's exactly what "ready for
mid-level" looks like from the other side of the table.
