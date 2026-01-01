# Supabase Connection Test

## Issue
Getting 406 error when trying to fetch user profile:
```
vwypugutdwffdqveezdh.supabase.co/rest/v1/users?select=*&id=eq.3dffed4e-5ed3-46f6-8164-37b9ed04086e:1
Failed to load resource: the server responded with a status of 406 ()
```

## Potential Causes
1. **Custom fetch function** - The AbortSignal.timeout might be interfering
2. **Database schema mismatch** - The users table might not exist or have different structure
3. **RLS (Row Level Security) policies** - Might be blocking the query
4. **API key permissions** - The anon key might not have proper access

## Fixes Applied
1. ✅ Removed custom fetch function from Supabase client
2. ✅ Added debug logging to getUserProfile method
3. ⏳ Need to test connection and check database structure

## Next Steps
1. Test the application after removing custom fetch
2. Check browser console for debug logs
3. If still failing, check Supabase dashboard:
   - Verify users table exists
   - Check RLS policies
   - Verify API key permissions

## Quick Database Check
You can test the connection directly in Supabase dashboard:
1. Go to https://vwypugutdwffdqveezdh.supabase.co
2. Navigate to SQL Editor
3. Run: `SELECT * FROM users LIMIT 1;`
4. Check if the table exists and has data

## Expected Resolution
After removing the custom fetch function, the 406 error should be resolved and user login should work properly.