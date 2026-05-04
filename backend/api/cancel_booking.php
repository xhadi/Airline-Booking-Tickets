<?php
// backend/api/cancel_booking.php
session_start();
require_once '../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true);

$bookingId = isset($input['booking_id']) ? intval($input['booking_id']) : 0;
$refundType = isset($input['refund_type']) && $input['refund_type'] === 'credit' ? 'credit' : 'refund';

if (!$bookingId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Booking ID is required']);
    exit;
}

try {
    // Fetch booking
    $stmt = $pdo->prepare("
        SELECT id, user_id, pnr, total_price, currency, status, flight_snapshot 
        FROM booking 
        WHERE id = ?
    ");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Booking not found']);
        exit;
    }

    if ($booking['user_id'] != $userId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied']);
        exit;
    }

    if ($booking['status'] !== 'confirmed') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Only confirmed bookings can be cancelled']);
        exit;
    }

    // Parse flight snapshot to get departure date
    $snapshot = json_decode($booking['flight_snapshot'], true);
    $departureDate = null;
    
    if ($snapshot && isset($snapshot['slices'][0]['segments'][0])) {
        $firstSegment = $snapshot['slices'][0]['segments'][0];
        $departureDate = isset($firstSegment['departing_at']) ? new DateTime($firstSegment['departing_at']) : null;
    }

    if (!$departureDate) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cannot determine departure date']);
        exit;
    }

    $now = new DateTime();
    $daysUntil = ceil(($departureDate->getTimestamp() - $now->getTimestamp()) / (86400));

    if ($daysUntil < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Flight has already departed']);
        exit;
    }

    // Calculate refund policy (7/3/0 day rule)
    $totalPaid = floatval($booking['total_price']);
    
    if ($daysUntil >= 7) {
        $penalty = 0;
        $refundPercent = 100;
        $newStatus = 'refunded';
    } elseif ($daysUntil >= 3) {
        $penalty = $totalPaid * 0.5;
        $refundPercent = 50;
        $newStatus = 'refunded';
    } else {
        $penalty = $totalPaid;
        $refundPercent = 0;
        $newStatus = 'cancelled';
    }

    $refundAmount = $totalPaid - $penalty;

    // Update booking status
    $cancellationData = json_encode([
        'cancelled_at' => date('Y-m-d H:i:s'),
        'cancellation_fee' => $penalty,
        'refund_amount' => $refundAmount,
        'refund_type' => $refundType,
        'refund_percent' => $refundPercent,
        'days_until_departure' => $daysUntil
    ]);

    $stmtUpdate = $pdo->prepare("
        UPDATE booking 
        SET status = ?, 
            cancellation_data = ?
        WHERE id = ?
    ");
    $stmtUpdate->execute([$newStatus, $cancellationData, $bookingId]);

    // Log transaction
    $stmtTrans = $pdo->prepare("
        INSERT INTO transaction (user_id, booking_id, type, amount, currency, status, details)
        VALUES (?, ?, 'cancellation', ?, ?, 'completed', ?)
    ");
    $stmtTrans->execute([
        $userId,
        $bookingId,
        $refundAmount,
        $booking['currency'],
        $cancellationData
    ]);

    $currencySymbol = $booking['currency'] === 'USD' ? '$' : $booking['currency'];
    $refundDisplay = $currencySymbol . number_format($refundAmount, 2);

    if ($refundType === 'credit') {
        $message = "Booking cancelled. $refundDisplay has been converted to travel credit.";
    } else {
        $message = "Booking cancelled. $refundDisplay has been refunded to your card (3-5 business days).";
    }

    echo json_encode([
        'success' => true,
        'message' => $message,
        'refund_amount' => $refundAmount,
        'refund_type' => $refundType,
        'new_status' => $newStatus
    ]);

} catch (PDOException $e) {
    error_log("Cancel booking error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}