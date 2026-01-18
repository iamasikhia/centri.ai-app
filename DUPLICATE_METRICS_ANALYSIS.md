# Duplicate Metrics Analysis

## Found Duplicates:

### 1. **Total Users** - Appears 3 times:
- Main Dashboard (Global KPIs): `kpis.totalUsers`
- Main Dashboard (Revenue Section): `revenue.totalUsers`
- User Insights Page: `stats.totalUsers`

### 2. **Paying Users / Free Users** - Appears 2 times:
- Main Dashboard (Revenue Section): `revenue.payingUsers`, `revenue.freeUsers`
- Revenue Page: Same metrics with more detail

### 3. **DAU/WAU/MAU** - Appears 2 times:
- Main Dashboard (Global KPIs): `kpis.dau`, `kpis.wau`, `kpis.mau`
- User Insights Page: `stats.dau`, `stats.wau`, `stats.mau`

### 4. **Tier Breakdown** - Appears 2 times:
- Main Dashboard (Revenue Section): `revenue.tierBreakdown`
- Revenue Page: Same with more detail

## Consolidation Plan:

1. **Remove Total Users from Global KPIs** - Already shown in Revenue section
2. **Keep DAU/WAU/MAU in Global KPIs** - High-level overview (detailed breakdown in User Insights)
3. **Simplify Revenue section on main dashboard** - Keep key metrics, link to Revenue page for details
4. **Consolidate user counts** - Use single source (revenue.totalUsers)


