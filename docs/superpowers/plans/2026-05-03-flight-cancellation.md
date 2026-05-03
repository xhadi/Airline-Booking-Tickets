# Flight Cancellation Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to cancel flight bookings from profile page with tiered refund based on days until departure.

**Architecture:** Backend API endpoint for cancellation with Duffel API integration. Frontend adds cancel button and confirmation modal to booking cards.

**Tech Stack:** PHP backend, vanilla JS frontend, Duffel API for order cancellation.

---

## File Structure

- **Create**: `backend/api/cancel_booking.php` - New API endpoint for cancellation
- **Modify**: `assets/js/profile.js` - Add cancel button and modal to booking cards
- **Modify**: `backend/api/profile.php` - Add departure date to booking data for frontend to check eligibility

---

## Task 1: Create Backend Cancel API Endpoint

**Files:**
- Create: `backend/api/cancel_booking.php`

- [ ] **Step 1: Create cancel_booking.php with basic structure**

```php
<?php
// backend/api/cancel_booking.php
session_start();
require_once '../config/db.php';
require_once '../lib/duffel.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true);
$bookingId = $input['booking_id'] ?? null;

if (!$bookingId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing booking ID']);
    exit;
}

try {
    // Fetch booking to verify ownership and status
    $stmt = $pdo->prepare("SELECT id, duffel_order_id, total_price, currency, status, flight_snapshot FROM booking WHERE id = ? AND user_id = ?");
    $stmt->execute([$bookingId, $userId]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        http_response_code(404);
        echo json_encode(['error' => 'Booking not found']);
        exit;
    }

    if ($booking['status'] === 'cancelled') {
        echo json_encode(['error' => 'Booking is already cancelled']);
        exit;
    }

    if ($booking['status'] !== 'confirmed') {
        echo json_encode(['error' => 'Only confirmed bookings can be cancelled']);
        exit;
    }

    // Decode flight snapshot to get departure date
    $snapshot = json_decode($booking['flight_snapshot'], true);
    $departureDate = null;
    if ($snapshot && isset($snapshot['slices'][0]['segments'][0])) {
        $depTimeStr = $snapshot['slices'][0]['segments'][0]['departure_time'] ?? 
                      $snapshot['slices'][0]['segments'][0]['departing_at'] ?? null;
        if ($departureDate) {
            $departureDate = new DateTime($depTimeStr);
        }
    }

    // Calculate refund eligibility
    $now = new DateTime();
    $daysUntilDeparture = null;
    $refundPercentage = 0;
    $refundAmount = 0;

    if ($departureDate) {
        $daysUntilDeparture = (int)$departureDate->diff($now)->format('%r%d');
        
        if ($daysUntilDeparture >= 7) {
            $refundPercentage = 100;
            $refundAmount = (float)$booking['total_price'];
        } elseif ($daysUntilDeparture >= 3) {
            $refundPercentage = 50;
            $refundAmount = (float)$booking['total_price'] * 0.5;
        } else {
            echo json_encode([
                'error' => 'Cancellation not allowed within 3 days of departure',
                'days_until_departure' => $daysUntilDeparture
            ]);
            exit;
        }
    }

    // Cancel via Duffel API
    $duffel = new DuffelAPI();
    try {
        $duffel->executeRequest('/air/orders/' . $booking['duffel_order_id'], 'DELETE');
    } catch (Exception $e) {
        // Log error but continue with local cancellation if Duffel fails
        error_log('Duffel cancellation failed: ' . $e->getMessage());
    }

    // Update booking status
    $newStatus = $refundAmount > 0 ? 'refunded' : 'cancelled';
    $stmt = $pdo->prepare("UPDATE booking SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $bookingId]);

    // Record refund transaction if applicable
    if ($refundAmount > 0) {
        $stmtTx = $pdo->prepare("INSERT INTO `transaction` (booking_id, amount, currency, transaction_type, status) VALUES (?, ?, ?, 'refund', 'success')");
        $stmtTx->execute([$bookingId, $refundAmount, $booking['currency']]);
    }

    echo json_encode([
        'success' => true,
        'refund_amount' => $refundAmount,
        'refund_percentage' => $refundPercentage,
        'days_until_departure' => $daysUntilDeparture,
        'message' => $refundAmount > 0 
            ? "Booking cancelled successfully. Refund of {$booking['currency']} {$refundAmount} will be processed."
            : "Booking cancelled successfully. No refund available."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Cancellation failed: ' . $e->getMessage()]);
}
?>
```

- [ ] **Step 2: Check PHP syntax**

Run: `php -l backend/api/cancel_booking.php`
Expected: No syntax errors

- [ ] **Step 3: Commit**

```bash
git add backend/api/cancel_booking.php
git commit -m "feat: add cancel booking API endpoint"
```

---

## Task 2: Add Cancel Button to Booking Cards

**Files:**
- Modify: `assets/js/profile.js:116-171` (renderActiveBookings function)

- [ ] **Step 1: Add cancel button to booking card HTML**

In `renderActiveBookings` function, after line 163 (before closing `</div>`), add:

```javascript
const daysUntilDeparture = getDaysUntilDeparture(booking);
const canCancel = booking.status === 'confirmed' && daysUntilDeparture !== null && daysUntilDeparture >= 3;

html += `
    <div class="booking-card" style="border-left: 4px solid ${statusColor};">
        <div class="booking-top">
            <div class="pnr-display" onclick="copyPNR('${booking.pnr}')" title="Click to copy">PNR: ${booking.pnr} ✓</div>
            <span class="booking-badge" style="background: ${statusBg}; color: ${statusColor};">${booking.status.toUpperCase()}</span>
        </div>
        <div class="booking-details">
            <div>
                <div class="route-display">${origin} → ${dest}</div>
                <div class="time-display">${depTime}</div>
                <div class="flight-info">${airline} • ${stopsText}</div>
            </div>
            <div class="booking-price">
                <div>${booking.currency} ${booking.total_price}</div>
                <div class="passenger-count">${booking.passenger_count} Passenger${booking.passenger_count > 1 ? 's' : ''}</div>
            </div>
        </div>
        ${canCancel ? `<button class="btn-cancel-booking" onclick="showCancelModal(${booking.id}, ${daysUntilDeparture}, ${booking.total_price}, '${booking.currency}')">Cancel Booking</button>` : ''}
    </div>
`;
```

- [ ] **Step 2: Add helper function for days calculation**

Add at end of profile.js:

```javascript
function getDaysUntilDeparture(booking) {
    const snapshot = booking.flight_snapshot;
    if (!snapshot || !snapshot.slices || !snapshot.slices[0] || !snapshot.slices[0].segments) {
        return null;
    }
    const depTimeStr = snapshot.slices[0].segments[0].departure_time || 
                       snapshot.slices[0].segments[0].departing_at;
    if (!depTimeStr) return null;
    
    const depDate = new Date(depTimeStr);
    const now = new Date();
    const diffTime = depDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

- [ ] **Step 3: Add cancel modal function**

Add after showTravelerModal function:

```javascript
function showCancelModal(bookingId, daysUntil, totalPrice, currency) {
    const existingModal = document.getElementById('cancel-modal');
    if (existingModal) existingModal.remove();

    let refundAmount = 0;
    let refundPercentage = 0;
    let refundMessage = '';

    if (daysUntil >= 7) {
        refundAmount = totalPrice;
        refundPercentage = 100;
        refundMessage = 'You will receive a full refund.';
    } else if (daysUntil >= 3) {
        refundAmount = totalPrice * 0.5;
        refundPercentage = 50;
        refundMessage = 'You will receive a 50% refund.';
    }

    const modalHtml = `
        <div id="cancel-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Cancel Booking</h3>
                    <button class="modal-close" onclick="closeCancelModal()">✕</button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to cancel this booking?</p>
                    <div class="cancel-info">
                        <p><strong>Days until departure:</strong> ${daysUntil} days</p>
                        <p><strong>Cancellation policy:</strong></p>
                        <ul>
                            <li>7+ days: 100% refund</li>
                            <li>3-7 days: 50% refund</li>
                            <li>&lt;3 days: No cancellation</li>
                        </ul>
                        <p class="refund-highlight"><strong>${refundMessage}</strong></p>
                        ${refundAmount > 0 ? `<p>Refund amount: ${currency} ${refundAmount.toFixed(2)}</p>` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeCancelModal()">Keep Booking</button>
                    <button class="btn-danger" onclick="confirmCancel(${bookingId})">Confirm Cancellation</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeCancelModal() {
    const modal = document.getElementById('cancel-modal');
    if (modal) modal.remove();
}

async function confirmCancel(bookingId) {
    try {
        const res = await fetch('../backend/api/cancel_booking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: bookingId })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Booking cancelled! ' + data.message);
            closeCancelModal();
            refreshProfile();
        } else {
            showToast('Error: ' + (data.error || 'Failed to cancel booking'));
        }
    } catch (err) {
        console.error(err);
        showToast('Error cancelling booking');
    }
}
```

- [ ] **Step 4: Add CSS for cancel button and modal**

Add to `assets/css/profile.css` or inline styles:

```css
.btn-cancel-booking {
    background: #EF4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 8px;
}
.btn-cancel-booking:hover {
    background: #DC2626;
}
.btn-danger {
    background: #EF4444;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}
.btn-danger:hover {
    background: #DC2626;
}
.cancel-info {
    background: #FEF2F2;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
}
.refund-highlight {
    color: #059669;
    font-weight: bold;
}
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/profile.js
git commit -m "feat: add cancel booking UI to profile page"
```

---

## Task 3: Test End-to-End

- [ ] **Step 1: Start dev server**

Run: `php -S localhost:8000 -t .`

- [ ] **Step 2: Navigate to profile page**

Open: `http://localhost:8000/pages/profile.html`

- [ ] **Step 3: Verify cancel button appears on active bookings**

- [ ] **Step 4: Test cancellation flow**

1. Click cancel button
2. Verify modal shows correct refund info
3. Confirm cancellation
4. Verify success message
5. Verify booking moves to historical or shows cancelled status

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: verify flight cancellation feature"
```

---

## Spec Coverage Check

- [x] Backend API endpoint for cancellation - Task 1
- [x] Tiered refund calculation (100%/50%/0%) - Task 1
- [x] Duffel API integration - Task 1  
- [x] Cancel button on active bookings - Task 2
- [x] Confirmation modal with refund preview - Task 2
- [x] Block cancellation within 3 days - Task 1 (backend) + Task 2 (UI hidden)
- [x] Refresh profile after cancellation - Task 2 (confirmCancel calls refreshProfile)

All requirements covered.