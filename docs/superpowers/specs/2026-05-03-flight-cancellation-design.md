# Flight Cancellation Feature Design

## Overview
Allow users to cancel their flight bookings from the profile page with tiered refund based on time until departure.

## Cancellation Policy
- **7+ days before departure**: 100% refund
- **3-7 days before departure**: 50% refund
- **<3 days before departure**: 0% refund (no cancellation allowed)

## Architecture

### Backend (`backend/api/cancel_booking.php`)

**Endpoint**: `POST /backend/api/cancel_booking.php`

**Request Body**:
```json
{
  "booking_id": 123
}
```

**Response**:
```json
{
  "success": true,
  "refund_amount": 150.00,
  "refund_percentage": 100,
  "message": "Booking cancelled successfully. Full refund of $150.00 will be processed."
}
```

**Logic**:
1. Validate user is authenticated (session check)
2. Verify booking ownership
3. Extract departure date from `flight_snapshot.slices[0].segments[0].departing_at`
4. Calculate days until departure
5. Determine refund percentage:
   - If days >= 7: 100%
   - If days >= 3: 50%
   - If days < 3: 0% (reject cancellation)
6. Call Duffel API to cancel order: `DELETE /air/orders/{order_id}`
7. Update booking status to `cancelled` (or `refunded` if refund > 0)
8. Insert refund record in `transaction` table

### Frontend Updates (`assets/js/profile.js`)

**UI Changes**:
- Add "Cancel" button on booking cards for active bookings
- Show cancel button only if:
  - Booking status is `confirmed`
  - Departure is 3+ days away
- Display cancellation policy info on hover/tooltip

**Modal Flow**:
1. User clicks "Cancel"
2. Modal shows:
   - Booking details (flight, date, passengers)
   - Days until departure
   - Calculated refund amount/percentage
   - Warning if no refund available
3. User confirms → call cancel API
4. Show success/error message
5. Refresh profile data

### Database Schema

No schema changes needed. Existing columns sufficient:
- `booking.status` already supports `'cancelled'` and `'refunded'`
- `transaction` table can store refund transactions

## Data Flow

1. User clicks "Cancel" on a booking card
2. Frontend shows confirmation modal with refund preview
3. User confirms cancellation
4. Backend:
   - Validates ownership and cancellation eligibility
   - Calculates refund based on departure date
   - Calls Duffel API to cancel order
   - Updates local booking status
   - Records refund transaction
5. Frontend displays result and refreshes booking list

## Edge Cases

1. **Duffel API fails**: Show error, keep booking status unchanged
2. **Already cancelled**: Show "Booking already cancelled" message
3. **No refund eligibility**: Show warning in modal, allow cancellation with $0 refund
4. **Multiple passengers**: Refund is total booking amount × percentage

## Testing Checklist

- [ ] Cancel 7+ days before departure → 100% refund
- [ ] Cancel 3-7 days before departure → 50% refund
- [ ] Cancel <3 days before departure → blocked with message
- [ ] Cancel already cancelled booking → error
- [ ] Cancel without authentication → 401 error
- [ ] Duffel API failure → appropriate error message

## Duffel API Integration

**Cancel Order Endpoint**:
- Method: DELETE
- URL: `https://api.duffel.com/air/orders/{duffel_order_id}`
- Headers: Authorization, Duffel-Version: v2
- Response: Order cancellation confirmation

**Note**: Need to verify Duffel supports cancellations via API. If not, may need to handle cancellation locally only (status update) with note that user must contact support.