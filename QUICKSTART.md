# 🎯 Quick Start - Centri

## Your Centri MVP is Ready! 🎉

### ✅ What's Running

- **Dashboard**: http://localhost:3000
- **Database**: SQLite at `prisma/dev.db`
- **Extension**: Ready to load in Chrome

---

## 🚀 Next Steps (2 minutes)

### 1. Load Chrome Extension

```bash
# Open Chrome and go to:
chrome://extensions/

# Then:
1. Enable "Developer mode" (top right)
2. Click "Load unpacked"
3. Select: /Users/iseoluwaasikhia/centri.ai-app/centri.ai-app/extension
4. Pin the extension to your toolbar
```

### 2. Start Tracking

- Browse normally (GitHub, Gmail, Notion, etc.)
- Extension tracks active time automatically
- Click extension icon to see popup stats
- Refresh dashboard to see insights

### 3. View Your Day

Visit: **http://localhost:3000**

You'll see:
- Total active time
- Work energy breakdown (5 categories)
- Flow timeline
- Daily insight

---

## 🎨 Why It Looks Empty Now

The dashboard shows **0m** because you just installed it!

**To see real data:**
1. Load the Chrome extension
2. Browse for 5-10 minutes
3. Extension auto-syncs every 5 minutes
4. Refresh the dashboard

---

## 📂 Project Structure

```
centri/
├── app/              → Next.js dashboard
├── components/       → React UI components
├── extension/        → Chrome extension (READY)
│   ├── background/   → Tracking logic
│   ├── content/      → Activity detection
│   └── ui/           → Popup interface
├── lib/              → Utilities
├── prisma/           → Database
└── package.json
```

---

## 🔐 Privacy Features

✅ **Tracks**: Domain, category, duration  
❌ **Never tracks**: Content, keystrokes, URLs, screenshots  
❌ **Ignores**: Incognito tabs automatically

---

## 🛠️ Development Commands

```bash
# Run dashboard
npm run dev

# Rebuild extension (after code changes)
./build-extension.sh

# View database
npx prisma studio

# Reset database
rm prisma/dev.db
npx prisma db push
```

---

## 📖 Full Documentation

- **Setup Guide**: `SETUP.md` (detailed instructions)
- **README**: `README.md` (technical overview)

---

## 🎯 Core Philosophy

> "Not time tracking. Not surveillance. Just a daily mirror."

Centri helps you understand where your work energy went—with zero judgment.

---

**Ready to see where your day goes?** Load the extension and start browsing! 🚀
