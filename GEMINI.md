# Nexusply: Supplier Intelligence Platform

Nexusply is a modern Supplier Intelligence Platform designed to help users discover and manage high-performing suppliers and winning products. It features a sleek, dark-themed user interface with high-contrast red accents.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS, Framer Motion, Lucide React
- **Authentication:** Supabase Auth (Email/Password, Social, Magic Links)
- **Database:** Supabase (PostgreSQL)
- **I18n:** Custom client-side implementation (English & French)
- **UI Components:** Shadcn UI, Radix UI

## Project Structure

- `app/`: Next.js App Router pages and API routes.
  - `auth/`: Authentication pages (Login, Signup, Callback).
  - `dashboard/`: Main application interface including products and suppliers.
  - `admin/`: Administrative interface.
- `components/`: Reusable UI components.
  - `animate-ui/`: Specialized animated backgrounds and components (Fireworks, Hexagon, etc.).
  - `dashboard/`: Dashboard-specific elements like `ProductCard` and `SupplierCard`.
  - `navbar/`: Comprehensive navigation components.
- `lib/`: Core utilities and business logic.
  - `supabase/`: Supabase client, server, and middleware configurations.
  - `i18n.ts`: Custom internationalization hook and translations.
- `messages/`: Translation files for i18n.

## Development Conventions

- **Theming:** Strictly follow the Nexusply brand colors:
  - Primary Red: `#ef4444` (use `text-primary`, `bg-primary`, etc.)
  - Background: Black/Dark (`bg-black`)
  - Effects: Use `shadow-neon` for high-impact elements.
- **Internationalization:** Use the `useI18n` hook from `@/lib/i18n` for client-side text. Ensure both `EN` and `FR` keys are updated.
- **Components:**
  - Use `use client` for interactive components.
  - Prefer Lucide icons for consistency.
  - Leverage `framer-motion` for smooth UI transitions and animations.
- **Database:** Use Supabase queries and actions defined in `lib/supabase/`. Ensure proper Row Level Security (RLS) policies are in place.

## Building and Running

- `npm run dev`: Start the development server.
- `npm run build`: Build the application for production.
- `npm run start`: Start the production server.
- `npm run lint`: Run ESLint for code quality checks.

## Environment Variables

The following environment variables are required for the project:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous API key.
- `STRIPE_SECRET_KEY`: Stripe secret key for payments.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key.

## Key Files

- `package.json`: Project dependencies and scripts.
- `tailwind.config.js`: Custom theme configuration (Nexusply red, neon shadows).
- `lib/i18n.ts`: Main translation logic and dictionary.
- `middleware.ts`: Next.js middleware for session management and protection.

## Project Roadmap

### Phase 1: The Supabase Migration (Backend Foundation) - ✅ COMPLETED
- **Goal:** Replace `localStorage` and `useState` mocks with a live Supabase PostgreSQL database.
- **Tasks:**
    - Schema Design: `users`, `suppliers`, `products`, `user_favorites`, `reviews`.
    - Auth: Implement Supabase Auth (Email/Password + Social).
    - Security: Set up Row Level Security (RLS).
    - CRUD: Connect Admin Dashboard and frontend to Supabase.

### Phase 2: Billing & Access Control (Stripe)
- **Goal:** Transition to real subscriptions and feature gating.
- **Tasks:** Stripe setup, Checkout flow, Webhook listeners, Feature gating logic.

### Phase 3: Data Pipelines (API Hub & Scraping)
- **Goal:** Real-time market data integration.
- **Tasks:** External API connections (Alibaba, 1688, etc.), Automated sync (Cron jobs), Optimized search engine.

### Phase 4: Nexusply Intelligence Core (AI)
- **Goal:** Implementation of AI Insights.
- **Tasks:** LLM integration, Scoring algorithms, AI result caching.

### Phase 5: Affiliate System & Launch
- **Goal:** Growth and final polish.
- **Tasks:** Affiliate tracking, Commission logic, Affiliate Dashboard, Final QA.
