# ElitaleRestro

An open-source **restaurant management platform** — POS, kitchen display (KDS), orders & tables, inventory with recipe-based auto-depletion, GST-aware billing/invoicing, staff management, a manager analytics dashboard, and a public QR self-ordering flow for guests.

Built with a strict layered architecture (**UI → Server Actions → Services → Repositories → DB**) and test-driven development.

## Tech stack

- **Next.js 16** (App Router, React Server Components, React Compiler) · **React 19** · **TypeScript 5** (strict)
- **Tailwind CSS v4** · **shadcn/ui** + `@base-ui/react`
- **Prisma 7** + **PostgreSQL** (`pg` driver adapter)
- **Zod** validation · **jose** sessions · **Twilio** SMS OTP · **Supabase Storage** (S3) for media
- **upiqr** — NPCI-spec dynamic UPI QR generation (zero runtime dependencies)
- **Vitest** for tests · ESLint 9

## Features

- **POS** — photo menu grid with search + category sections, variants/modifiers, split/multi-tender settlement, discounts & comps.
- **Orders & KDS** — order lifecycle, kitchen ticket board with prep states, Hindi voice alerts, batch table settlement.
- **Tables** — floor setup with occupancy awareness + printable QR codes for self-ordering.
- **Guest self-ordering** — public `/order/[username]?table=…` with phone OTP verification, cart persistence, live order status.
- **Menu** — categories, items, variants, modifiers, images, "86" availability, per-item recipes.
- **Inventory** — typed stock movements, bulk receive/count, recipe-based auto-depletion, low-stock alerts.
- **Billing** — GST (CGST/SGST) handling, round-off, thermal-receipt invoices with a customizable footer.
- **Dynamic UPI payments** — per-bill NPCI-format QR (`upiqr`) with the exact amount and order reference locked in, plus "Pay with Google Pay" intent links. No gateway fees — funds settle directly to the restaurant's UPI ID.
- **Dashboard** — live day + month analytics (sales, AOV, payment mix, open orders, daily trend), auto-refresh.
- **Staff** — role-based staff with PIN login for waiter/kitchen (screen pad **and** physical keyboard support); manager phone-OTP / PIN login.

## Live demo

A deployed demo instance is available for testing:

**https://restro-fxyx.vercel.app/**

| What | Where |
|---|---|
| App home | https://restro-fxyx.vercel.app/ |
| Guest self-ordering (tables T1–T6, pick one) | https://restro-fxyx.vercel.app/order/demo-restaurant |
| Staff login (waiter/kitchen, PIN) | https://restro-fxyx.vercel.app/u/demo-restaurant/login |
| Manager/admin login (phone + PIN/OTP) | https://restro-fxyx.vercel.app/login |

> The guest order URL accepts `?table=<id>` (the internal table id, not the label). Without it, the guest picks a free table — the QR sticker printed from `/dashboard/tables` carries the correct one.

### Demo credentials (testing only)

| Who | Login |
|---|---|
| **ADMIN** | phone `+917597365803` → PIN `1234` (or OTP code `123456`) |
| **STAFF** (`/u/demo-restaurant/login` → tap name → PIN pad or keyboard) | Arjun `1111` · Priya `2222` · Suresh `3333` · Divya `4444` |
| **GUEST** (`/order/demo-restaurant`, no login) | pick table → add items → name → any phone → code `123456` |

**Test data loaded in the demo database:**

- Demo restaurant — **Demo Restaurant** (`demo-restaurant`), self-ordering enabled, UPI ID `nivedrk123@okicici`
- Staff roster (all active, PIN-protected):

  | Employee code | Name | Role |
  |---|---|---|
  | EMP001 | Arjun Nair | Waiter |
  | EMP002 | Priya Menon | Waiter |
  | E-003 | Arsha | Waiter |
  | EMP003 | Suresh Kumar | Kitchen |
  | EMP004 | Divya Rao | Kitchen |
  | EMP005 | Rohit Sharma | Management |
  | EMP006 | Meera Nair | Cashier |

- Floor: tables **T1–T6** ("Main Hall")
- Menu: Butter Chicken (₹280), Masala Dosa (₹120), Veg Biryani (₹180) under the **Mains** category

> ⚠️ These credentials are published for demo purposes and can be used by anyone. Don't run real revenue through this instance.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env    # then fill in your values

# 3. Set up the database
npm run db:migrate      # apply migrations
npm run db:seed         # optional: seed an admin user

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** this uses Next.js 16, whose APIs differ from earlier versions (e.g. `middleware.ts` is now `proxy.ts`). See `AGENTS.md` for conventions.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Run the Vitest suite |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed initial data |

## Environment

All configuration is via environment variables — see [`.env.example`](.env.example) for the full list (database, auth secret, Twilio SMS, Supabase storage, etc.). **Never commit your `.env`** — it is gitignored.

## Contributing

Contributions are welcome. Please read `AGENTS.md` (the coding standards / architecture source of truth) before submitting changes, keep the layered architecture intact, and add co-located `*.spec.ts` tests for new services, repositories, actions, hooks, and utilities. Run `npm test` (zero failures) plus typecheck and lint before opening a PR.

## License

[GNU AGPLv3](LICENSE) © 2026 Dharmendra Shah

This project is licensed under the GNU Affero General Public License v3.0. In
short: you're free to use, modify, and self-host it, but if you run a modified
version as a network service, you must make your modified source available to
its users. See [`LICENSE`](LICENSE) for the full terms.
