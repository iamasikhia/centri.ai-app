# Centri – Personal Work Clarity

> Understand where your work energy went today.

Privacy-first work tracking tool with Chrome extension and beautiful dashboard.

## 🎯 Product Philosophy

- **Not time tracking** – This is a daily mirror
- **Not surveillance** – No keystroke logging, no content reading
- **Not productivity scoring** – No judgment, no metrics
- **Privacy-first** – Track domains and duration only
- **Calm & reflective UX** – Black & white minimalism

## 🏗️ Tech Stack

### Frontend (Dashboard)
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Black & white design only

### Backend
- Next.js API Routes
- Prisma ORM
- SQLite (dev) / Postgres-ready

### Browser Extension
- Chrome Manifest v3
- TypeScript
- Service worker for background tracking
- Content scripts for activity detection

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
npx prisma db push
```

This creates the SQLite database at `prisma/dev.db`.

### 3. Build Chrome Extension

The extension uses TypeScript and needs to be compiled:

```bash
# Install TypeScript globally if needed
npm install -g typescript

# Compile extension files
cd extension
tsc background/rules.ts --outDir . --target ES2017 --module ES2020 --esModuleInterop
tsc background/tracker.ts --outDir . --target ES2017 --module ES2020 --esModuleInterop
tsc background/aggregator.ts --outDir . --target ES2017 --module ES2020 --esModuleInterop
tsc background/sync.ts --outDir . --target ES2017 --module ES2020 --esModuleInterop
tsc background/service_worker.ts --outDir . --target ES2017 --module ES2020 --esModuleInterop
tsc content/activity_listener.ts --outDir . --target ES2017 --module ES2020 --esModuleInterop
tsc ui/popup.ts --outDir . --target ES2017 --module ES2020 --esModuleInterop
cd ..
```

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder

### 5. Run Dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Project Structure

```
centri/
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── sync/          # Extension sync endpoint
│   ├── page.tsx           # Today dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── CategoryCard.tsx   # Work category cards
│   ├── Timeline.tsx       # Flow of the day
│   ├── OutputSection.tsx  # What came out of it
│   └── DailyInsight.tsx   # AI insight
│
├── extension/             # Chrome extension
│   ├── manifest.json      # Extension config
│   ├── background/        # Service worker
│   │   ├── rules.ts       # Domain categorization
│   │   ├── tracker.ts     # Activity tracking
│   │   ├── aggregator.ts  # Data aggregation
│   │   ├── sync.ts        # Backend sync
│   │   └── service_worker.ts
│   ├── content/
│   │   └── activity_listener.ts
│   └── ui/
│       ├── popup.html
│       ├── popup.css
│       └── popup.ts
│
├── lib/                   # Utilities
│   ├── prisma.ts          # DB client
│   └── utils.ts           # Helpers
│
├── prisma/
│   └── schema.prisma      # Database schema
│
└── package.json
```

## 🔒 Privacy Guarantees

### What We Track
- ✅ Domain only (e.g. `notion.so`)
- ✅ Category (communication, building, research, meetings, admin)
- ✅ Duration (rounded to nearest second)
- ✅ Timestamp (rounded)

### What We DON'T Track
- ❌ Page content
- ❌ Typed text
- ❌ Incognito tabs
- ❌ Screenshots
- ❌ URLs (only domains)

## 📊 Data Model

### DailySummary
- Total active time
- Category breakdowns
- Top 5 domains
- Longest focus window
- Context switch count

### ActivityLog
- Domain
- Category
- Duration
- Timestamp

## 🎨 UI Principles

- **Black & white only** – No colors, no gradients
- **Large typography** – Confident, readable
- **Generous whitespace** – Calm, breathable
- **Subtle motion** – Framer Motion for polish
- **YC aesthetic** – Linear × Vercel × Notion

## 🔧 Configuration

### Adding Custom Domain Rules

Edit `extension/background/rules.ts`:

```typescript
export const CATEGORY_RULES = {
  communication: ['slack.com', 'gmail.com', ...],
  building: ['github.com', 'figma.com', ...],
  // Add your domains here
};
```

## 🚧 Future Roadmap

- [ ] Magic link authentication
- [ ] Gmail integration (emails sent)
- [ ] Calendar integration (meetings attended)
- [ ] Google Docs integration (documents edited)
- [ ] Weekly/monthly views
- [ ] Export data
- [ ] Team insights (optional, privacy-first)

## 📝 License

MIT

---

**Built with care for knowledge workers who want clarity, not surveillance.**
