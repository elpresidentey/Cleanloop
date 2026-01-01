# 🚨 URGENT: Manual Vercel Environment Setup Required

## The Issue
The `vercel.json` approach doesn't work for client-side environment variables. You MUST set them manually in the Vercel dashboard.

## ⚡ IMMEDIATE ACTION REQUIRED

### Step 1: Go to Vercel Dashboard
1. Open [vercel.com](https://vercel.com) in your browser
2. Sign in to your account
3. Find your **CleanLoop** project and click on it

### Step 2: Access Environment Variables
1. In your project dashboard, click the **"Settings"** tab
2. In the left sidebar, click **"Environment Variables"**

### Step 3: Add Each Variable (Do this 3 times)

**VARIABLE 1:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://vwypugutdwffdqveezdh.supabase.co`
- **Environments:** Check ALL boxes (Production, Preview, Development)
- Click **"Save"**

**VARIABLE 2:**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y`
- **Environments:** Check ALL boxes (Production, Preview, Development)
- Click **"Save"**

**VARIABLE 3:**
- **Name:** `VITE_CONVEX_URL`
- **Value:** `https://first-hornet-199.convex.cloud`
- **Environments:** Check ALL boxes (Production, Preview, Development)
- Click **"Save"**

### Step 4: Redeploy
1. Go to the **"Deployments"** tab
2. Find your latest deployment
3. Click the **3 dots menu** (⋯) next to it
4. Click **"Redeploy"**
5. Confirm the redeployment

### Step 5: Wait and Test
1. Wait 2-3 minutes for the deployment to complete
2. Visit your Vercel URL
3. The blank page should be fixed!

## 🔍 Verification Checklist

After redeployment, check:
- [ ] No blank page
- [ ] No console errors about Supabase
- [ ] Can see the CleanLoop homepage
- [ ] Registration/login forms work

## 📱 Alternative: Use Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to your project
cd cleanloop-platform

# Add environment variables
vercel env add VITE_SUPABASE_URL
# When prompted, enter: https://vwypugutdwffdqveezdh.supabase.co
# Select: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
# When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y
# Select: Production, Preview, Development

vercel env add VITE_CONVEX_URL
# When prompted, enter: https://first-hornet-199.convex.cloud
# Select: Production, Preview, Development

# Redeploy
vercel --prod
```

## ❗ Important Notes

1. **Environment variables are case-sensitive** - make sure to type them exactly as shown
2. **Select ALL environments** (Production, Preview, Development) for each variable
3. **You MUST redeploy** after adding variables - they don't take effect automatically
4. **Wait for deployment to complete** before testing

## 🆘 Still Having Issues?

If you still see the blank page after following these steps:

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check Vercel deployment logs** for any errors
3. **Verify all 3 variables are set** in the Environment Variables section
4. **Make sure you selected all environments** for each variable
5. **Try incognito/private browsing mode**

The application should work immediately after proper environment variable setup and redeployment.