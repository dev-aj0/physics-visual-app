# Environment Variables Setup

This document explains how to set up environment variables for the Physics Tutor app.

## Required Environment Variables

### Backend (Web App)

Create a `.env` file in the `apps/web/` directory with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# Base URL for user content (for image uploads)
EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL=https://your-cdn-url.com

# Uploadcare (optional, for image hosting)
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=your-uploadcare-public-key
```

### Mobile App

Create a `.env` file in the `apps/mobile/` directory:

```bash
# Base API URL - points to your backend (required)
# For iOS Simulator: use http://localhost:4000
# For physical device: use your Mac's IP, e.g. http://10.8.168.41:4000
EXPO_PUBLIC_BASE_URL=http://localhost:4000
```

## Getting API Keys

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)
6. Add it to your `.env` file as `OPENAI_API_KEY`

**Note**: OpenAI charges per API call. GPT-4o is recommended for best results but costs more than GPT-3.5.

### Database URL (Neon PostgreSQL)

1. Go to [Neon](https://neon.tech/) or use your own PostgreSQL database
2. Create a new project/database
3. Copy the connection string
4. Add it to your `.env` file as `DATABASE_URL`

### Running Database Schema

After setting up your database, run the SQL schema:

```bash
# Option 1: Using psql
psql $DATABASE_URL -f apps/web/database/schema.sql

# Option 2: Using Neon console
# Copy and paste the contents of apps/web/database/schema.sql into the SQL editor
```

## Security Notes

- **Never commit `.env` files to git** - they should be in `.gitignore`
- Keep your API keys secure
- Use environment variables for all sensitive data
- Consider using a secrets manager for production

## Testing the Setup

1. Start the backend: `cd apps/web && npm run dev` (runs on http://localhost:4000)
2. Verify backend is reachable:
   ```bash
   curl http://localhost:4000/api/health
   ```
   Should return `{"ok":true}`
3. Test problem list:
   ```bash
   curl http://localhost:4000/api/problems/list
   ```
   Should return JSON (or 500 if DB is misconfigured)
4. Start the mobile app: `cd apps/mobile && npm start`
5. Ensure `EXPO_PUBLIC_BASE_URL` in `apps/mobile/.env` matches the backend URL

## Troubleshooting

### "OPENAI_API_KEY is not set"
- Make sure your `.env` file is in the correct location (`apps/web/.env`)
- Restart your development server after adding environment variables
- Check that the variable name is exactly `OPENAI_API_KEY`

### Database Connection Errors
- Verify your `DATABASE_URL` is correct
- Check that your database is accessible
- Ensure SSL mode is set correctly (usually `?sslmode=require` for cloud databases)

### API Endpoint Not Found
- Make sure the web server is running
- Check that routes are properly registered
- Verify the API path matches (`/api/integrations/...`)

### "Everything Just Loading" / App Stuck Loading
- **Backend not running**: Start `npm run dev` in `apps/web` first
- **Wrong base URL**: Ensure `EXPO_PUBLIC_BASE_URL` in `apps/mobile/.env` matches your backend. For iOS Simulator use `http://localhost:4000`. For physical device, use your Mac's IP (e.g. `http://10.8.168.41:4000`) - find it with `ifconfig | grep "inet "`
- **Missing env vars**: Backend needs `DATABASE_URL` and `OPENAI_API_KEY`. Without them, API calls fail with 500
- **Health check**: Run `curl http://localhost:4000/api/health` to verify backend is reachable
