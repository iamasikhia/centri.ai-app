# Centri.ai Monorepo

Centri.ai is a pre-meeting and day-start dashboard for managers.

## Structure
- `apps/web`: Next.js 14 App Router, Tailwind, Shadcn UI.
- `apps/api`: NestJS, Prisma, PostgreSQL.

## Prerequisites
- Node.js >= 18
- pnpm
- Docker & Docker Compose

## Getting Started

### 1. Environment Variables

Create `apps/api/.env`:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/centri_api?schema=public"
ENCRYPTION_KEY="super_secret_encryption_key_32_chars_long"
API_BASE_URL="http://localhost:3001"

# OAuth Credentials (get these from provider consoles)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
SLACK_CLIENT_ID="..."
SLACK_CLIENT_SECRET="..."
JIRA_CLIENT_ID="..."
JIRA_CLIENT_SECRET="..."
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Database

```bash
docker compose up -d
```

Wait for Postgres to accept connections.

### 4. Setup Database

```bash
cd apps/api
npx prisma migrate dev --name init
npm run seed
```
*(The seed script populates the dashboard with mock tasks, meetings, and team members for the default user)*

### 5. Run Applications

From the root:
```bash
pnpm dev
```
- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)

## Features

- **Dashboard**: View today's focus tasks, blockers, and upcoming meetings.
- **Team**: View discovered team members.
- **Integrations**: Connect Google, Slack, and Jira (OAuth flows require correct Client IDs).
- **Sync**: Triggers fetch from connected providers.

## Testing

Run unit tests for API:
```bash
pnpm --filter api test
```

## Changelog

### v1.1.0 - Dashboard UI Overhaul (Executive Briefing)
- **UI Refresh**:
  - Added "Manager Attention" strip with key metrics (Blocked, Overdue, Next Meeting).
  - Improved "Today's Focus" card: Grouped by urgency (Overdue vs Today vs Soon).
  - Redesigned "Blockers" card: cleaner look, added blocked-time context.
  - "Task Health": Added drill-down accordion to view specific at-risk tasks per member.
  - "Meetings": Added "Next Meeting Brief" with at-risk task warnings.
- **Data**:
  - Backend now serves enriched task/meeting data including creation/update timestamps.
  - New `dashboard-utils` library for shared prioritization logic and Human Identity formatting.
- **Dev**:
  - Added unit tests for dashboard logic (`apps/web/src/lib/dashboard-utils.test.ts`).
