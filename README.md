# Cafe Bajibun - Deployment Guide

This application is built with React, Vite, Express, and Neon PostgreSQL.

## Deployment to Vercel

1. **GitHub Repository**: Push this code to a new GitHub repository.
2. **Vercel Project**: Create a new project on Vercel and connect it to your GitHub repository.
3. **Environment Variables**: In the Vercel project settings, add the following environment variable:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
4. **Build Settings**: Vercel should automatically detect the Vite build settings.
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Deploy**: Click "Deploy".

## Database Setup (Neon)

1. Create a new project on [Neon](https://neon.tech).
2. Get your `DATABASE_URL` from the Neon dashboard.
3. The application will automatically initialize the required tables on the first run.

## Local Development

1. Install dependencies: `npm install`
2. Set up your `.env` file with `DATABASE_URL`.
3. Run the development server: `npm run dev`
