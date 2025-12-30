# Manual Database Setup Guide

## Quick Setup (Recommended)

Since the Supabase CLI isn't installed and the client can't execute raw SQL, follow these steps:

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/vwypugutdwffdqveezdh/sql
2. Log in to your Supabase account

### Step 2: Run the Complete Setup Script
1. Open the file `COMPLETE_DATABASE_SETUP.sql` in this project
2. Copy ALL the contents (Ctrl+A, Ctrl+C)
3. Paste into the Supabase SQL Editor
4. Click "Run" button

### Step 3: Verify Setup
After running the script, you should see:
- ✅ All tables created successfully
- ✅ Sample data inserted for testing
- ✅ Row Level Security (RLS) policies applied

### Expected Tables
The script will create these tables:
- `subscriptions` - User subscription plans
- `pickup_requests` - Waste pickup requests
- `payments` - Payment records
- `complaints` - User complaints
- `audit_logs` - System audit trail
- `notification_preferences` - User notification settings
- `error_reports` - Application error tracking

### Test Data
The script includes sample data for user ID: `f8f74890-7f04-471a-b6f0-b653b90b3dcc`
- 1 active weekly subscription
- 2 pickup requests (1 scheduled, 1 completed)

## Alternative: Install Supabase CLI

If you want to use the CLI in the future:

### Windows (using Scoop)
```bash
# Install Scoop first
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Windows (using Chocolatey)
```bash
choco install supabase
```

### After CLI Installation
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref vwypugutdwffdqveezdh

# Run migrations
supabase db push
```

## Troubleshooting

### If tables still don't appear:
1. Check the SQL Editor for any error messages
2. Ensure you're connected to the correct project
3. Try running individual table creation statements

### If RLS policies cause issues:
1. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
   ```
2. Re-enable after testing:
   ```sql
   ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
   ```

### If you see permission errors:
1. Make sure you're using the correct Supabase project
2. Check that your user has admin access to the project

## Next Steps

After running the database setup:
1. Start the development server: `npm run dev`
2. Try logging in with your test account
3. The dashboard should now load without errors
4. All features should work properly

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all tables exist in Supabase Dashboard > Table Editor
3. Ensure RLS policies are properly configured