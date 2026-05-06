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

    if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
        if (!$csrf || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrf)) {
            http_response_code(403);
            echo json_encode(['error' => 'Invalid CSRF token']);
            exit;
        }
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

    // Step 2: Build passengers array for Duffel using IDs from the offer
    $duffelPassengers = [];
    $offerPassengers = $offer['passengers'] ?? [];
    foreach ($input['passengers'] as $idx => $pax) {
        // Get the Duffel passenger ID from the offer
        $duffelPaxId = $offerPassengers[$idx]['id'] ?? null;
        
        $duffelPax = [
            'id' => $duffelPaxId,
            'given_name' => $pax['given_name'],
            'family_name' => $pax['family_name'],
            'title' => $pax['title'] ?? 'mr',
            'phone_number' => $pax['phone_number'] ?? '+12345678901',
            'email' => $pax['email'] ?? 'test@example.com'
        ];
        if (!empty($pax['born_on'])) {
            $duffelPax['born_on'] = $pax['born_on'];
        }
        if (!empty($pax['gender'])) {
            $duffelPax['gender'] = $pax['gender'];
        }
        $duffelPassengers[] = $duffelPax;
    }

    // Step 3: Build services array and compute exact total Order amount
    $services = [];
    $exactTotal = (float)$offer['total_amount'];

    if (!empty($input['services']) && is_array($input['services'])) {
        $servicePrices = [];
        // Extract baggage service prices
        if (!empty($offer['available_services'])) {
            foreach ($offer['available_services'] as $svc) {
                $servicePrices[$svc['id']] = (float)$svc['total_amount'];
            }
        }
        // Extract seat service prices
        if (!empty($offer['slices'])) {
            foreach ($offer['slices'] as $slice) {
                if (!empty($slice['segments'])) {
                    foreach ($slice['segments'] as $segment) {
                        if (!empty($segment['seat_maps'])) {
                            foreach ($segment['seat_maps'] as $map) {
                                if (!empty($map['cabins'])) {
                                    foreach ($map['cabins'] as $cabin) {
                                        if (!empty($cabin['rows'])) {
                                            foreach ($cabin['rows'] as $row) {
                                                if (!empty($row['sections'])) {
                                                    foreach ($row['sections'] as $section) {
                                                        if (!empty($section['elements'])) {
                                                            foreach ($section['elements'] as $element) {
                                                                if (!empty($element['available_services'])) {
                                                                    foreach ($element['available_services'] as $svc) {
                                                                        $servicePrices[$svc['id']] = (float)$svc['total_amount'];
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        foreach ($input['services'] as $svc) {
            $qty = (int)($svc['quantity'] ?? 1);
            $services[] = [
                'id' => $svc['id'],
                'quantity' => $qty,
            ];
            if (isset($servicePrices[$svc['id']])) {
                $exactTotal += $servicePrices[$svc['id']] * $qty;
            }
        }
    }

    // Step 4: Build order payload
    $orderPayload = [
        'type' => 'instant',
        'selected_offers' => [$input['offer_id']],
        'passengers' => $duffelPassengers,
        'payments' => [
            [
                'type' => $input['payment']['type'] ?? 'balance',
                'amount' => (float) number_format($exactTotal, 2, '.', ''),
                'currency' => $input['payment']['currency'],
            ],
        ],
    ];

    if (!empty($services)) {
        $orderPayload['services'] = $services;
    }

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
        $order['booking_reference'] ?? $order['pnr'] ?? null,
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
    require_once __DIR__ . '/../lib/encryption.php';
    foreach ($order['passengers'] as $idx => $dPax) {
        $localPax = $input['passengers'][$idx] ?? [];
        
        $encryptedPassport = null;
        if (!empty($localPax['passport_number'])) {
            $encryptedPassport = encryptData($localPax['passport_number']);
        }
        
        $stmtPax = $pdo->prepare("INSERT INTO passenger (booking_id, duffel_passenger_id, first_name, last_name, date_of_birth, gender, passport_number_encrypted, passenger_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtPax->execute([
            $bookingId,
            $dPax['id'] ?? null,
            $localPax['given_name'] ?? '',
            $localPax['family_name'] ?? '',
            $localPax['born_on'] ?? null,
            $localPax['gender'] ?? null,
            $encryptedPassport,
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
        'pnr' => $order['booking_reference'] ?? $order['pnr'] ?? null,
        'booking_id' => $bookingId,
        'total_amount' => $order['total_amount'],
        'currency' => $order['total_currency'],
    ]);

} catch (Exception $e) {
    error_log('Booking error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
