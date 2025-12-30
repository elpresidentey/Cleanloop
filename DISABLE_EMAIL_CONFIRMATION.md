# Disable Email Confirmation for Development

## The Issue
Supabase requires email confirmation by default, which is why you're getting "Email not confirmed" errors.

## Quick Fix

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard/project/vwypugutdwffdqveezdh

2. **Navigate to Authentication > Settings**

3. **Find "Email Confirmation" section**

4. **Turn OFF "Enable email confirmations"**

5. **Click "Save"**

## Alternative: Confirm Existing Users

If you want to keep email confirmation enabled but fix existing users:

1. **Go to Authentication > Users**
2. **Find your test users**
3. **Click on each user**
4. **Toggle "Email Confirmed" to ON**
5. **Save**

## Test After Fix

After disabling email confirmation, try registering and logging in again. The profile loading should work properly.