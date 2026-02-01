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

Create a `.env` file in the `apps/mobile/` directory or use Expo's environment variables:

```bash
# Base API URL (usually your web app URL)
EXPO_PUBLIC_API_URL=http://localhost:5173

# Uploadcare (optional)
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=your-uploadcare-public-key

# Base URL for user content
EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL=https://your-cdn-url.com
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

1. Start the web server: `cd apps/web && npm run dev`
2. Check that the API endpoints are accessible
3. Try uploading a problem image to test OCR
4. Check the database to verify tables were created

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
