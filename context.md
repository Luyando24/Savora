## **Project Context (read this fully before writing any code)**

We are building a web app for village banking groups and cooperatives in Zambia — chilimba/savings circles, agricultural cooperatives, and SACCOs (credit cooperatives). The app digitizes what's currently done on paper: member registries, contribution tracking, loan tracking, and payouts.

**Key product facts that should shape every design and engineering decision:**

* Users are Zambian group treasurers, secretaries, and ordinary members — many are not highly technical. The interface must be clear, forgiving, and low-jargon. Avoid finance/tech jargon in the UI; use the vocabulary a treasurer already uses (e.g. "contribution," "cycle," "payout," not "transaction batch" or "ledger entry").  
* Identity is phone-number-based — phone numbers are the primary key for members, because that's what ties to mobile money.  
* Payments run through MTN Mobile Money and Airtel Money via Request-to-Pay (collections) and disbursement APIs. Each group holds and controls its own MTN/Airtel merchant wallet — this app is an orchestration layer, not a custodian of funds. We never pool client money on our own balance sheet.  
* The platform must support multiple group types on one shared data model: informal savings groups, agricultural cooperatives, and SACCOs. Build the schema generically (Group, Member, Transaction, Ledger, Cycle) with a `group_type` field, and keep type-specific rules (e.g. SACCO interest/collateral, co-op shares/dividends) modular so they can be layered on without rewriting the core.  
* When a member makes a contribution, it should auto-post to the group ledger on payment confirmation — no manual reconciliation step for the treasurer.  
* This is a real financial tool. Trust, transparency, and clarity outrank visual flourish. Every number should be traceable — a member should always be able to see why their balance is what it is.

**Tech stack:** Next.js (App Router) \+ TypeScript \+ Tailwind CSS, hosted on Vercel. Supabase (Postgres, Auth, Realtime) is the backend, but Phases 1–3 are frontend-only — use mock data and stub out any function that would eventually call Supabase, clearly marked with a `// TODO: replace with Supabase call in Phase 4` comment, rather than wiring up a real database connection yet. This keeps the project structure consistent from day one without pulling backend work forward.

---

## **Phase 1 — Landing Page**

Build the public marketing landing page. This is the first thing a treasurer, cooperative chairperson, or prospective member sees — likely on a mid-range Android phone, often on a slow connection. It needs to build trust fast and explain a genuinely new behavior (digitizing a paper-based, trust-based system) without sounding like generic fintech.

**Before writing code:**

1. Propose a short design plan: a 4–6 color palette (named hex values), two typefaces (a characterful display face used with restraint \+ a clean body face), and a one-sentence layout concept. Ground the palette and type in something concrete from Zambian cooperative life (e.g. the visual language of chitenge fabric patterns, market ledgers, savings club record books, agricultural cooperative imagery) — not a generic "African fintech" gradient-and-acid-green look, and not a generic cream/serif startup look either. State your reasoning.  
2. Identify one signature element this page will be remembered by — something that embodies "a paper ledger becoming digital, without losing the trust of the paper ledger."  
3. Show me the plan before building. I will approve or redirect before you write code.

**Content sections to include (write real copy, not lorem ipsum, in the interface's plain active voice — see voice notes below):**

* Hero: one clear sentence on what this does and who it's for. Not a vague tagline.  
* How it works: the actual flow (create your group → members contribute via MTN/Airtel → treasurer sees everything in one place → loans and payouts tracked automatically). Only use numbered steps if it's genuinely sequential — it is here, so that's fine.  
* Built for your kind of group: show the three group types (savings groups, agricultural cooperatives, SACCOs) as distinct cards, each with the specific problem it solves for that group type.  
* Trust/transparency section: explicitly address the "where is our money" question — explain that funds stay in the group's own MTN/Airtel wallet, this app never holds anyone's money. This is a real objection your users will have; don't bury it.  
* Call to action: "Create your group" — should be one click to start, no demo-request friction.  
* Footer: simple, with contact and a note on which mobile money providers are supported.

**Voice notes:**

* Active voice, plain verbs, sentence case.  
* Speak to what a treasurer or member controls and recognizes, not how the system works internally.  
* No filler startup language ("revolutionize," "empower," "seamless"). Be specific and concrete instead.

**Technical requirements:**

* Build as a Next.js page/route from the start (App Router), not a standalone React app — this avoids a framework migration when we reach Phase 4\.  
* Fully responsive, mobile-first (most users are on phones).  
* Visible keyboard focus states.  
* Respect `prefers-reduced-motion`.  
* Use Tailwind CSS. Co-locate components sensibly under the Next.js app structure rather than one giant file — small, named components even at this stage.

When done, show me a screenshot or render and walk me through where you took the one real aesthetic risk, and where you deliberately stayed quiet/disciplined.

---

## **Phase 2 — Group Dashboard**

This is the treasurer/secretary's main workspace — the screen they'll open most days. Build after Phase 1 is approved, reusing the type system and visual language established in Phase 1 (don't restart the design language from scratch).

**Core views to build (use mock/sample data for now — no backend yet):**

1. **Group overview** — group name, type, total balance, number of members, current cycle status, at a glance.  
2. **Member list** — name, phone number, total contributed, current balance, status (active/in arrears if it's a SACCO or loan context). Should support search/filter.  
3. **Contributions feed** — chronological list of contributions as they come in (mock real-time updates with sample data), each entry showing member, amount, date, and payment provider (MTN/Airtel icon).  
4. **Loans/payouts panel** — relevant for SACCO and co-op types; show outstanding loans, repayment schedules, disbursement history. Should be conditionally shown/hidden based on `group_type` — a basic chilimba group shouldn't see loan complexity it doesn't need.  
5. **Cycle management** — current cycle dates, what happens at cycle-end (payout for chilimba, dividend for co-op, etc. — make this type-aware).  
6. **Add member / record manual adjustment** — treasurer actions, clearly separated from auto-posted contributions so the two are never confused.

**Design constraints:**

* Every balance and number must be traceable — clicking any total should reveal the transactions that sum to it. No "trust me" numbers.  
* Empty states (e.g. no contributions yet, no loans yet) should explain what will appear there and how to get started — not just "no data."  
* This is a dashboard for daily use, not a marketing page — prioritize legibility, information density done well, and fast scanning over visual flourish. Carry over the established type and color system from Phase 1, but let this screen be quieter and more utilitarian.  
* Mobile-responsive — treasurers will check this on their phones between meetings.

Show me a screenshot/render before moving to Phase 3\.

---

## **Phase 3 — Personal (Member) Dashboard**

This is what an individual group member sees — simpler than the treasurer view, since members don't manage the group, just their own participation.

**Core views to build (mock data, no backend yet):**

1. **My groups** — if a member belongs to more than one group, a simple switcher/list.  
2. **My balance & history** — current balance in this group, full history of my contributions, auto-updating language that makes clear "this updates automatically when you pay" (since contributions auto-post on payment confirmation).  
3. **Make a contribution** — a clear, low-friction flow to trigger a Request-to-Pay to MTN/Airtel (mock the payment trigger for now — show the UI state machine: initiate → pending confirmation → confirmed → reflected in balance).  
4. **My loans** (if applicable to group type) — amount owed, repayment schedule, next due date, a way to repay.  
5. **Group activity** — a lightweight, privacy-conscious feed of group-level activity (e.g. "cycle ends in 12 days," "5 members contributed this week") — members should feel connected to the group's progress without seeing every other member's private details unless the group type/culture calls for full transparency (chilimba groups often expect this, SACCOs may not — make this configurable).

**Design constraints:**

* This audience may be the least technical user of the three screens. Prioritize clarity and confidence over density — a member should never wonder "did my payment go through."  
* Use the same design system as Phases 1–2, but simplified — fewer simultaneous actions, larger touch targets, mobile-first as the default (not just mobile-responsive — assume phone is the primary device here, not an afterthought).  
* Payment states (pending/confirmed/failed) need distinct, unambiguous visual treatment — this is money, ambiguity here erodes trust fast.

Show me a screenshot/render before moving to backend work.

---

## **Phase 4 — Backend**

Do not start this until Phases 1–3 are built and approved.

**Stack:** Next.js (App Router) \+ TypeScript, hosted on Vercel. Supabase for Postgres, Auth, and Realtime. Build Phases 1–3 as Next.js pages/components from the start (not a separate static frontend bolted on later) so there's no framework migration when we get here — confirm this with me before Phase 1 if it changes anything about how those components are structured.

**Data model (Supabase/Postgres, adjust once we're building against real frontend needs):**

* `groups` — id, name, type (savings/co-op/sacco), location, cycle\_settings (jsonb), registration\_status, created\_at  
* `members` — id, phone\_number (unique, this is the identity key), name, group\_id (fk), role, joined\_at  
* `transactions` — id, group\_id (fk), member\_id (fk), type (contribution/loan\_disbursement/repayment/payout), amount, provider (mtn/airtel), provider\_reference\_id, status, created\_at  
* `ledger` — either a Postgres view/materialized view derived from `transactions` (preferred — never manually editable, always recomputed) or a table maintained by a database trigger on `transactions` insert. Decide based on query performance needs once we see real usage patterns; default to a view first since correctness matters more than speed at MVP stage.  
* `cycles` — id, group\_id (fk), start\_date, end\_date, payout\_rules (jsonb)

**Core backend responsibilities:**

* Supabase Auth for treasurer/member login — use phone number as the login identity where possible, since that's already the member's primary key and matches how MTN/Airtel identify users. Confirm Supabase's phone-auth/OTP support fits before assuming this — flag to me if it doesn't and we'll fall back to email+phone-linked accounts.  
* Row Level Security (RLS) policies in Supabase as the actual enforcement layer for treasurer vs member permissions — not just app-level checks. A member should only be able to read their own transactions and group-level aggregates; a treasurer should read/write for their group only. Write RLS policies explicitly and test them, don't rely on the API layer alone to hide data.  
* Next.js API routes (or Route Handlers) for MTN MoMo and Airtel Money integration: Request-to-Pay for collections, disbursement API for payouts/loans. Keep provider API keys server-side only, never exposed to the client.  
* A webhook endpoint (Next.js Route Handler) to receive MTN/Airtel payment confirmations, verify the webhook signature, and write to `transactions` — which should then auto-post to the ledger via the view/trigger above.  
* Supabase Realtime subscriptions on `transactions` to drive the live-updating contributions feed (Phase 2\) and balance updates (Phase 3\) — replace the mock real-time behavior built in those phases with real subscriptions here.  
* Type-aware business logic layer (chilimba cycle payout vs SACCO interest calc vs co-op dividend calc) as separate TypeScript modules sharing the core engine — do not hardcode one group type's rules into the core schema or core logic. These can live as plain TS functions called from API routes/Route Handlers, keyed off `group.type`.  
* Environment-specific config for MTN/Airtel sandbox vs production credentials, managed via Vercel environment variables — never committed to the repo.

**A few decisions to confirm with me before writing backend code:**

* Whether webhook signature verification details for MTN MoMo/Airtel Money sandbox are available yet, or need a separate setup step with each provider first.  
* Whether `ledger` is a view or trigger-maintained table (performance vs. simplicity tradeoff, see above).  
* How OTP/phone auth should work given Supabase's current auth provider options.

---

## **Working agreement for all phases**

* Show your design/architecture reasoning before generating large amounts of code, not after.  
* Use mock data clearly marked as such until the corresponding backend phase is built.  
* Flag any assumption you're making that I haven't specified, rather than silently picking one.  
* Keep accessibility (contrast, focus states, reduced motion) and mobile responsiveness as non-negotiable baseline quality, not a follow-up pass.

