# Physics Tutor App - Complete Setup Guide

This guide will help you set up the entire Physics Tutor app with AI functionality, OCR, and visual diagram generation.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Expo CLI (for mobile development)

## Step 1: Database Setup

1. **Create a PostgreSQL database** (use [Neon](https://neon.tech/) for a free cloud database)

2. **Run the database schema:**
   ```bash
   # Option 1: Using psql
   psql $DATABASE_URL -f apps/web/database/schema.sql
   
   # Option 2: Copy the SQL from apps/web/database/schema.sql and run it in your database console
   ```

3. **Verify tables were created:**
   - `problems`
   - `solutions`
   - `solution_steps`
   - `visuals`
   - `tutor_conversations`
   - `tutor_messages`

## Step 2: Environment Variables

### Web App (`apps/web/.env`)

Create a `.env` file in `apps/web/`:

```bash
# Database connection string
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# OpenAI API Key (required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Base URL for user content (for image uploads)
EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL=https://your-cdn-url.com

# Uploadcare (optional, for image hosting)
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=your-uploadcare-public-key
```

### Mobile App (`apps/mobile/.env`)

Create a `.env` file in `apps/mobile/`:

```bash
# Base API URL (your web app URL)
EXPO_PUBLIC_API_URL=http://localhost:5173

# Uploadcare (optional)
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=your-uploadcare-public-key

# Base URL for user content
EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL=https://your-cdn-url.com
```

## Step 3: Install Dependencies

```bash
# Install web app dependencies
cd apps/web
npm install

# Install mobile app dependencies
cd ../mobile
npm install
```

## Step 4: Start the Development Servers

### Terminal 1: Web Server (Backend API)

```bash
cd apps/web
npm run dev
```

The web server will start on `http://localhost:5173` (or another port if 5173 is taken).

### Terminal 2: Mobile App (Expo)

```bash
cd apps/mobile
npm start
```

This will start the Expo development server. You can:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your phone

## Step 5: Test the Setup

1. **Test Image Upload:**
   - Open the mobile app
   - Tap "Take a Photo" or "Upload Image"
   - Select or take a photo of a physics problem
   - Tap "Analyze Problem"

2. **Verify OCR:**
   - The app should extract text from the image using OpenAI Vision API
   - Check the console for any errors

3. **Test Problem Solving:**
   - After analysis, you should see step-by-step solutions
   - Tap on steps to reveal them individually

4. **Test Visual Generation:**
   - On the problem detail page, tap "Generate Visuals"
   - Then tap "Generate Diagram" on each visual
   - SVG diagrams should appear

5. **Test AI Tutor:**
   - Tap the chat icon on a problem
   - Ask a question about the problem
   - The AI tutor should respond with helpful guidance

## API Endpoints

The app uses these API endpoints:

- `POST /api/problems/analyze` - Analyze a problem (OCR + solution generation)
- `GET /api/problems/get?id={id}` - Get problem details
- `GET /api/problems/list` - List all problems
- `POST /api/problems/generate-visuals` - Generate visual descriptions
- `POST /api/problems/generate-diagrams` - Generate SVG diagrams
- `POST /api/tutor/chat` - Chat with AI tutor
- `GET /api/tutor/get-conversation?problemId={id}` - Get conversation history

## Features Implemented

✅ **OCR (Optical Character Recognition)**
- Uses OpenAI Vision API to extract text from images
- Supports both image upload and camera capture

✅ **AI Problem Solving**
- Uses GPT-4o to solve physics problems step-by-step
- Structured output with steps, explanations, and formulas
- Reveal steps individually for learning

✅ **Visual Diagram Generation**
- AI generates descriptions of relevant physics diagrams
- SVG diagram generation for free body diagrams, projectile motion, etc.
- Pastel color scheme (orange and blue)

✅ **AI Tutor Chat**
- Interactive chat interface
- Context-aware responses based on the problem
- Streaming responses for better UX
- Socratic method for teaching

✅ **Modern UI**
- Pastel orange (#FFB88C) and blue (#A8D5E2) color scheme
- Smooth animations and transitions
- Step-by-step reveal functionality
- Responsive design

## Troubleshooting

### "OPENAI_API_KEY is not set"
- Make sure `.env` file exists in `apps/web/`
- Restart the web server after adding environment variables
- Check that the variable name is exactly `OPENAI_API_KEY`

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check that the database is accessible
- Ensure SSL mode is set correctly (`?sslmode=require` for cloud databases)

### API Endpoint Not Found
- Make sure the web server is running
- Check that routes are properly registered
- Verify the API path matches (`/api/integrations/...`)

### Images Not Uploading
- Check that `EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL` is set
- Verify upload endpoint is working
- Check network connectivity

### Diagrams Not Generating
- Verify OpenAI API key is valid
- Check API rate limits
- Look at server console for error messages

## Cost Considerations

**OpenAI API Costs:**
- GPT-4o Vision: ~$0.01-0.03 per image analysis
- GPT-4o Chat: ~$0.005-0.015 per 1K tokens
- Typical problem analysis: ~$0.05-0.15

**Recommendations:**
- Use GPT-4o for best results (recommended)
- Consider caching responses for similar problems
- Monitor usage in OpenAI dashboard

## Next Steps

1. **Deploy the web app** to Vercel, Railway, or similar
2. **Set up production database** with proper backups
3. **Configure image CDN** for faster uploads
4. **Add user authentication** (optional)
5. **Implement AR features** (future enhancement)
6. **Add more diagram types** (circuits, waves, etc.)

## Architecture Overview

```
Mobile App (React Native/Expo)
    ↓
Web API (React Router + Hono)
    ↓
OpenAI API (GPT-4o + Vision)
    ↓
PostgreSQL Database (Neon)
```

## Support

For issues or questions:
1. Check the console logs for errors
2. Verify all environment variables are set
3. Ensure database schema is created
4. Test API endpoints directly with curl/Postman

Happy coding! 🚀
