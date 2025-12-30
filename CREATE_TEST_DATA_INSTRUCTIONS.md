# Create Real Test Data for PDF Receipt Testing

## Method 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project: `vwypugutdwffdqveezdh`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Test Data SQL**
   - Copy and paste the contents of `REAL_USER_TEST_DATA.sql`
   - Click "Run" to execute the SQL

4. **Verify Data Creation**
   - The SQL will show verification results at the end
   - You should see counts for payments, subscriptions, and pickup requests

## Method 2: Manual Data Entry via App

1. **Navigate to Payment History**
   - Go to: http://localhost:3000/resident/payment-history
   - Click "Log Payment" button

2. **Add Sample Payments**
   - Add several payments with different amounts and methods:
     - ₦5,000 - Bank Transfer
     - ₦7,500 - Cash Payment  
     - ₦10,000 - Card Payment
     - ₦6,000 - Bank Transfer

## Method 3: Temporary RLS Disable (Advanced)

If you have admin access, you can temporarily disable RLS:

```sql
-- Disable RLS temporarily
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests DISABLE ROW LEVEL SECURITY;

-- Run the test data creation
-- (Insert statements from REAL_USER_TEST_DATA.sql)

-- Re-enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
```

## Testing PDF Receipts

Once you have real payment data:

1. **Navigate to Payment History**
   - URL: http://localhost:3000/resident/payment-history

2. **Test PDF Functions**
   - **Preview**: Click "Preview" button next to any payment
   - **Download**: Click "Download" button to save PDF
   - **Print**: Click "Print" button to open print dialog

3. **Test Buttons Still Available**
   - "Test Preview" - Opens sample PDF in new tab
   - "Test Download" - Downloads sample PDF file
   - "Test Print" - Opens print dialog with sample PDF

## Expected Results

With real data, you should see:
- ✅ Payment history table populated with real payments
- ✅ PDF receipts generated with actual payment details
- ✅ Professional PDF layout with CleanLoop branding
- ✅ All PDF functions (preview, download, print) working
- ✅ Dashboard showing real subscription and pickup data

## Troubleshooting

If PDF generation fails:
1. Check browser console for errors
2. Ensure jsPDF library is loaded
3. Try the test buttons first to verify PDF service works
4. Check that user profile data is complete

## Next Steps

After creating test data:
1. Test all PDF receipt functions
2. Verify dashboard shows real data
3. Test payment logging form
4. Confirm subscription and pickup data displays correctly