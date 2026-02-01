# Quick Start - iOS Only

## Step 1: Complete Neon Database Setup

The `npx neonctl@latest init` command is waiting for your input. In your terminal:

1. **Select your editor** (or just press Enter to skip)
2. **It will create a `.neon` folder** with your database config
3. **Copy the DATABASE_URL** it gives you

## Step 2: Set Environment Variables

Create `apps/web/.env` (the web app is your API backend - you need it!):

```bash
OPENAI_API_KEY=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
DATABASE_URL=your-neon-url-here
```

## Step 3: Run Database Schema

```bash
cd apps/web
psql $DATABASE_URL -f database/schema.sql
```

Or copy/paste `apps/web/database/schema.sql` into Neon's SQL editor.

## Step 4: Start the API Server

```bash
cd apps/web
npm install
npm run dev
```

Keep this running! Your iOS app needs this API.

## Step 5: Start iOS App

In a new terminal:

```bash
cd apps/mobile
npm install
npm start
```

Then press `i` to open iOS simulator.

## Important Notes

- **The `apps/web` folder is your API backend** - don't delete it! Your iOS app calls these endpoints.
- The mobile app makes requests to `/api/...` which are served by the web server
- You can run the web server on your Mac and the iOS app will connect to it
