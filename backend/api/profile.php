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
    $stmtUser = $pdo->prepare("SELECT first_name, last_name, email, created_at FROM user WHERE id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Get bookings
    $stmtBookings = $pdo->prepare("SELECT id, pnr, total_price, currency, status, passenger_count, flight_snapshot, created_at FROM booking WHERE user_id = ? ORDER BY created_at DESC");
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
