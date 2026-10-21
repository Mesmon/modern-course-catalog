# AGENTS.md — Modern Course Catalog (BGU Academic Catalog)

Guide and architectural reference for AI coding agents working on the **Modern Course Catalog** codebase.

---

## 1. Project Overview

**Modern Course Catalog** is an academic catalog, prerequisite graph explorer, and weekly schedule planner tailored for students at Ben-Gurion University of the Negev (BGU).

### Core Features
- **Course Catalog & Search**: Real-time browsing and full-text search across academic faculties, departments, and course numbers.
- **Direct BGU4U Integration**: Live scraping from BGU's legacy portal (`bgu4u.bgu.ac.il`) with Hebrew character decoding (Windows-1255).
- **Interactive Prerequisite Map (`/map`)**: Node-based dependency graph powered by `@xyflow/react` showing prerequisite, concurrent, and blocked course relationships in an auto-arranged DAG layout.
- **Weekly Schedule Planner (`/schedule`)**: Timetable builder with clash/conflict detection, group/section selection (lectures, recitations, labs), mobile day-view, and ICS export.
- **Google Authentication & Cloud Sync**: Restricted to `@post.bgu.ac.il` student accounts, syncing local schedules and graph bookmarks to MongoDB.
- **Bilingual / RTL Support**: Native Hebrew (RTL by default) and English (LTR) localization.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5.9 |
| **Styling** | Tailwind CSS v4 (`@theme` variables, `@plugin "tailwindcss-animate"`), Radix UI primitives |
| **Fonts** | `IBM Plex Sans Hebrew` (primary sans), `JetBrains Mono` (code/numbers) |
| **Data Fetching** | TanStack React Query v5 (client-side), native `fetch` with caching (server-side) |
| **Database** | MongoDB (via official `mongodb` v7 driver) for user preferences, schedules, and maps |
| **Graph / Flow** | `@xyflow/react` (v12) |
| **Scraper** | `cheerio` + `iconv-lite` (decoding `win1255` BGU legacy pages) |
| **UX Helpers** | `driver.js` (onboarding tours), `sonner` (toasts), `next-themes` (dark/light) |

---

## 3. Repository Architecture & Layout

```
.
├── app/
│   ├── layout.tsx              # Root layout with fonts, theme, dictionary, auth & query providers
│   ├── globals.css             # Tailwind v4 configuration, OKLCH color palette, RTL styles
│   ├── page.tsx                # Homepage (search, department grid, quick access)
│   ├── courses/[id]/           # Course details page (abstract, credits, groups, dependencies)
│   ├── departments/[dept]/     # Department-specific course listings
│   ├── map/page.tsx            # Interactive prerequisite graph page
│   ├── schedule/page.tsx       # Weekly schedule planner page
│   └── api/
│       ├── auth/               # Google OAuth callback & session verification
│       ├── courses/            # Course listing & scraper proxy endpoint
│       ├── departments/        # Departments dictionary endpoint
│       ├── syllabus/           # Syllabus & group scraper endpoint
│       ├── user/               # User schedule & map sync endpoints
│       └── wipe/               # Data wipe/reset endpoint
├── components/
│   ├── DependencyMap.tsx       # Flow DAG view of prerequisites & successors
│   ├── WeeklySchedule.tsx      # Weekly timetable & mobile day-view
│   ├── CourseCard.tsx          # Compact/expanded course card
│   ├── CourseList.tsx          # Filterable course list view
│   ├── GlobalSearch.tsx        # Command dialog (Cmd+K) course search
│   ├── DepartmentSearch.tsx    # Department selector & filtering
│   ├── Navbar.tsx / NavLinks   # Header navigation with mobile responsive bottom bar
│   ├── UserAuthMenu.tsx        # Google login trigger & profile avatar
│   ├── LanguageSwitcher.tsx    # Hebrew / English toggle
│   ├── ThemeToggle.tsx         # Dark / Light mode toggle
│   ├── TourGuide.tsx           # Interactive walkthrough via driver.js
│   ├── ui/                     # Accessible UI components (Dialog, Button, Card, Command, etc.)
│   └── providers/              # Auth, Dictionary, Theme, and React Query context providers
├── lib/
│   ├── auth.ts                 # BGU Google domain validation (@post.bgu.ac.il) & cookie sessions
│   ├── scraper.ts              # Cheerio-based BGU4U HTML parsing & win1255 decoding
│   ├── mongodb.ts              # MongoDB connection client singleton
│   ├── courses.ts              # Course helper functions & query abstraction
│   ├── schedule.ts             # Time parsing, collision detection & schedule utilities
│   ├── dictionaries.ts         # i18n dictionary loader
│   ├── dictionaries/           # en.ts and he.ts translation files
│   └── utils.ts                # cn (clsx + twMerge) helper
├── types/
│   └── course.ts               # Core TypeScript definitions (CourseDetail, Group, Meeting, etc.)
└── public/                     # Static assets (favicons, icons, metadata)
```

---

## 4. Key Engineering Invariants & Gotchas

### A. Hebrew & BGU4U Scraper Encoding
- Legacy BGU endpoints return **Windows-1255** encoded HTML.
- **Never** read response bodies directly as `.text()` when fetching from BGU4U. Always fetch as `arrayBuffer()` and decode via `iconv.decode(Buffer.from(buffer), 'win1255')`.
- BGU's portal can be slow or intermittently throttled. Keep server endpoints resilient with adequate fallbacks and error handling.

### B. Bi-directional (RTL / LTR) Design
- The default language is **Hebrew (`dir="rtl"`, `lang="he"`)**.
- The root layout reads `NEXT_LOCALE` from cookies.
- When creating UI components, use directional-agnostic or bidirectional classes:
  - Prefer `start` and `end` utilities (e.g., `text-start`, `ps-4`, `pe-4`, `ms-auto`) over hardcoded `left` and `right`.
  - Check layouts in both RTL (`he`) and LTR (`en`).

### C. Authentication & Authorization
- Only Google accounts ending in `@post.bgu.ac.il` are allowed to log in (enforced in `lib/auth.ts`).
- Anonymous / guest usage is fully supported:
  - Guests store schedules and map nodes in `localStorage`.
  - When logged in, schedules and maps synchronize to MongoDB via `/api/user/sync`.

### D. Styling & Tailwind v4
- Tailwind v4 is in use with `@import "tailwindcss"` and `@theme` blocks inside `app/globals.css`.
- Do not add standard Tailwind v3 configuration to `tailwind.config.mjs` that conflicts with the v4 theme tokens in `globals.css`.
- Design tokens use modern OKLCH color spaces.

### E. Graph Layout (`DependencyMap.tsx`)
- Course relationships fall into categories: prerequisites, concurrent (corequisites), blocked courses, and subsequent courses.
- The layout is arranged as a directed acyclic graph (DAG) from left to right (or logically ordered) with custom handles on `CourseNode.tsx`.

---

## 5. Development Commands

```bash
# Run local development server (defaults to http://localhost:3000)
npm run dev

# Run TypeScript build check & Next.js production compilation
npm run build

# Start production server
npm start

# Run ESLint validation
npm run lint
```

---

## 6. Environment Variables

Create a `.env.local` file with the following variables for full functionality:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/bgu_catalog?retryWrites=true&w=majority

# Google OAuth (restricted to @post.bgu.ac.il)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Session Secret (random 32+ char string)
AUTH_SECRET=your-session-encryption-secret
```

*Note: The application can run in offline/guest mode without MongoDB and Google OAuth, utilizing in-memory fallbacks and browser `localStorage`.*

---

## 7. Guidelines for Agents

1. **Strict Type Safety**: All new data structures and API responses must be typed in `types/course.ts` or corresponding module types. Avoid `any` where feasible.
2. **Preserve User Data**: When modifying storage keys or sync logic in `schedule.ts` or `lib/mongodb.ts`, maintain backwards compatibility with existing `localStorage` schemas.
3. **Component Boundaries**:
   - Keep Server Components for data scraping / pre-rendering where SEO and initial load speed matter.
   - Mark interactive components (calendars, graphs, popups) with `'use client'`.
4. **Translations**: Whenever user-facing strings are added, include both `he` (`lib/dictionaries/he.ts`) and `en` (`lib/dictionaries/en.ts`) definitions.
