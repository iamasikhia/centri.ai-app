# 🚀 Centri Setup Guide

Congratulations! Centri is fully set up and ready to use.

## ✅ What's Been Built

### 1. **Chrome Extension** (Privacy-First Tracker)
   - ✅ Service worker for background tracking
   - ✅ Activity detection via content scripts
   - ✅ Domain categorization (communication, building, research, meetings, admin)
   - ✅ Popup UI (black & white, YC-style)
   - ✅ Local storage and sync to backend

### 2. **Next.js Dashboard** (Beautiful UI)
   - ✅ Hero section with total active time
   - ✅ Work energy cards (5 categories)
   - ✅ Timeline visualization
   - ✅ Output section (placeholder for integrations)
   - ✅ AI-generated daily insights
   - ✅ Black & white minimal aesthetic

### 3. **Backend & Database**
   - ✅ SQLite database (`prisma/dev.db`)
   - ✅ Prisma ORM with complete schema
   - ✅ API endpoint for extension sync (`/api/sync`)
   - ✅ Stub authentication system

---

## 📦 Installation Instructions

### Step 1: Load Chrome Extension

1. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode** (toggle in top right)

3. **Click "Load unpacked"**

4. **Select the extension folder**:
   ```
   /Users/iseoluwaasikhia/centri.ai-app/centri.ai-app/extension
   ```

5. **Pin the extension** to your toolbar for easy access

### Step 2: Start Using Centri

1. **Dashboard is live**: [http://localhost:3000](http://localhost:3000)

2. **Browse normally** - The extension tracks your active time automatically

3. **Check the popup** - Click the Centri icon to see today's summary

4. **View dashboard** - Refresh to see aggregated data

---

## 🎯 How It Works

### Privacy Guarantees

**What We Track:**
- ✅ Domain only (e.g., `github.com`)
- ✅ Category (automatically categorized)
- ✅ Duration (rounded to seconds)
- ✅ When browser is focused and you're active

**What We DON'T Track:**
- ❌ Page titles or URLs
- ❌ Content or text
- ❌ Keystrokes
- ❌ Screenshots
- ❌ Incognito tabs

### Data Flow

1. **Extension** tracks active time per domain
2. **Content script** detects user activity (mouse, keyboard, scroll)
3. **Background worker** aggregates data locally
4. **Sync service** sends summary to backend every 5 minutes
5. **Dashboard** displays beautiful insights

---

## 🎨 Dashboard Features

### Today Page (`/`)

#### Hero Section
- Total active time for today
- Longest focus window (e.g., "10:40am–1:05pm")

#### Work Energy Cards
Five categories with time spent and % of day:
- **Communication** - Email, Slack, Zoom
- **Building** - GitHub, Figma, IDEs
- **Research** - Google, Stack Overflow, YouTube
- **Meetings** - Calendar, Zoom meetings
- **Admin** - Notion, Trello, docs

#### Flow of the Day
- Horizontal timeline showing work blocks
- Grayscale visualization
- Hover to see category

#### What Came Out of It
- Placeholder for future integrations:
  - Emails sent (Gmail API)
  - Meetings attended (Calendar API)
  - Documents edited (Google Docs API)

#### Daily Insight
- AI-generated reflection based on your day
- No judgment, just clarity

---

## 🔧 Customization

### Adding Custom Domains

Edit `extension/background/rules.ts`:

```typescript
export const CATEGORY_RULES = {
  communication: ['slack.com', 'discord.com', 'your-tool.com'],
  building: ['github.com', 'gitlab.com', 'your-ide.com'],
  research: ['stackoverflow.com', 'reddit.com', 'your-resource.com'],
  meetings: ['zoom.us', 'meet.google.com', 'your-meeting-tool.com'],
  admin: ['notion.so', 'asana.com', 'your-admin-tool.com']
};
```

After editing, rebuild:
```bash
./build-extension.sh
```

Then reload the extension in Chrome.

---

## 🐛 Troubleshooting

### Extension not tracking?

1. Check if extension is enabled in `chrome://extensions/`
2. Make sure you're not in Incognito mode
3. Check extension popup - is tracking paused?
4. Open DevTools on background page to see console logs

### Dashboard showing no data?

1. Extension needs a few minutes to collect data
2. Check that sync is working (watch extension console)
3. Ensure localhost:3000 is running
4. Try browsing for 1-2 minutes, then refresh dashboard

### Build errors?

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild database
npx prisma db push

# Rebuild extension
./build-extension.sh
```

---

## 🚧 Future Enhancements

### Near-term
- [ ] Magic link authentication
- [ ] Settings page (pause times, custom categories)
- [ ] Weekly/monthly views
- [ ] Export data as JSON/CSV

### Long-term
- [ ] Gmail integration (emails sent count)
- [ ] Google Calendar integration (meetings)
- [ ] Google Docs integration (docs edited)
- [ ] Slack integration (messages sent)
- [ ] Team insights (optional, privacy-first)

---

## 📝 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (dev), Postgres-ready
- **Extension**: Chrome Manifest v3, TypeScript
- **Design**: Black & white only, YC aesthetic

---

## 🎯 Product Philosophy

> "This is not time tracking, not surveillance, not productivity scoring. It is a daily mirror."

Centri helps knowledge workers understand where their work energy went, without judgment or pressure. Just clarity.

---

**Built for makers who want reflection, not metrics.**

Enjoy using Centri! 🎉
