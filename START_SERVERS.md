# How to Start the Servers

## Quick Answer

**Terminal 1 - API Server (Backend):**
```bash
cd apps/web
npm run dev
```
Keep this running! It should start on `http://localhost:5173`

**Terminal 2 - iOS App:**
```bash
cd apps/mobile
npm start
```
Then press `i` to open iOS simulator

---

## About the Database URL

The **DATABASE_URL** is in `apps/web/.env`:
```
DATABASE_URL=postgresql://neondb_owner:npg_uiveV6K3CpYQ@ep-wandering-dream-ahxtd3te-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

This is **NOT** an "auth url" - it's the connection string to your Neon PostgreSQL database. It's already set up and working! ✅

---

## What Each Server Does

- **Web Server (`apps/web`)** = Your API backend
  - Handles all `/api/...` requests
  - Connects to OpenAI for AI features
  - Connects to Neon database
  - **You need this running for the app to work!**

- **Mobile App (`apps/mobile`)** = Your iOS app
  - Makes requests to the web server
  - Shows the UI
  - Handles camera/image uploads

---

## Troubleshooting

**If API server won't start:**
- Make sure port 5173 isn't already in use
- Check that `apps/web/.env` has both `OPENAI_API_KEY` and `DATABASE_URL`

**If mobile app can't connect:**
- Make sure API server is running first
- Check that `apps/mobile/.env` has `EXPO_PUBLIC_BASE_URL=http://localhost:5173`
