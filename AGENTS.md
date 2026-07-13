# SkillBridge-S (Backend) — Agent Context

## Stack
- Express v5 + TypeScript (NodeNext module resolution — **use `.js` extensions in all relative imports**)
- Prisma ORM v7 + PostgreSQL (`@prisma/adapter-pg` for PgBouncer)
- Better Auth (custom session + JWT dual auth), Zod v4, Stripe, Cloudinary, Nodemailer
- Package manager: **pnpm** (`pnpm@10.22.0`)

## Commands
- Dev: `pnpm run dev` (runs `tsx watch src/server.ts`)
- Build: `pnpm run build` (runs `tsc`)
- Start (prod): `pnpm run start` (runs `node dist/server.js`)
- Lint: `pnpm run lint` (eslint `src/`)
- Test: `pnpm run test` (vitest, globals enabled)
- Test UI: `pnpm run test:ui`
- Stripe webhook listener: `pnpm run stripe:webhook`

### Prisma commands
- Generate: `pnpm run generate` — outputs to `src/app/generated/prisma/`
- Migrate: `pnpm run migrate` (`prisma migrate dev`)
- Push: `pnpm run push`
- Pull: `pnpm run pull`
- Studio: `pnpm run studio`

### Postbuild
- `"postbuild": "cp src/app/generated/prisma/package.json dist/app/generated/prisma/package.json"`
- Required because the generated Prisma client dir needs its own `package.json` for ESM resolution in the compiled output.

## Project layout
- Entry: `src/server.ts` → `src/app.ts` (Express app setup)
- Schema: `prisma/schema/` — split across 10 `.prisma` files
- Generated client: `src/app/generated/prisma/` (not `node_modules/.prisma`)
  - Import pattern: `import prismaPkg from "../../generated/prisma/index.js"` — often cast with `as any`
  - Types available from `../../generated/prisma/client.js`
- Module pattern (per domain): `{module}.router.ts`, `.controller.ts`, `.service.ts`, `.validate.ts`, `.type.ts`, `.constent.ts`
  - `src/app/modules/{admin,auth,booking,category,payment,review,student,tutor}/`
- Middleware: `checkAuth` (session + JWT), `validateRequest` (Zod), `globalErrorHandler`, `notFound`
- Shared: `catchAsync`, `sendResponse` in `src/app/shared/`
- Error helpers: `AppError`, `handlePrismaError`, `handleZodError` in `src/app/errorHalpers/`
- Utils: `QueryBuilder` for filtering/searching, `connectDB`, `cookie`, `jwt`, `email`
- EJS templates: `src/app/templates/`

## Auth architecture
- **Better Auth** handles email/password + Google OAuth + OTP verification, mounted at `/api/auth/*splat` via `toNodeHandler(auth)` **before** Express JSON parser
- **Custom JWT** (`accessToken` + `refreshToken` cookies) layered on top for role-based route protection
- `checkAuth` middleware verifies both Better Auth session AND custom access token
- Additional user fields: `role`, `status`, `isDeleted`, `deletedAt`, `needPasswordChange`

## API structure
- Public routes: `GET /api/v1/{tutor,category,...}`
- Protected routes: use `checkAuth(UserRole.ADMIN)` or `checkAuth(UserRole.TUTOR)` etc.
- All handlers wrapped with `catchAsync` for error forwarding
- Response shape: `{ success, message, data, meta?, error }` via `sendResponse`
- Webhook (Stripe): `POST /webhook` with `express.raw()` parser (before JSON parser)

## Key quirks
- **Express v5** — different from Express 4 (e.g. router path syntax uses `*splat`, `req.query` changes)
- **`validateRequest`** middleware parses `req.body.data` as JSON string before validation (for FormData/multipart support)
- **Imports must use `.js` extension** (TypeScript `NodeNext` module resolution)
- **Prisma adapter** uses `@prisma/adapter-pg` with `pg` Pool + custom `search_path` (`SET search_path TO sample, public`)
- **CORS** allows multiple origins (`FRONTEND_URL`, `BETTER_AUTH_URL`, localhost variants)
- **`.gitignore` has unresolved merge conflict markers** — needs cleanup
- **All env vars validated at startup** in `src/app/config/env.ts` (throws `AppError` if missing)
- **OTP expires in 2 minutes** — important for email verification flow expectations
