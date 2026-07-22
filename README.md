# SkillBridge — Connect with Expert Tutors

SkillBridge is a full-stack tutoring marketplace platform that connects students with expert tutors. Students can discover tutors by subject, book sessions, process payments via Stripe, and leave reviews. Tutors can manage their profiles, availability, and bookings. Admins get a comprehensive analytics dashboard with platform-wide oversight.

---

## Screenshots

> Screenshots to be added. Key pages include:
>
> - **Landing page** — Hero with stats, featured tutors, subject categories, testimonials
> - **Tutor listing & detail** — Filterable grid, tutor profile with booking sidebar
> - **Student dashboard** — Booking stats, spending charts, upcoming sessions
> - **Admin dashboard** — Revenue charts, user distribution, platform analytics
> - **Auth pages** — Login/register, email verification OTP, password reset

---

## Features

| Area | Features |
|------|----------|
| **Discovery** | Browse tutors by subject/category, search & filter, detailed tutor profiles with experience and availability |
| **Booking** | Real-time availability validation, Stripe payment integration, booking lifecycle (pending → accepted → completed) |
| **Authentication** | Email/password registration, Google OAuth, email OTP verification, password reset flow, session management with JWT + Better Auth |
| **Dashboards** | **Student**: booking history, spending analytics, session timeline, favorite tutors. **Tutor**: earnings tracking, booking management, performance metrics. **Admin**: platform-wide revenue, user growth, category analytics, 15+ chart types |
| **Reviews** | Students review completed sessions, average rating automatically updated on tutor profiles |
| **Admin Tools** | CRUD management for users/tutors/categories/bookings, soft-delete with restore, bulk operations |
| **UI/UX** | Dark/light theme (default dark), responsive layout, animated landing sections, toast notifications, URL-synced table state |
| **Communication** | Contact form with email notifications, Stripe webhook event handling |

---

## Tech Stack

### Frontend — `SkillBridge-C/`

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.2.3 (App Router) |
| **UI Library** | React 19.2.4 |
| **Styling** | Tailwind CSS v4, shadcn/ui components (40+ primitives) |
| **State / Data** | TanStack Query 5.97, TanStack Table 8.21, Axios, Zod v4 |
| **Auth** | Better Auth 1.6, custom JWT handling |
| **Forms** | react-hook-form, @tanstack/react-form |
| **Charts** | Recharts 3.8 (wrapped as shadcn-style components) |
| **Animations** | Framer Motion 12, custom CSS animations |
| **Payments** | Stripe (Checkout Sessions) |
| **Media** | Cloudinary (via next-cloudinary) |
| **Misc** | Sonner (toasts), Lucide (icons), next-themes, date-fns, cmdk |

### Backend — `SkillBridge-S/`

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js (TypeScript, ES2023) |
| **Framework** | Express 5.2 |
| **ORM** | Prisma 7.4 (PostgreSQL via `@prisma/adapter-pg`) |
| **Auth** | Better Auth (email/password, Google OAuth, OTP), custom JWT access/refresh tokens |
| **Validation** | Zod 4.3 |
| **Payments** | Stripe 22.0 (Checkout + Webhooks) |
| **Email** | Nodemailer + EJS templates |
| **File Upload** | Multer + Cloudinary |
| **Dev** | tsx (watch mode), Vitest, ESLint |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SkillBridge-C (Frontend)                  │
│                                                                  │
│  ┌─────────────┐  ┌────────────────┐  ┌────────────────────┐   │
│  │  Server      │  │  Server Actions│  │  Client Components │   │
│  │  Components  │  │  (src/services)│  │  (useQuery / use-  │   │
│  │  (RSC)       │──│  httpClient.ts │──│  Mutation + Table) │   │
│  └─────────────┘  └────────────────┘  └────────────────────┘   │
│         │                                                       │
│         │ Next.js Rewrites (next.config.ts)                     │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────┐           │
│  │  proxy.ts (Edge Middleware)                       │           │
│  │  - Auth guard, role-based redirects               │           │
│  │  - Token expiry check + proactive refresh         │           │
│  │  - Email verification / password change checks    │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
         │
         │ HTTP / JSON
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SkillBridge-S (Backend)                   │
│                                                                  │
│  ┌─────────────┐  ┌────────────────┐  ┌────────────────────┐   │
│  │  Better Auth │  │  Custom API    │  │  Stripe Webhook    │   │
│  │  /api/auth/* │  │  /api/v1/*     │  │  POST /webhook     │   │
│  │  (before     │  │  (modules:     │  │  (raw body parser) │   │
│  │   JSON body) │  │   auth, tutor, │  └────────────────────┘   │
│  └─────────────┘  │   student, ...) │                           │
│                   └────────────────┘                           │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  checkAuth Middleware (session + JWT verification)        │  │
│  │  validateRequest (Zod) → Controller → Service → Prisma   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│              ┌──────────────────────┐                          │
│              │   PostgreSQL         │                          │
│              │   (Prisma ORM)       │                          │
│              └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Architecture

The system uses a **dual auth** approach:

- **Better Auth** handles primary authentication — email/password, Google OAuth, email OTP (2-minute expiry), session tokens.
- **Custom JWT** (`accessToken` 1-day + `refreshToken` 7-day in httpOnly cookies) is layered on top for fine-grained role-based access control.
- The `checkAuth(...roles)` middleware validates both the Better Auth session and the JWT token on every protected request.

---

## Project Structure

```
SkillBridge/
├── AGENTS.md                  # AI agent context
├── SkillBridge-C/             # Frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (commonRoutes)/        # Public: landing, tutors, about, contact, faq
│   │   │   │   └── (authRoutes)/      # Login, register, password reset, email verify
│   │   │   └── (dashboardRoutes)/     # Protected: student, tutor, admin dashboards
│   │   ├── components/
│   │   │   ├── ui/                    # 40 shadcn-style primitives
│   │   │   ├── landing/              # Landing page sections (Hero, HowItWorks, …)
│   │   │   ├── modules/              # Feature-specific (Auth, all-tutors, dashboard)
│   │   │   └── shared/               # DataTable, modals, form, file upload, date picker
│   │   ├── services/                 # Server actions for all API calls
│   │   ├── hooks/                    # Custom React hooks (mutations, data table, debounce)
│   │   ├── lib/                      # Axios client, auth client, JWT utils, constants
│   │   ├── types/                    # TypeScript interfaces (api, auth, user, booking, …)
│   │   ├── zod/                      # Zod v4 validation schemas
│   │   └── providers/               # QueryProvider (TanStack)
│   ├── proxy.ts                     # Edge middleware (auth guard, role check, token refresh)
│   └── next.config.ts               # Rewrites to backend API
│
└── SkillBridge-S/             # Backend (Express)
    ├── src/
    │   ├── server.ts                # Entry point
    │   ├── app.ts                   # Express app setup
    │   ├── app/
    │   │   ├── lib/                 # Prisma client, Better Auth config
    │   │   ├── config/              # Environment validation, Stripe, Cloudinary
    │   │   ├── middleware/          # checkAuth, validateRequest, error handlers
    │   │   ├── modules/             # Per-domain: auth, tutor, student, admin,
    │   │   │                        #   booking, payment, review, category, stats, message
    │   │   ├── utils/               # QueryBuilder, JWT, email, cookie, booking utils
    │   │   ├── shared/              # catchAsync, sendResponse
    │   │   ├── errorHalpers/        # AppError, Prisma/Zod error formatters
    │   │   ├── templates/           # EJS email templates
    │   │   └── interface/           # Type declarations
    │   └── __tests__/               # Vitest tests
    └── prisma/
        └── schema/                  # Split schema (10 files)
            ├── schema.prisma        # Generator + datasource
            ├── enum.prisma          # Enums
            ├── auth.prisma          # User, Session, Account, Verification
            ├── tutor.prisma         # Tutor model
            ├── student.prisma       # Student model
            ├── admin.prisma         # Admin model
            ├── category.prisma      # Category + TutorCategory (M2M)
            ├── booking.prisma       # Booking model
            ├── review.prisma        # Review model
            ├── payment.prisma       # Payment model
            └── message.prisma       # Message model
```

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10 (backend) and **bun** >= 1 (frontend, or use pnpm/npm)
- **PostgreSQL** >= 15
- **Stripe account** — for payment processing
- **Cloudinary account** — for image upload
- **Google OAuth credentials** — for social login (optional)
- **SMTP credentials** — for transactional emails (OTP, password reset)

---

## Setup Guide

### 1. Clone the repository

```bash
git clone <repo-url>
cd SkillBridge
```

### 2. Backend Setup

```bash
cd SkillBridge-S
cp .env.local .env          # Edit with your values
pnpm install
pnpm run generate            # Generate Prisma client
pnpm run migrate             # Run database migrations
pnpm run dev                 # Start dev server on port 5050
```

### 3. Frontend Setup

```bash
cd SkillBridge-C
cp .env.example .env.local   # Edit with your values
bun install                  # or: pnpm install / npm install
bun run dev                  # Start dev server on port 3000
```

### 4. Environment Files

#### `SkillBridge-C/.env.local`

```env
# Backend API URL (used by httpClient.ts and authClient.ts)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050

# Cloudinary credentials (for image upload)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# JWT secret for server-side token verification (proxy.ts)
ACCESS_TOKEN_SECRET=your-access-token-secret
```

#### `SkillBridge-S/.env`

```env
# Server
NODE_ENV=development
PORT=5050

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/skillbridge

# Better Auth
BETTER_AUTH_SECRET=your-better-auth-secret
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=86400
BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=86400

# JWT
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback/google

# Frontend
FRONTEND_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email (SMTP)
EMAIL_SENDER_SMTP_USER=your-email@gmail.com
EMAIL_SENDER_SMTP_PASS=your-app-password
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=465
EMAIL_SENDER_SMTP_FROM=SkillBridge <your-email@gmail.com>

# Default admin (seeded on first startup)
ADMIN_EMAIL=admin@skillbridge.com
ADMIN_PASSWORD=your-admin-password
```

---

## Available Scripts

### Frontend (`SkillBridge-C/`)

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |

### Backend (`SkillBridge-S/`)

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start dev server with hot reload (tsx watch) |
| `pnpm run build` | TypeScript compilation |
| `pnpm run start` | Start compiled production server |
| `pnpm run lint` | Run ESLint |
| `pnpm run test` | Run Vitest tests |
| `pnpm run test:ui` | Vitest UI mode |
| `pnpm run generate` | Generate Prisma client |
| `pnpm run migrate` | Run Prisma migrations |
| `pnpm run studio` | Open Prisma Studio |
| `pnpm run push` | Push schema to database |
| `pnpm run stripe:webhook` | Listen for Stripe webhooks locally |

---

## API Overview

All custom endpoints are mounted under `/api/v1`. Better Auth handles `/api/auth/*`.

### Auth (`/api/v1/auth`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/register` | Public | Register new user (creates Student) |
| POST | `/login` | Public | Email/password login |
| POST | `/logout` | Any | Clear session & tokens |
| POST | `/refresh-token` | Public | Rotate access/refresh tokens |
| POST | `/change-password` | Any | Change current password |
| GET | `/me` | Any | Get current user profile |
| POST | `/verify-email` | Public | Verify email with OTP |
| POST | `/resend-otp` | Public | Resend verification OTP |
| POST | `/forget-password` | Public | Request password reset |
| POST | `/reset-password` | Public | Reset password with OTP |
| GET | `/login/google` | Public | Google OAuth redirect |

### Tutor (`/api/v1/tutor`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | Public | List tutors (search, filter, paginate) |
| GET | `/me` | TUTOR | Current tutor's profile |
| GET | `/dashboard` | TUTOR | Tutor analytics dashboard |
| GET | `/:id` | Public | Get single tutor |
| GET | `/:id/categories` | Public | Tutor's categories |
| POST | `/` | ADMIN | Create tutor |
| PATCH | `/:id` | ADMIN/TUTOR | Update tutor profile |
| DELETE | `/permanent/:id` | ADMIN | Hard-delete tutor |
| PATCH | `/restore/:id` | ADMIN | Restore soft-deleted tutor |

### Student (`/api/v1/student`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | ADMIN | List all students |
| GET | `/dashboard` | STUDENT | Student analytics dashboard |
| PATCH | `/:id` | ADMIN/STUDENT | Update student |
| DELETE | `/:id` | ADMIN/STUDENT | Soft-delete student |

### Admin (`/api/v1/admin`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | ADMIN | List all admins |
| GET | `/dashboard` | ADMIN | Full platform analytics (15+ charts) |
| POST | `/` | ADMIN | Create admin |
| PATCH | `/:id` | ADMIN | Update admin |

### Booking (`/api/v1/booking`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | Admin/Tutor/Student | List bookings (role-filtered) |
| POST | `/:id` | STUDENT | Create booking (tutorId in path) |
| PATCH | `/change-status/:id` | * | Change booking status |
| PATCH | `/confirm-booking/:id` | TUTOR | Confirm with meeting link |
| PATCH | `/complete-booking/:id` | STUDENT | Complete + auto-create review |

### Payment (`/api/v1/payment`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/create-checkout-session` | STUDENT | Create Stripe Checkout |
| POST | `/verify-payment` | STUDENT | Manual payment verification |

### Review (`/api/v1/review`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | Public | List reviews (role-filtered) |
| POST | `/` | STUDENT | Create review |
| PATCH | `/:id` | STUDENT | Update own review |

### Category (`/api/v1/category`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | Public | List categories |
| GET | `/used-by-tutors` | Public | Categories with active tutors |
| POST | `/` | ADMIN | Create category |

### Stats (`/api/v1/stats`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/hero-stats` | Public | Platform totals (tutors, students, sessions) |

### Message (`/api/v1/message`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/` | Public | Submit contact form |
| GET | `/` | ADMIN | List contact messages |

### Stripe Webhook

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/webhook` | Stripe event handling (checkout completed, expired, payment succeeded/failed) |

---

## Database Schema

```
User (Better Auth)
 ├── Session (browser sessions)
 ├── Account (email + OAuth accounts)
 ├── Verification (OTP codes)
 ├── Tutor (1:1) → TutorCategory (M2M with Category)
 ├── Student (1:1) → Booking → Payment (1:1)
 └── Admin (1:1)

Booking
 ├── Student (M:1)
 ├── Tutor (M:1)
 └── Review (1:1)

Review
 ├── Student (M:1)
 ├── Tutor (M:1)
 └── Booking (1:1)

Message (standalone contact form submissions)
```

**Enums**: `UserStatus` (ACTIVE, BANNED), `UserRole` (STUDENT, TUTOR, ADMIN), `BookingStatus` (PENDING, ACCEPTED, REJECTED, COMPLETED), `PaymentStatus` (PAID, UNPAID), `TutorStatus` (ACTIVE, INACTIVE, BANNED), `DaysOfWeek` (MONDAY–SUNDAY)

Key patterns:
- **Soft delete** — most entities have `isDeleted` + `deletedAt`; hard delete requires prior soft delete
- **ULID IDs** — used for Tutor and Student (UUIDs for others)
- **Availability** — stored as HH:mm strings with days-of-week array

---

## Authentication Flow

```
Registration
  1. User submits email + password
  2. Better Auth creates User + hashed password
  3. Student record created in DB transaction
  4. JWT access/refresh tokens issued → httpOnly cookies
  5. Redirect to verify-email (OTP sent via email)

Login
  1. Better Auth validates credentials
  2. Checks emailVerified, isDeleted, needPasswordChange
  3. Issues session token + JWT tokens
  4. Role-based redirect to appropriate dashboard

OTP Verification
  1. 6-digit code, 2-minute expiry
  2. Sent via Nodemailer (EJS template)
  3. Verified via Better Auth API

Password Reset
  1. Request OTP → verify OTP → set new password
  2. Invalidates all existing sessions

Token Refresh
  1. Proactive refresh when token expires within 5 minutes
  2. Handled in both edge middleware and server-side httpClient
  3. Rotates access token + refresh token cookies
```

---

## Deployment

### Frontend (Vercel)

```bash
cd SkillBridge-C
bun run build
# Deploy `SkillBridge-C` to Vercel
# Set environment variables in Vercel dashboard
```

### Backend (Node.js server)

```bash
cd SkillBridge-S
pnpm run build
pnpm run start
# Set environment variables
# Ensure PostgreSQL is reachable
# Configure Stripe webhook to point to your domain/webhook
```

**Important**: Both `FRONTEND_URL` and `BETTER_AUTH_URL` must be updated to your production domains. Stripe webhook endpoint must be configured in the Stripe dashboard.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes following existing conventions.
4. Run `pnpm run lint` (backend) and `bun run lint` (frontend) to check code quality.
5. Run `pnpm run test` to ensure tests pass.
6. Open a pull request.

**Coding conventions**:
- Frontend: Server Components by default; `"use client"` only for interactivity. All API calls go through server actions in `src/services/`. Prefer existing shadcn-style UI primitives.
- Backend: Follow the module pattern (router → controller → service → validate). Use Zod for all input validation. Include `.js` extension in relative imports (NodeNext resolution).
- Both: Use the provided `.env.example` / `.env.local` as templates for new environment variables.

---

## License

MIT License — see the LICENSE file for details.
