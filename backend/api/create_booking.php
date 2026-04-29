<?php
// backend/api/create_booking.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request body']);
        exit;
    }

    $required = ['offer_id', 'passengers', 'payment'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: {$field}"]);
            exit;
        }
    }

    require_once __DIR__ . '/../lib/duffel.php';
    $duffel = new DuffelAPI();

    // Step 1: GET the offer fresh to ensure it's still valid
    $offerResponse = $duffel->executeRequest(
        '/air/offers/' . urlencode($input['offer_id']),
        'GET',
        null,
        ['return_available_services' => 'true']
    );

    $offer = $offerResponse['data'] ?? null;
    if (!$offer) {
        http_response_code(404);
        echo json_encode(['error' => 'Offer not found']);
        exit;
    }

    // Step 2: Build passengers array for Duffel
    $duffelPassengers = [];
    foreach ($input['passengers'] as $pax) {
        $duffelPax = [
            'type' => $pax['type'] ?? 'adult',
            'given_name' => $pax['given_name'],
            'family_name' => $pax['family_name'],
        ];
        if (!empty($pax['born_on'])) {
            $duffelPax['born_on'] = $pax['born_on'];
        }
        if (!empty($pax['gender'])) {
            $duffelPax['gender'] = $pax['gender'];
        }
        $duffelPassengers[] = $duffelPax;
    }

    // Step 3: Build services array
    $services = [];
    if (!empty($input['services']) && is_array($input['services'])) {
        foreach ($input['services'] as $svc) {
            $services[] = [
                'id' => $svc['id'],
                'quantity' => (int)($svc['quantity'] ?? 1),
            ];
        }
    }

    // Step 4: Build order payload
    $orderPayload = [
        'selected_offers' => [['offer_id' => $input['offer_id'], 'services' => $services]],
        'passengers' => $duffelPassengers,
        'payments' => [
            [
                'type' => 'instant',
                'payment' => [
                    'amount' => $input['payment']['amount'],
                    'currency' => $input['payment']['currency'],
                ],
            ],
        ],
    ];

    // Step 5: Create the order
    $orderResponse = $duffel->executeRequest('/air/orders', 'POST', $orderPayload);
    $order = $orderResponse['data'] ?? null;

    if (!$order) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create order']);
        exit;
    }

    // Step 6: Save to local database
    require_once __DIR__ . '/../config/db.php';
    $userId = $_SESSION['user_id'];

    $stmt = $pdo->prepare("INSERT INTO booking (user_id, pnr, duffel_offer_id, duffel_order_id, total_price, currency, status, flight_snapshot, passenger_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $userId,
        $order['pnr'] ?? null,
        $input['offer_id'],
        $order['id'],
        (float)$order['total_amount'],
        $order['total_currency'],
        'confirmed',
        json_encode($offer),
        count($duffelPassengers),
    ]);

    $bookingId = $pdo->lastInsertId();

    // Insert passenger records
    foreach ($order['passengers'] as $idx => $dPax) {
        $localPax = $input['passengers'][$idx] ?? [];
        $stmtPax = $pdo->prepare("INSERT INTO passenger (booking_id, duffel_passenger_id, first_name, last_name, date_of_birth, gender, passport_number, passenger_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtPax->execute([
            $bookingId,
            $dPax['id'] ?? null,
            $localPax['given_name'] ?? '',
            $localPax['family_name'] ?? '',
            $localPax['born_on'] ?? null,
            $localPax['gender'] ?? null,
            $localPax['passport_number'] ?? null,
            $localPax['type'] ?? 'adult',
        ]);
    }

    // Insert transaction record
    $stmtTx = $pdo->prepare("INSERT INTO `transaction` (booking_id, amount, currency, transaction_type, status) VALUES (?, ?, ?, 'charge', 'success')");
    $stmtTx->execute([
        $bookingId,
        (float)$order['total_amount'],
        $order['total_currency'],
    ]);

    echo json_encode([
        'success' => true,
        'order_id' => $order['id'],
        'pnr' => $order['pnr'],
        'booking_id' => $bookingId,
        'total_amount' => $order['total_amount'],
        'currency' => $order['total_currency'],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
