# 🚀 Quick Fix for Vercel Deployment

## The Problem
Your Vercel deployment shows a blank page with this error:
```
Uncaught Error: Missing Supabase environment variables. Please check your .env.local file.
```

## ⚡ URGENT: Manual Setup Required (2 minutes)

The `vercel.json` approach doesn't work for client-side environment variables. You MUST set them manually.

### 🎯 Immediate Solution

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click on your CleanLoop project**
3. **Go to Settings → Environment Variables**
4. **Add these 3 variables:**

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://vwypugutdwffdqveezdh.supabase.co` | ✅ All (Production, Preview, Development) |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y` | ✅ All (Production, Preview, Development) |
| `VITE_CONVEX_URL` | `https://first-hornet-199.convex.cloud` | ✅ All (Production, Preview, Development) |

5. **Click "Save" for each variable**
6. **Go to Deployments tab → Click "Redeploy" on latest deployment**
7. **Wait 2-3 minutes for redeployment**

## ✅ Expected Result
After manual setup and redeployment:
- ✅ No more blank page
- ✅ Application loads properly
- ✅ Login/registration works
- ✅ All features functional

## 🔍 Verification
1. Visit your Vercel URL
2. Check browser console (should be no Supabase errors)
3. Try registering a new user
4. Test core functionality

## 📝 Why Manual Setup is Required
- Vercel's `env` property in `vercel.json` is deprecated
- Client-side environment variables (VITE_*) must be set at build time
- They need to be configured in the Vercel dashboard to be available during build

## 🆘 Still Not Working?
1. **Clear browser cache** (Ctrl+Shift+R)
2. **Check all 3 variables are set** in Vercel dashboard
3. **Verify you selected ALL environments** for each variable
4. **Make sure you clicked "Redeploy"** after adding variables
5. **Wait for deployment to complete** (check Deployments tab)

---

**Detailed guide:** See `VERCEL_MANUAL_SETUP.md` for step-by-step instructions with more details.