# Setup Right Now (iOS Only)

## 1. Finish Neon Setup
In your terminal where `npx neonctl@latest init` is running:
- Press Enter to skip editor selection (or choose one)
- It will give you a `DATABASE_URL` - copy it!

## 2. Create `apps/web/.env`
```bash
OPENAI_API_KEY=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
DATABASE_URL=paste-your-neon-url-here
```

## 3. Run Database Schema
Go to Neon dashboard → SQL Editor → paste contents of `apps/web/database/schema.sql` → Run

## 4. Start API Server (Terminal 1)
```bash
cd apps/web
npm install
npm run dev
```
**Keep this running!** Note the port (probably 5173)

## 5. Configure Mobile App
Create `apps/mobile/.env`:
```bash
EXPO_PUBLIC_BASE_URL=http://localhost:5173
```

## 6. Start iOS App (Terminal 2)
```bash
cd apps/mobile
npm install
npm start
```
Press `i` for iOS simulator

## Important
- **Don't delete `apps/web`** - it's your API backend!
- The mobile app calls `/api/...` which goes to the web server
- Both need to run at the same time

Done! 🎉
