# Backend Services Setup Guide

This guide explains how to set up the backend services (Supabase and Convex) for the CleanLoop platform.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account
- A Convex account

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `cleanloop-platform`
   - Database Password: (generate a secure password)
   - Region: Choose closest to your users
5. Click "Create new project"

### 2. Get Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Project API Key (anon, public)

### 3. Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Configure the following:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add `http://localhost:5173/**`
3. Enable Email authentication:
   - Go to Authentication > Providers
   - Ensure "Email" is enabled
   - Configure email templates if needed

## Convex Setup

### 1. Create a Convex Project

1. Go to [convex.dev](https://convex.dev) and sign up/login
2. Install Convex CLI: `npm install -g convex`
3. In your project directory, run: `npx convex dev`
4. Follow the prompts to create a new project
5. Choose a project name: `cleanloop-platform`

### 2. Get Convex URL

1. After setup, your Convex deployment URL will be displayed
2. It will look like: `https://your-deployment.convex.cloud`

## Environment Configuration

### 1. Copy Environment File

```bash
cp .env.example .env.local
```

### 2. Update Environment Variables

Edit `.env.local` with your actual values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Convex Configuration  
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud

# Environment
NODE_ENV=development
```

## Database Schema Setup

The database schema will be created in a later task. For now, the basic authentication setup is complete.

## Testing the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:5173` in your browser

3. Check the "Backend Services Status" section:
   - Supabase should show "Connected"
   - Convex should show "Configured"

## Troubleshooting

### Supabase Connection Issues

- Verify your Project URL and API key are correct
- Check that your project is not paused (free tier limitation)
- Ensure your internet connection is stable

### Convex Configuration Issues

- Make sure you've run `npx convex dev` at least once
- Verify the Convex URL is correct in your environment file
- Check that your Convex project is deployed

### Environment Variable Issues

- Ensure all required variables are set in `.env.local`
- Restart your development server after changing environment variables
- Check that variable names start with `VITE_` for client-side access

## Next Steps

After completing this setup:

1. The authentication system will be ready for user registration and login
2. Real-time updates via Convex will be configured
3. The database schema will be created in the next task
4. Row Level Security policies will be implemented

## Security Notes

- Never commit `.env.local` to version control
- Use different projects/databases for development and production
- Regularly rotate API keys and passwords
- Enable Row Level Security in Supabase before going to production