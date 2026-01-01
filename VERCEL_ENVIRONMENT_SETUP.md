# Vercel Environment Variables Setup

## Issue
The deployed application shows a blank page with the error:
```
Uncaught Error: Missing Supabase environment variables. Please check your .env.local file.
```

This happens because Vercel doesn't automatically use your local `.env.local` file. You need to configure environment variables in the Vercel dashboard.

## Solution: Configure Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to your Vercel project dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Navigate to your CleanLoop project

2. **Access Environment Variables**
   - Click on your project
   - Go to "Settings" tab
   - Click "Environment Variables" in the sidebar

3. **Add the following environment variables:**

   **Variable Name:** `VITE_SUPABASE_URL`
   **Value:** `https://vwypugutdwffdqveezdh.supabase.co`
   **Environment:** Production, Preview, Development (check all)

   **Variable Name:** `VITE_SUPABASE_ANON_KEY`
   **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y`
   **Environment:** Production, Preview, Development (check all)

   **Variable Name:** `VITE_CONVEX_URL`
   **Value:** `https://first-hornet-199.convex.cloud`
   **Environment:** Production, Preview, Development (check all)

   **Variable Name:** `NODE_ENV`
   **Value:** `production`
   **Environment:** Production only

4. **Save and Redeploy**
   - Click "Save" for each variable
   - Go to "Deployments" tab
   - Click "Redeploy" on your latest deployment (or push a new commit)

### Method 2: Via Vercel CLI

If you have Vercel CLI installed, you can set environment variables from command line:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add VITE_SUPABASE_URL production
# Enter: https://vwypugutdwffdqveezdh.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production  
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y

vercel env add VITE_CONVEX_URL production
# Enter: https://first-hornet-199.convex.cloud

vercel env add NODE_ENV production
# Enter: production

# Redeploy
vercel --prod
```

### Method 3: Via vercel.json Configuration

Create a `vercel.json` file in your project root:

```json
{
  "env": {
    "VITE_SUPABASE_URL": "https://vwypugutdwffdqveezdh.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y",
    "VITE_CONVEX_URL": "https://first-hornet-199.convex.cloud",
    "NODE_ENV": "production"
  }
}
```

## Important Notes

### Security Considerations
- The `VITE_SUPABASE_ANON_KEY` is safe to expose in client-side code (it's designed for this)
- The Supabase URL is also safe to expose
- These are public keys meant for frontend applications

### Environment Variable Naming
- Vite requires environment variables to be prefixed with `VITE_` to be accessible in the browser
- This is why we use `VITE_SUPABASE_URL` instead of just `SUPABASE_URL`

### After Setting Variables
1. **Redeploy your application** - Environment variables only take effect after redeployment
2. **Check the deployment logs** - Look for any remaining errors
3. **Test the application** - Verify that the blank page is resolved

## Verification Steps

After setting up environment variables and redeploying:

1. **Check browser console** - The Supabase error should be gone
2. **Test authentication** - Try to register/login
3. **Check network requests** - Should see requests to your Supabase URL
4. **Verify functionality** - Test core features like user registration

## Troubleshooting

If you still see issues after setting environment variables:

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Check Vercel deployment logs** for any build errors
3. **Verify variable names** are exactly correct (case-sensitive)
4. **Ensure all environments** (Production, Preview, Development) are selected
5. **Wait a few minutes** for changes to propagate

## Next Steps

Once environment variables are configured:
1. Test user registration and login
2. Verify database connections work
3. Test PDF generation functionality
4. Check all major features work in production

The application should now load properly without the blank page error.