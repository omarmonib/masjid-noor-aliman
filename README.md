# Masjid Noor Al-Iman — Official Website

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)

The official web platform for **Masjid Noor Al-Iman**, located in Belbeis, Al-Sharqia, Egypt. A full-featured Islamic web application providing prayer times, Quran reading, Hadith browsing, Adhkar (remembrances), mosque news, events, and donation support — fully bilingual in Arabic and English.

---

## Features

**Quran**
- Full Mushaf viewer rendered with authentic Uthmanic Hafs fonts (per-page font loading via Quran Foundation CDN)
- Word-by-word audio playback
- Surah navigation with page-by-page display

**Hadith**
- Browse 11 major Hadith collections (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, Malik, Nawawi 40, Riyad as-Salihin, Al-Adab Al-Mufrad, Bulugh Al-Maram)
- Full-text Arabic keyword search within any collection
- Global cross-collection search
- Jump-to-hadith by number
- Daily hadith from Al-Nawawi 40

**Prayer Times**
- Accurate daily prayer times calculated for Belbeis using the Egyptian General Authority method (`adhan` library)
- Live countdown to next prayer
- Monthly prayer schedule table with Hijri dates, printable
- Qibla compass with live device orientation on supported devices
- Distance to Makkah

**Adhkar**
- 34 categorized sections from Hisn Al-Muslim
- Interactive counter with progress bar for each dhikr
- Virtue and source information toggles

**Mosque Section**
- News & announcements with category filters
- Upcoming and past events with category icons
- About section with mosque info and services

**Authentication**
- Credential-based login and registration (NextAuth.js + Prisma + bcrypt)
- JWT session strategy
- Role-based user model

**Internationalization**
- Full Arabic and English support via `next-intl`
- RTL layout for Arabic, LTR for English
- Arabic-first routing (`/ar`, `/en`)

---

## Screenshots

> _Screenshots can be added here. Place images in a `/docs/screenshots/` folder and reference them below._

| Home Page | Prayer Times | Quran Viewer |
|-----------|-------------|--------------|
| ![Home]() | ![Prayer]() | ![Quran]() |

| Hadith Browser | Adhkar | Mosque News |
|----------------|--------|-------------|
| ![Hadith]() | ![Adhkar]() | ![Mosque]() |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Fonts | Cairo, Amiri (Google Fonts), Uthmanic Hafs (CDN) |
| Authentication | NextAuth.js 4 |
| ORM | Prisma 5 (SQLite in development) |
| Prayer Calculation | adhan |
| Internationalization | next-intl 4 |
| State Management | Zustand |
| Server State | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Icons | Lucide React |
| Quran Data | api.quran.com v4, Quran Foundation CDN |
| Hadith Data | fawazahmed0/hadith-api (jsDelivr CDN) |
| Verse Data | api.alquran.cloud |

---

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # Database schema (User, Session, Post, Donation, Bookmark)
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── [locale]/          # Locale-based routing (ar / en)
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── layout.tsx     # Locale layout with fonts, Navbar, SessionWrapper
│   │   │   ├── quran/
│   │   │   ├── hadith/
│   │   │   ├── adhkar/
│   │   │   ├── prayer-times/
│   │   │   ├── mosque/
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       └── register/
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth + registration endpoint
│   │   │   └── hadith/         # Proxy to jsDelivr hadith CDN
│   │   ├── globals.css
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Root redirect to /ar
│   ├── components/
│   │   ├── adhkar/             # DhikrCard, AdhkarCategoryCard
│   │   ├── auth/               # LoginForm, RegisterForm, SessionWrapper
│   │   ├── hadith/             # HadithBrowser, HadithReader, HadithCard
│   │   ├── layout/             # Navbar, Hero
│   │   ├── mosque/             # MosquePage, NewsSection, EventsSection, AboutSection
│   │   ├── prayer/             # DailyPrayers, MonthlyTable, QiblaCompass, PrayerTimesPage
│   │   ├── quran/              # MushafViewer
│   │   ├── sections/           # DailyVerseSection, DailyHadithSection
│   │   └── widgets/            # PrayerTimesWidget
│   ├── data/
│   │   ├── adhkar-raw.json     # Full Hisn Al-Muslim data
│   │   └── news.ts             # Static mosque news and events data
│   ├── lib/
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── adhkar.ts           # Adhkar data transformation
│   │   ├── hadith.ts           # Hadith collection definitions + daily hadith
│   │   ├── quran.ts            # Daily verse/hadith fetchers
│   │   ├── quran-reader.ts     # Quran API helpers (getSurahs, getVerses)
│   │   └── utils.ts            # cn() Tailwind utility
│   └── types/
│       ├── global.d.ts
│       └── next-auth.d.ts      # Session/JWT type augmentation
├── messages/
│   ├── ar.json                 # Arabic translations
│   └── en.json                 # English translations
├── emails/                     # Email templates (React Email)
├── i18n.ts                     # next-intl configuration
├── middleware.ts               # Locale routing middleware
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Installation

### Prerequisites

- Node.js 18.17 or higher
- pnpm (recommended) or npm

### Clone and install

```bash
git clone https://github.com/your-username/masjid-noor-aliman.git
cd masjid-noor-aliman
pnpm install
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

For production, replace `DATABASE_URL` with your production database connection string and set `NEXTAUTH_URL` to your deployed domain.

---

## Running Locally

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# (Optional) Seed the database
pnpm prisma db seed

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000` and will redirect to `http://localhost:3000/ar`.

---

## Build & Deployment

```bash
# Production build
pnpm build

# Start production server
pnpm start
```

### Vercel (recommended)

The project is configured for Vercel deployment. Set the environment variables in your Vercel project dashboard and connect your repository. The `postinstall` script runs `prisma generate` automatically.

For a production database, switch `prisma/schema.prisma` datasource from SQLite to PostgreSQL (or another supported provider) and update `DATABASE_URL` accordingly.

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm postinstall` | Auto-runs `prisma generate` after install |

---

## Architecture Overview

### Routing

The application uses Next.js App Router with locale-based routing via `next-intl`. The middleware intercepts all non-static requests and prefixes them with the active locale (`/ar` or `/en`). Arabic is the default locale.

```
/              → redirects to /ar
/ar            → Arabic home
/en            → English home
/ar/quran      → Quran viewer (Arabic)
/en/quran      → Quran viewer (English)
```

### Data Fetching

- **Prayer times** — computed client-side using the `adhan` library with hardcoded coordinates for Belbeis (30.8708°N, 31.5588°E)
- **Quran content** — fetched at runtime from `api.quran.com` (verses/words) and `verses.quran.foundation` (per-page fonts and audio)
- **Hadith content** — proxied through `/api/hadith` to the jsDelivr-hosted `fawazahmed0/hadith-api`, cached for 7 days on the server and in-memory on the client across component renders
- **Daily verse** — fetched server-side on every page load from `api.alquran.cloud`
- **Daily hadith** — fetched server-side, rotated by day-of-year through Al-Nawawi 40

### Authentication

NextAuth.js with a credentials provider authenticates users against a bcrypt-hashed password stored in the database. Sessions are managed as JWTs. The `role` field supports future admin/user differentiation.

### Fonts

Quran pages use Uthmanic Hafs V2 page-specific fonts (`p1.woff2` through `p604.woff2`) loaded dynamically via the Web Font API. A fallback Amiri Quran font is applied until the page font loads.

---

## Key Functionality Notes

- **Hadith caching**: The `HadithReader` component caches full collections in a module-level `collectionCache` object, so switching between surahs within a session avoids re-fetching.
- **Prayer countdown**: Recalculates every second using `adhan`'s `nextPrayer()` method. Accounts for midnight boundary by checking the next day's Fajr.
- **Qibla**: Calculates from the user's GPS coordinates if available, falls back to Belbeis coordinates. Uses the `DeviceOrientationEvent` API (with iOS permission handling) for a live compass needle.
- **Adhkar counter**: State is local to each card. Completing a dhikr shows a completion banner and disables the tap button.
- **MushafViewer**: Groups words by page and line number from the API response, then renders each line as a flexbox row with RTL direction. Word audio plays via `HTMLAudioElement`.

---

## Future Improvements

- Admin dashboard for managing mosque news and events via the database instead of static files
- Donation payment gateway integration
- Push notifications for prayer times
- Quran audio — full recitation streaming with playback controls
- User bookmarks (schema already in place)
- Offline support / PWA manifest
- More Hadith translations (English text is available in the API but not currently displayed)
- Dark mode toggle

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please ensure your code passes `pnpm lint` before submitting.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Author

**Masjid Noor Al-Iman Development Team**  
Belbeis, Al-Sharqia, Egypt

---

*سبحانك اللهم وبحمدك، أشهد أن لا إله إلا أنت، أستغفرك وأتوب إليك*