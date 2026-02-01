# How to Start the Physics Tutor App

## Close all terminals first!

## Step 1: Start the API Server

Open a NEW terminal and run:

```bash
cd /Users/MAC/Downloads/create-anything/apps/web
npm run dev
```

**Wait for this message:**
```
➜  Local:   http://localhost:4000/
➜  Network: http://10.8.174.19:4000/
```

**Keep this terminal open!**

## Step 2: Start the Mobile App

Open a SECOND terminal and run:

```bash
cd /Users/MAC/Downloads/create-anything/apps/mobile
npm start
```

Then press `i` for iOS simulator.

## If you get port errors

If port 4000 is already in use, the server will use a different port. Update the mobile `.env` file:

```bash
echo 'EXPO_PUBLIC_BASE_URL=http://10.8.174.19:XXXX' > apps/mobile/.env
```

Replace `XXXX` with the actual port shown in the terminal.

## Current Configuration

- **API Server:** `http://10.8.174.19:4000`
- **Mobile .env:** `EXPO_PUBLIC_BASE_URL=http://10.8.174.19:4000`

## Troubleshooting

1. Make sure BOTH servers are running
2. Make sure the port in mobile `.env` matches the API server port
3. Your phone/simulator must be on the same WiFi network as your computer
