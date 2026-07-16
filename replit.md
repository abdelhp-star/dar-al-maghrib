# Dar Al Maghrib

A complete full-stack online food ordering platform for Dar Al Maghrib, a Moroccan restaurant. Users can browse the menu, add items to cart, check out, and track orders. Admins manage the full operation from a dashboard.

## Run & Operate

- `pnpm --filter @workspace/dar-al-maghrib run dev` — run the frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Framer Motion + wouter
- API: Express 5 + JWT auth (bcryptjs + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — database tables (users, categories, menuItems, cartItems, orders, orderItems, favorites, reviews, coupons, offers)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/dar-al-maghrib/src/pages/` — all React pages
- `artifacts/dar-al-maghrib/src/contexts/` — auth, cart, i18n contexts

## Architecture decisions

- JWT stored in localStorage (Bearer token in Authorization header)
- Guest cart in localStorage merged on login
- Multilingual: en/fr/ar with RTL support for Arabic (dir="rtl" on html)
- Dark/light mode via next-themes
- Admin credentials: admin@daralmaghrib.com / admin123
- Coupon code for testing: WELCOME20 (20% off orders over 50)

## Product

- Home: hero, today's specials, popular dishes, offers, testimonials
- Menu: category sidebar, search, spice level filter, add to cart
- Cart: quantity controls, coupon, delivery/pickup toggle, order summary
- Checkout: full form with payment method selection
- Order tracking: animated status timeline
- User dashboard: profile, order history, favorites
- Admin dashboard: revenue charts, order management, menu CRUD, coupon management

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after changing any lib schema before checking artifact packages
- Express 5 params are typed as `string | string[]` — always wrap with `String(req.params.id)`
- Don't use deep import paths like `@workspace/api-client-react/src/custom-fetch` — all exports go through the package index

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
