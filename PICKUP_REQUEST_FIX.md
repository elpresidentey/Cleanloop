# Pickup Request Schema Fix

## Issue
Getting error when creating pickup requests:
```
Failed to create pickup request: Could not find the 'notes' column of 'pickup_requests' in the schema cache
```

## Root Cause
The pickup service was missing required location fields (`area`, `street`, `house_number`) when inserting into the database. The database schema requires these fields as NOT NULL, but the service was only inserting `user_id`, `scheduled_date`, `notes`, and `status`.

## Fix Applied
Updated `PickupService.create()` method to include all required fields:
- ✅ Added `area` from `input.location.area`
- ✅ Added `street` from `input.location.street`  
- ✅ Added `house_number` from `input.location.houseNumber`
- ✅ Added `coordinates` from `input.location.coordinates` (converted to PostGIS POINT format)

## Database Schema
The `pickup_requests` table requires these NOT NULL fields:
- `user_id` (UUID, foreign key to users)
- `scheduled_date` (timestamp)
- `area` (text)
- `street` (text)
- `house_number` (text)
- `status` (text, defaults to 'requested')

Optional fields:
- `notes` (text, can be null)
- `coordinates` (PostGIS POINT)
- `collector_id` (UUID, can be null)
- `completed_at` (timestamp, can be null)

## Expected Result
After the fix:
- ✅ Pickup requests should create successfully
- ✅ All location data will be properly stored
- ✅ No more schema cache errors
- ✅ Pickup requests will include user's address information

## Testing
1. Try creating a pickup request from the resident dashboard
2. Verify the request appears in the pickup list
3. Check that location information is correctly stored
4. Confirm no more "schema cache" errors

The fix ensures that all required database fields are populated when creating pickup requests.