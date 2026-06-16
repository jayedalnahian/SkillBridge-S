# SkillBridge 🎓

> **Connect with Expert Tutors, Learn Anything**

SkillBridge is a full-stack web application that connects learners with expert tutors. Students can browse tutor profiles, view availability, and book sessions instantly. Tutors can manage their profiles, set availability, and track their teaching sessions. Admins oversee the platform and manage users.

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| Frontend | [https://skill-bridge-c.vercel.app](https://skill-bridge-c.vercel.app) |
| Backend | [https://skill-bridge-s.vercel.app](https://skill-bridge-s.vercel.app) |

---

## ✨ Features

### Public
- Browse and search tutors by subject, rating, and price
- Filter tutors by category
- View detailed tutor profiles with reviews
- Landing page with featured tutors

### Student
- Register and log in as a student
- Book tutoring sessions
- View upcoming and past bookings
- Leave reviews after sessions
- Manage profile

### Tutor
- Register and log in as a tutor
- Create and update tutor profile
- Set availability slots
- View teaching sessions
- See ratings and reviews

### Admin
- View all users (students and tutors)
- Manage user status (ban/unban)
- View all bookings
- Manage categories

> **Note:** Users select their role during registration. Admin accounts are seeded in the database.

---

## 🛠️ Tech Stack

### Backend

| Category | Technology |
|----------|------------|
| Runtime | Node.js + TypeScript |
| Framework | Express v5 |
| Database | PostgreSQL |
| ORM | Prisma v7 |
| Auth | BetterAuth + JWT |
| Storage | Cloudinary |
| Payments | Stripe |
| Email | Nodemailer |
| Validation | Zod v4 |
| Template Engine | EJS |
| Testing | Vitest |

### Frontend

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 + React 19 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| Data Fetching | TanStack Query v5 |
| Forms | TanStack Form |
| Tables | TanStack Table |
| HTTP Client | Axios |
| Auth | BetterAuth |
| Charts | Recharts |
| Animations | Framer Motion |
| Notifications | Sonner |

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js v18+
- PostgreSQL database
- Cloudinary account
- Stripe account

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/jayedalnahian/SkillBridge-S
cd SkillBridge-S

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
```

Fill in your `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:5432/skillbridge
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

EMAIL_HOST=smtp.example.com
EMAIL_USER=your_email
EMAIL_PASS=your_password

BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:5000
```

```bash
# 4. Run database migrations
npx prisma migrate dev

# 5. Seed the database (creates admin accounts)
npx prisma db seed

# 6. Start the development server
npm run dev
```

The backend will be running at `http://localhost:5000`.

---

### Frontend Setup

```bash
# 1. Clone the repository
git clone https://github.com/jayedalnahian/skillbridge-c
cd SkillBridge-C

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
```

Fill in your `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000
```

```bash
# 4. Start the development server
npm run dev
```

The frontend will be running at `http://localhost:3000`.

---

## 👤 Roles

| Role | Description | Access |
|------|-------------|--------|
| **Student** | Learners who book tutoring sessions | Browse tutors, book sessions, leave reviews, manage profile |
| **Tutor** | Experts who offer tutoring services | Create profile, set availability, view bookings, manage subjects |
| **Admin** | Platform moderators | Manage all users, view analytics, moderate content |

---

## 📁 Repository Links

- **Frontend:** [https://github.com/jayedalnahian/skillbridge-c](https://github.com/jayedalnahian/skillbridge-c)
- **Backend:** [https://github.com/jayedalnahian/SkillBridge-S](https://github.com/jayedalnahian/SkillBridge-S)
