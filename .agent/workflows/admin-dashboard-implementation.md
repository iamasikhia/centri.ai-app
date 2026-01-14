---
description: Centri Admin Dashboard Implementation Plan
---

# Centri Admin Dashboard - Implementation Plan

## Overview
Building a production-grade admin dashboard for Centri.ai with real data, comprehensive monitoring, and robust security.

## Current Status
- **Phase:** Starting fresh rebuild
- **Environment:** Node.js v18.12.0, Next.js 14 target
- **Database:** PostgreSQL (existing)
- **Auth:** NextAuth.js (shared with main app)

## Implementation Phases

### Phase 1: Foundation & Setup ✓ IN PROGRESS
**Goal:** Set up project structure, dependencies, and authentication

**Tasks:**
1. Create new Next.js 14 app at `apps/admin`
2. Install dependencies (ShadCN UI, Recharts, TanStack Table)
3. Configure Tailwind with custom theme matching main app
4. Set up TypeScript strict mode
5. Create admin middleware for role-based access
6. Build base layout with navigation
7. Implement dark/light mode toggle

**Commands:**
```bash
# Create Next.js app
cd /Users/iseoluwaasikhia/centri.ai-v1-app
npx create-next-app@14 apps/admin --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install core dependencies
cd apps/admin
npm install @prisma/client@5.22.0 next-auth@4.24.13
npm install recharts@2.10.0 @tanstack/react-table@8.11.0
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install date-fns redis

# Install dev dependencies
npm install -D prisma@5.22.0
```

### Phase 2: Database Schema Extensions
**Goal:** Extend Prisma schema with admin-specific tables

**New Tables:**
- `activity_logs` - Track all user actions
- `admin_actions` - Immutable audit trail
- `ai_usage` - Track AI requests and costs

**Modified Tables:**
- `users` - Add role, status, last_active_at
- `integrations` - Add sync tracking fields
- `organizations` - Add status field

**Migration Strategy:**
- Create migration in `apps/api/prisma/migrations`
- Test locally before production
- Ensure backward compatibility

### Phase 3: Core Analytics Queries
**Goal:** Build optimized PostgreSQL queries for all metrics

**Query Categories:**
- User metrics (DAU, WAU, MAU, growth)
- Engagement metrics (sessions, retention)
- Integration metrics (sync rates, failures)
- AI usage metrics (requests, tokens, costs)
- Error rate metrics

**Performance Requirements:**
- All queries < 1 second
- Use appropriate indexes
- Implement Redis caching (5-min TTL)
- Materialized views for expensive aggregations

### Phase 4: Overview Dashboard
**Goal:** Build the main dashboard with 10 metrics, 4 charts, 4 tables

**Components:**
- MetricCard with sparkline
- UserGrowthChart (line + bar)
- DAUTrendChart (area)
- MeetingsChart (stacked bar)
- AIUsageChart (dual-axis line)
- LatestUsersTable
- LatestOrgsTable
- ActivityLogsTable (real-time)
- FailedJobsTable

**Features:**
- Auto-refresh every 30 seconds
- Loading skeletons
- Error boundaries
- Export to CSV

### Phase 5: Users & Organizations Pages
**Goal:** Complete user and org management

**Users Page:**
- Advanced search and filters
- Bulk actions
- User detail page with full profile
- Impersonation feature
- Integration reset
- Account disable with audit

**Organizations Page:**
- Org listing with metrics
- Org detail with member management
- Integration status per org
- Usage analytics
- Bulk sync operations

### Phase 6: Integrations & AI Usage
**Goal:** Monitor integrations and track AI costs

**Integrations Page:**
- Tabbed interface per provider
- Sync status monitoring
- Error log viewer
- Retry mechanisms
- Health dashboard

**AI Usage Page:**
- Cost tracking with real OpenAI pricing
- Feature breakdown
- Top spenders identification
- Forecasting
- Export capabilities

### Phase 7: System Health & Activity Logs
**Goal:** Monitor system performance and activity

**System Health:**
- Job queue monitoring
- API performance metrics
- Database stats
- Redis stats
- Error logs

**Activity Logs:**
- Real-time activity stream
- Advanced filtering
- Full-text search
- Export functionality

### Phase 8: Polish & Production
**Goal:** Production-ready deployment

**Tasks:**
- Security audit
- Performance optimization
- Accessibility (WCAG AA)
- Cross-browser testing
- Mobile responsiveness
- Documentation
- Deployment to Vercel

## Technical Decisions

### Why Next.js 14?
- App Router for better performance
- Server Components by default
- Built-in optimization
- Vercel deployment ready

### Why ShadCN UI?
- Matches main app design system
- Customizable components
- Accessible by default
- TypeScript support

### Why Recharts?
- React-native charts
- Responsive
- Customizable
- Good documentation

### Why TanStack Table?
- Powerful filtering/sorting
- Virtual scrolling
- TypeScript support
- Headless UI

## Security Considerations

1. **Role-Based Access:**
   - Middleware checks on every route
   - Admin/Super Admin roles
   - Cannot impersonate other admins

2. **Audit Trail:**
   - Log all admin actions
   - Capture IP addresses
   - Immutable logs (2-year retention)

3. **Rate Limiting:**
   - Destructive actions throttled
   - Impersonation time-limited (30 min)

4. **Data Protection:**
   - Sensitive data masked for non-super admins
   - Costs visible only to super admins

## Performance Targets

- Dashboard load: < 2 seconds
- Query execution: < 1 second
- Chart rendering: < 500ms
- Table filtering: < 200ms
- Auto-refresh: No UI lag

## Next Steps

1. ✅ Remove old admin code
2. 🔄 Create new Next.js 14 app
3. ⏳ Install dependencies
4. ⏳ Set up Prisma schema extensions
5. ⏳ Build authentication middleware
6. ⏳ Create base layout
7. ⏳ Implement overview dashboard

## Notes

- Using Node.js v18.12.0 (requires Next.js 14.1.0 max)
- Sharing Prisma schema with main API
- Using existing PostgreSQL database
- Redis for caching analytics queries
- All data must be REAL (no mocks)
