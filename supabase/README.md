# CleanLoop Database Migrations

This directory contains SQL migration files for setting up the CleanLoop platform database in Supabase.

## Database Schema Overview

The CleanLoop platform uses the following tables:

1. **users** - Extended user profiles with role-based access (resident, collector, admin)
2. **subscriptions** - Subscription plans and billing information
3. **pickup_requests** - Waste collection pickup requests and scheduling
4. **payments** - Payment records and transaction history
5. **complaints** - Customer complaints and issue tracking

## How to Apply Migrations

### Option 1: Run All Migrations at Once (Recommended)

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file `000_run_all_migrations.sql`
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click "Run" to execute all migrations

This will create all tables, indexes, Row Level Security (RLS) policies, triggers, and helper views.

### Option 2: Run Individual Migrations

If you prefer to run migrations individually, execute them in this order:

1. `001_create_users_table.sql`
2. `002_create_subscriptions_table.sql`
3. `003_create_pickup_requests_table.sql`
4. `004_create_payments_table.sql`
5. `005_create_complaints_table.sql`

## Row Level Security (RLS) Policies

All tables have RLS enabled with the following access patterns:

### Users Table
- Users can view and update their own profile
- Collectors can view resident profiles
- Admins can view and update all profiles

### Subscriptions Table
- Users can view, create, and update their own subscriptions
- Collectors can view customer subscriptions
- Admins can view and update all subscriptions

### Pickup Requests Table
- Users can view, create, and update their own pickup requests
- Collectors can view and update assigned pickup requests
- Collectors can view unassigned requests
- Admins can view and update all pickup requests

### Payments Table
- Users can view and create their own payment records
- Collectors can view payment records of assigned customers
- Admins can view and update all payments

### Complaints Table
- Users can view and create complaints for their own pickups
- Collectors can view complaints related to their pickups
- Admins can view and update all complaints

## Database Triggers

The schema includes several automatic triggers:

1. **updated_at triggers** - Automatically update the `updated_at` timestamp on all tables
2. **completed_at trigger** - Automatically set `completed_at` when pickup status changes to 'picked_up'
3. **resolved_at trigger** - Automatically set `resolved_at` when complaint status changes to 'resolved' or 'closed'
4. **handle_new_user trigger** - Automatically create user profile when auth user is created

## Helper Views

Two views are created for common queries:

1. **user_pickup_summary** - Summary of pickup statistics per resident
2. **collector_performance** - Performance metrics for collectors

## Data Validation

The schema includes comprehensive validation:

- Email format validation
- Nigerian phone number format validation (+234 or 0 followed by 7/8/9 and 9 digits)
- Positive amounts for payments and subscriptions
- Date constraints (scheduled dates must be in the future)
- Text length constraints
- URL format validation for photo URLs
- Status and role enums with CHECK constraints

## Foreign Key Relationships

- `subscriptions.user_id` → `users.id` (CASCADE DELETE)
- `pickup_requests.user_id` → `users.id` (CASCADE DELETE)
- `pickup_requests.collector_id` → `users.id` (SET NULL)
- `payments.user_id` → `users.id` (CASCADE DELETE)
- `complaints.user_id` → `users.id` (CASCADE DELETE)
- `complaints.pickup_id` → `pickup_requests.id` (CASCADE DELETE)

## Indexes

All tables have appropriate indexes for:
- Foreign keys
- Status fields
- Date fields
- Frequently queried fields (email, area, etc.)

This ensures optimal query performance for the application.

## Testing the Schema

After running the migrations, you can verify the setup by:

1. Checking that all tables exist in the Table Editor
2. Verifying RLS policies are enabled (green shield icon)
3. Testing authentication and user creation
4. Attempting to create records in each table

## Troubleshooting

If you encounter errors:

1. **"relation already exists"** - The table was already created. You can either drop it first or skip that migration.
2. **"permission denied"** - Ensure you're running the SQL as a database admin.
3. **"foreign key constraint violation"** - Ensure migrations are run in the correct order.

## Next Steps

After setting up the database:

1. Configure your `.env.local` file with Supabase credentials
2. Test authentication flows
3. Implement data access services in the application
4. Test RLS policies with different user roles
