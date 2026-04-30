<?php
// backend/api/profile.php
session_start();
require_once '../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Get user info
    $stmtUser = $pdo->prepare("SELECT first_name, last_name, email, phone_number, created_at FROM user WHERE id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Get travelers
    $stmtTravelers = $pdo->prepare("
        SELECT id, first_name, last_name, date_of_birth, gender, 
               passport_number_encrypted, issuing_country, document_expiry
        FROM traveler_profile 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ");
    $stmtTravelers->execute([$userId]);
    $travelers = $stmtTravelers->fetchAll(PDO::FETCH_ASSOC);

    // Process travelers (mask passport)
    require_once '../lib/encryption.php';
    foreach ($travelers as &$t) {
        if ($t['passport_number_encrypted']) {
            $decrypted = decryptData($t['passport_number_encrypted']);
            $t['passport_last4'] = substr($decrypted, -4);
            $t['passport_masked'] = '•••• •••• ' . $t['passport_last4'];
            $t['is_complete'] = !empty($t['issuing_country']) && !empty($t['document_expiry']);
        } else {
            $t['passport_masked'] = null;
            $t['is_complete'] = false;
        }
        unset($t['passport_number_encrypted']); // Don't send encrypted data to frontend
    }

    // Get bookings with passenger count from passenger table
    $stmtBookings = $pdo->prepare("
        SELECT id, pnr, total_price, currency, status, flight_snapshot, created_at,
               (SELECT COUNT(*) FROM passenger WHERE booking_id = booking.id) AS passenger_count
        FROM booking WHERE user_id = ? ORDER BY created_at DESC
    ");
    $stmtBookings->execute([$userId]);
    $bookings = $stmtBookings->fetchAll(PDO::FETCH_ASSOC);

    // Calculate stats
    $totalFlights = count($bookings);
    $totalSpent = 0;
    $totalPassengers = 0;

    foreach ($bookings as $key => $b) {
        $totalSpent += (float)$b['total_price'];
        $totalPassengers += (int)$b['passenger_count'];
        // Decode JSON snapshot for frontend convenience
        $bookings[$key]['flight_snapshot'] = json_decode($b['flight_snapshot'], true);
    }

    echo json_encode([
        'success' => true,
        'user' => $user,
        'travelers' => $travelers,
        'stats' => [
            'total_flights' => $totalFlights,
            'total_spent' => $totalSpent,
            'total_passengers' => $totalPassengers
        ],
        'bookings' => $bookings
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch profile data']);
}
