# Frontend Technical Test — Alfinasyah Rifqi

ProcureFlow — an inventory procurement web application covering the internal purchasing flow:

```
Purchase Request → Approval → Purchase Order → Goods Receipt → Inventory Updated
```

## Project Overview

A frontend-only application for staff who raise stock requests and managers who approve them. Two roles are simulated:

| Role                                          | Can do                                                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `USER` (John Doe, Warehouse Staff)            | View dashboard, view/create/edit draft purchase requests, submit them, view purchase orders, record goods receipt, view inventory |
| `APPROVER` (Alex Morgan, Procurement Manager) | View purchase requests and their detail, approve, reject with a reason                                                            |

Actions that are invalid for the active role or the current record status are **hidden**, not merely disabled, so the interface never offers something that cannot succeed.

There is no real backend and no real authentication — both are deliberately out of scope. The application talks to a mock API over the network via Mock Service Worker, so the same code would work against a real server by removing the worker.

## Tech Stack

| Concern         | Choice                                                         |
| --------------- | -------------------------------------------------------------- |
| Language        | TypeScript                                                     |
| Framework       | React 19                                                       |
| Build tool      | Vite 8                                                         |
| Routing         | TanStack Router (file-based, auto code-splitting)              |
| Server state    | TanStack Query                                                 |
| Styling         | Tailwind CSS 4 (CSS-first `@theme` tokens)                     |
| Components      | shadcn/ui, restyled to the ProcureFlow design system           |
| Icons           | lucide-react, wrapped in one `<Icon>` with `strokeWidth={1.7}` |
| Forms           | React Hook Form + Zod                                          |
| Mock API        | MSW (Mock Service Worker)                                      |
| Testing         | Vitest + React Testing Library                                 |
| Package manager | Yarn                                                           |

## Project Structure

```
src/
├── api/              HTTP client + one module per resource (queryOptions & mutation fns)
├── components/
│   ├── ui/           shadcn/ui primitives, restyled to design-system tokens
│   └── *.tsx         shared application components (PageHeader, StatusBadge, states, shell)
├── features/         page components, and the domain components each feature owns
├── hooks/            React context hooks (role switching)
├── lib/              framework-free helpers (formatting, status maps, navigation, tokens glue)
├── mocks/            MSW handlers + in-memory database that enforces the business rules
├── routes/           thin file-based routes: the URL, its search params, and the page to render
├── test/             test setup and render helpers
├── types.ts          domain model shared by the UI and the mock API
└── index.css         design tokens (@theme) and base layer
```

The structure follows the size of the application rather than a prescribed architecture. Route files stay thin: they declare the URL and validate its search params, then render a page component from `features/`. Domain components stay in the feature that owns them even when another page imports them: `PurchaseRequestTable` belongs to `features/purchase-requests/`, and the dashboard imports it from there rather than keeping a copy. Only pieces every feature reuses, such as `ListFilters`, `Pagination`, `StatusBadge`, `StatusNotice` and the empty and error states, live in `components/`. No feature-sliced layering, because the app has four primary entities and that ceremony would not pay for itself.

## Setup

Requires Node 22+ and Yarn.

```bash
yarn install
```

## Environment Variables

| Variable           | Default | Purpose                                                                                       |
| ------------------ | ------- | --------------------------------------------------------------------------------------------- |
| `VITE_MOCK_ERRORS` | `false` | When `true`, every mock API response fails with HTTP 500 so error states can be demonstrated. |

Copy `.env.example` to `.env` to change it. Neither is required — the app runs with no environment file at all. In development the same switch is also available as a **Simulate API errors** checkbox at the bottom of the sidebar, which is the easier way to demo error states.

## Run Application

```bash
yarn dev        # development server on http://localhost:5173
yarn build      # typecheck + production build to dist/
yarn preview    # serve the production build
```

Other scripts:

```bash
yarn lint          # ESLint
yarn typecheck     # tsc --noEmit
yarn format        # Prettier write
yarn format:check  # Prettier check
```

### Docker

A single multi-stage image builds the app and serves the static output with nginx. No `docker-compose` is needed: the mock API runs inside the browser as a service worker, not as a separate process.

```bash
docker build -t procureflow .
docker run --rm -p 8080:80 procureflow
```

## Testing

```bash
yarn test           # run once
yarn test:watch     # watch mode
yarn test:coverage   # with coverage report
```

Tests target behaviour and business rules rather than render smoke checks:

- a purchase request cannot be created or submitted without items
- quantity must be greater than zero, and the same product cannot be added twice
- only a `SUBMITTED` request can be approved or rejected; rejection requires a reason
- goods receipt cannot exceed the remaining quantity, and cannot be zero
- receiving moves a purchase order `ORDERED → PARTIALLY_RECEIVED → RECEIVED` and increases stock
- the Goods Receipt entry point is visible to `USER` and hidden from `APPROVER`
- switching role in the top bar changes which actions are offered
- the dashboard shows the summary figures from the API, and only an approver is prompted to review pending requests
- the dashboard guides a staff user to create a first request when none exist, and recovers from a failed load on retry
- the purchase request list filters by status, searches by request number, pages through results and can sort oldest first
- the list distinguishes "no requests yet" from "no requests match these filters", and offers creation only to staff
- the request form requires a warehouse and at least one product, rejects a quantity of zero, and disables products already added in another row
- saving a draft with several products opens the new request, and a failed save keeps everything that was entered
- leaving the form with unsaved changes asks before discarding them
- staff can submit a draft after confirming, and never see approve or reject
- an approver can approve a submitted request, which creates its purchase order, and cannot reject one without a reason
- a failed approval keeps the confirmation open, decided requests offer no actions, and only drafts can be edited
- a request decided elsewhere before a rejection goes through shows its current status instead of stale actions
- the purchase order list shows the required columns newest first, filters by status, searches by supplier, pages through results and recovers from a failed load
- a purchase order shows the ordered, received and remaining quantity of every product, overall and per-product receiving progress, and its goods receipts
- a purchase order and the purchase request it came from link to each other, and new, cancelled and missing orders each explain their state
- receiving totals never report a negative remaining quantity, and an order with nothing ordered counts as not started
- Receive Goods is offered only to staff, and only for an `ORDERED` or `PARTIALLY_RECEIVED` order
- a receipt needs at least one product, rejects zero and anything above the remaining quantity, and keeps the entered quantities when recording fails
- a partial receipt updates received, remaining and status in place; receiving everything remaining marks the order received and adds the goods to stock with a movement entry
- the Goods Receipt page lists only orders still waiting for goods, drops an order once it is fully received, and tells an approver the task belongs to staff
- inventory shows product, SKU, warehouse, current stock and unit, searches by SKU, filters by warehouse, recovers from a failed load, and opens each item's movement history

## Mock API / Data Strategy

Data access is layered so the UI never touches mock data directly:

```
Route / Component
      ↓  useQuery / useMutation
src/api/*          typed fetch calls against /api/* (the only place URLs exist)
      ↓  HTTP
src/mocks/handlers MSW request handlers: parse query params, paginate, map errors to status codes
      ↓
src/mocks/db       in-memory database; owns all business rules and status transitions
```

- **MSW intercepts real `fetch` calls at the network layer.** Nothing is stubbed at the function level, so TanStack Query experiences genuine loading, error and refetch behaviour, and the browser devtools network tab shows the requests.
- **`src/mocks/db.ts` is the system of record.** It enforces every rule — duplicate products, quantity bounds, legal status transitions, stock movements — so a rule cannot be bypassed by driving the UI differently. The handlers are a thin HTTP translation over it.
- **Every handler waits 300–800 ms** (skipped when `MODE === 'test'`, so the suite stays fast) so loading and submitting states are genuinely visible.
- **Validation failures return HTTP 422 with a `fieldErrors` map**, which the forms map onto the relevant inputs; conflicting transitions return 409; unknown records 404.
- **State is in-memory and resets on reload.** See the engineering decisions below.
- Seed data is shaped to match the dashboard figures in the design: 48 purchase requests, 8 awaiting approval, 21 active purchase orders, 5 partially received.

## Engineering Decisions

**1. MSW at the network boundary instead of mocked modules.**
A mocked service function proves the component renders; it does not prove the data layer works. Intercepting `fetch` means the query cache, retry policy, error mapping, loading states and pagination are all exercised for real, and swapping in a live backend is a matter of deleting the worker registration — no application code changes. The same handlers run in the browser (`msw/browser`) and in tests (`msw/node`), so tests and demo share one source of truth.

**2. Business rules live in the mock API, not in the components.**
Quantity bounds, duplicate products, legal status transitions and stock arithmetic are enforced in `src/mocks/db.ts` and surfaced as HTTP 422/409 responses. The forms also validate with Zod for immediate inline feedback, but the server-side check is authoritative. This mirrors how the real system must behave — a client-only rule is not a rule — and it means the business-rule tests can be fast and UI-independent while the UI tests focus on interaction.

**3. Server state in TanStack Query, UI state in React, and nothing else.**
Everything fetched lives in the query cache keyed per resource and filter set; everything local (form values, dialog visibility, the active role) lives in component state or one small React context. No Redux or Zustand, because there is no cross-tree client state that outlives a page beyond the current role — a context with a `useState` solves that in a dozen lines. Mutations invalidate the affected query keys, which is what makes approve, reject and goods receipt update the screen with no page reload.

**4. Approving a purchase request creates its purchase order automatically.**
The requirement describes the chain `PR → Approval → PO → Goods Receipt` but never says who creates the purchase order. Rather than invent a PO authoring screen outside the required scope, approval generates an `ORDERED` purchase order from the approved request's items. This keeps the end-to-end flow continuous and demonstrable, and models the realistic case where approval is what releases the order.

**5. Design tokens as Tailwind 4 `@theme` variables, shadcn/ui restyled rather than replaced.**
Every colour, radius, font size and shadow from `procureflow-design-system.html` is declared once in `src/index.css` as a theme variable, which makes them available as Tailwind utilities (`bg-blue-normal`, `text-dark-normal`, `rounded-xl`) and simultaneously as the values shadcn/ui's semantic variables point at. No component was rebuilt from scratch: `Button`, `Input`, `Badge`, `Table`, `Card`, `Dialog`, `Drawer`, `Sheet`, `Toast` and `Form` are the shadcn primitives with their variants rewritten in design-system tokens. `StatusBadge` is a thin domain wrapper over `Badge`, not a new component.

**6. List filters live in the URL, not in component state.**
Search, status, warehouse, sort and page on the purchase request list are TanStack Router search params validated by a Zod schema. A filtered view can be bookmarked, shared or reloaded, the browser back button undoes a filter change, and the dashboard's "Review requests" button is simply a link to `?status=SUBMITTED`. Each filter set is its own query key, and `keepPreviousData` keeps the current rows on screen, dimmed, while the next page loads instead of flashing a skeleton on every keystroke.

**7. Validation runs in the form and again in the mock API.**
The request form validates with a Zod schema for immediate, inline feedback: a missing warehouse, a quantity that is not greater than zero, or a product added twice. The mock API enforces the same rules and answers a violation with HTTP 422 and a map of field paths such as `items.1.quantity`. The form writes those server errors onto the same fields with `setError`, so a rule the client missed — or one that only the server can know — still appears next to the input it concerns, and the entered values are never lost.

## Assumptions

Requirements that were ambiguous, and the call made:

1. **An `APPROVER` can only approve or reject a request that is currently `SUBMITTED`.** A `DRAFT`, `APPROVED` or `REJECTED` request offers no decision action, and the mock API rejects the transition with HTTP 409 even if the request were made directly.
2. **Approving a request auto-creates its purchase order** with status `ORDERED`. See engineering decision 4.
3. **`CANCELLED` purchase orders are styled like `DRAFT`** — neutral surface with a muted label. The design system provides badge styles for every other status but not for `CANCELLED`; neutral is correct because a cancelled order is inert rather than a warning or an error. `CANCELLED` appears in seed data and as a filter option; no UI action cancels an order, since the requirement never grants either role that power.
4. **Purchase orders are read-only apart from receiving.** Nothing in the requirement lets a user author, edit or cancel a purchase order, so no such action exists.
5. **`APPROVER` keeps read access to the dashboard, purchase orders and inventory,** but the Goods Receipt entry point is hidden because recording a receipt is listed as a `USER` capability; opening its address directly explains that receipts are recorded by staff. Hiding the other pages would leave an approver with a single usable screen and no context for the decisions they make.
6. **Mock state resets on page reload.** State is in-memory, so a demo always starts from the same seeded position and the reviewer can replay the whole flow repeatably. Persisting to `localStorage` would let a half-finished experiment become confusing state with no obvious way to clear it.
7. **Role is switched from the control in the top bar** and is not persisted. It stands in for authentication; each role is bound to a fixed identity so that "requested by" and "approved by" are recorded with a real name.
8. **Reports and Settings exist in the navigation but are intentionally empty.** They appear in the provided design, so removing them would deviate from it; building analytics or account settings would add scope the case study excludes. Each renders an explicit empty state saying why.
9. **Type sizes follow `procureflow-design-system.html` literally, including its compact component sizes.** The reference defines a documented content scale (12/15/19/24/30/37/46/58/72px) but styles its own components more tightly — 11px buttons, inputs and table cells, 10px labels, 9.5px badges. The implementation keeps both: the content scale for headings and body copy, and the reference's own component sizes for controls, tables and badges. The result is a deliberately dense enterprise interface that reads small on a large display; the design system is the source of truth for tokens, so it was followed rather than reinterpreted. The whole scale lives in one `@theme` block in `src/index.css`, so the density is a single set of values to adjust if a real user test called for it.
10. **Dates are seeded relative to the current date** rather than pinned to the dates shown in the Figma screenshots, so relative timestamps ("2 hours ago") stay truthful instead of drifting into the past.
11. **The application fills the viewport instead of floating as a centred card.** `procureflow-design-system.html` wraps its demo in `.app { width:min(1500px,100vw-48px); margin:24px auto; border-radius:16px }`, and the Figma screenshot shows the product inside a browser mockup frame. Both are presentation chrome for showing the design, not a layout requirement — the technical test document never asks for it. A real procurement tool is a working surface, so the shell is full-bleed: sidebar pinned to the left edge, content using the full width at every breakpoint. Every token, spacing value and component style from the design system is unchanged.
12. **Only an approver is prompted to review pending requests.** The dashboard banner ("8 purchase requests need your attention") appears for `APPROVER`, because approving is not a `USER` action. Staff still see the same "Waiting for Approval" figure in the summary cards.
13. **The dashboard's recent requests card searches and filters in place.** The design shows a search box and a Filter button on that card without saying what they act on. They narrow the five most recent matching requests without leaving the dashboard; "View all purchase requests" opens the full list.
14. **Export downloads every purchase request as CSV.** The design shows an Export action on the dashboard without specifying its contents. A CSV of the request list, built in the browser, is the most useful reading that needs no backend support.
15. **Table columns use the requirement's wording.** The same table serves the dashboard and the full list, so its headers follow the requirement document (Request Number, Items, Created At) rather than the shorter labels in the dashboard design (Request ID, Date).
16. **Creating a request saves a draft; submitting is a separate, confirmed step.** The status model starts every request at `DRAFT`, and the requirement asks for Submit to be confirmed. Saving first lets staff review the request page before sending it, and Submit for Approval on that page opens a confirmation dialog.
17. **A product can appear once per request, and the form prevents the duplicate rather than only reporting it.** A product chosen in one row is disabled in the others, marked "already added". The same rule is still validated in the form and enforced by the mock API, so the "Product has already been added." message remains as a safety net.
18. **Pages a role cannot use explain themselves instead of disappearing.** An approver who opens the create or edit address directly, or anyone who opens edit for a request that is no longer a draft, sees why the page is unavailable and a way back. The request page likewise tells staff a submitted request is waiting for approval, rather than silently showing no buttons.
19. **Leaving a request form with unsaved changes asks for confirmation.** The requirement lists this protection as optional. It guards in-app navigation with a "Discard unsaved changes?" dialog and browser reload or close with the native prompt, and it stops guarding once the request has been saved.
20. **Permissions follow the requirement's role and status rules, not ownership.** Every purchase request is visible to both roles, and any staff member can edit or submit any draft. The requirement grants these actions to the `USER` role, gates them only by status, and asks the interface to show differences by role; telling individual staff apart would need authentication, which is out of scope. The requester's name is still recorded on every request, so an owner-only rule could be added in one place once real users exist.
21. **A purchase order's supplier is display data chosen by the mock API.** The requirement lists Supplier as a column on the purchase order list and detail, but provides no supplier data, no supplier field on the purchase request, and no rule for choosing one. The mock API therefore assigns a supplier from a fixed list when an approval creates the order. "Pacific Industrial Supply" comes from the provided design; the other supplier names are mock data. A preferred supplier per warehouse was considered and left out, because it would invent a relationship the case study does not define.
22. **Overall receiving progress adds quantities across products.** The order-level figure sums units even when products are counted in different units, following the design's activity feed ("120 of 200 units received"). Each product's own progress, always in a single unit, is shown beside it, so the exact position of every line stays clear.
23. **Recording a receipt takes two steps: enter the quantities, then review and confirm.** The requirement asks for Receive Goods to be confirmed. The review step shows what will be added and whether the order will end partially or fully received, because a receipt changes stock immediately and nothing in the requirement lets anyone reverse it. A product left empty simply did not arrive in this delivery; at least one product needs a quantity.
24. **The Goods Receipt page is a work queue of orders still waiting for goods.** The requirement places Receive Goods on the purchase order and lists Goods Receipt in the navigation without describing that page. It lists the `ORDERED` and `PARTIALLY_RECEIVED` orders with the same search and warehouse filter as the purchase order list, and each row opens the same receive dialog used on the order page, so there is one receiving flow rather than two.
25. **Inventory lists one row per product per warehouse, sorted by product name.** Stock belongs to a product in a specific warehouse, so the same product appears once for each warehouse and the warehouse filter narrows it to one. Each row opens a movement history — the optional extra in the requirement — where every purchase receipt is listed with its receipt number. Seeded stock starts from an opening-balance adjustment so the history adds up to the current figure.
