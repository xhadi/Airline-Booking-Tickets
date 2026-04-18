<?php
// Initialize headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // 1. Get input
    $rawInput = file_get_contents('php://input');
    if (!$rawInput) {
        throw new Exception("No payload provided");
    }

    $input = json_decode($rawInput, true);
    if (!isset($input['slices']) || !is_array($input['slices'])) {
        throw new Exception("Invalid request: 'slices' is missing or not an array");
    }

    // 2. Initialize Duffel Wrapper
    require_once __DIR__ . '/../lib/duffel.php';
    $duffel = new DuffelAPI();

    // 3. Build Duffel payload for POST /air/offer_requests
    $slices = [];
    foreach ($input['slices'] as $slice) {
        $slices[] = [
            'origin' => $slice['origin'],
            'destination' => $slice['destination'],
            'departure_date' => $slice['departure_date']
        ];
    }

    $passengers = [];
    if (isset($input['passengers']) && is_array($input['passengers'])) {
        foreach ($input['passengers'] as $pax) {
            $type = strtolower($pax['type']);
            if ($type === 'child') {
                $passengers[] = ['age' => isset($pax['age']) ? intval($pax['age']) : 5];
            } else {
                $passengers[] = ['type' => 'adult'];
            }
        }
    } else {
        $passengers[] = ['type' => 'adult'];
    }

    $cabin = isset($input['cabin_class']) ? strtolower(str_replace('-', '_', $input['cabin_class'])) : 'economy';

    $payload = [
        'slices' => $slices,
        'passengers' => $passengers,
        'cabin_class' => $cabin,
        'return_offers' => true
    ];

    // 4. Execute Request
    $response = $duffel->executeRequest('/air/offer_requests', 'POST', $payload);

    // 5. Transform Response to match existing format
    $output = ['flights' => []];

    if (isset($response['data']['offers']) && is_array($response['data']['offers'])) {
        foreach ($response['data']['offers'] as $offer) {
            $flight = [
                'id' => $offer['id'],
                'source' => 'duffel',
                'instant' => true,
                'price' => [
                    'currency' => $offer['total_currency'],
                    'total' => $offer['total_amount']
                ],
                'slices' => []
            ];

            foreach ($offer['slices'] as $sliceData) {
                $slice = [
                    'duration' => $sliceData['duration'],
                    'segments' => []
                ];

                foreach ($sliceData['segments'] as $segment) {
                    $slice['segments'][] = [
                        'origin' => $segment['origin']['iata_code'],
                        'destination' => $segment['destination']['iata_code'],
                        'departure_time' => $segment['departing_at'],
                        'arrival_time' => $segment['arriving_at'],
                        'carrier_code' => $segment['operating_carrier']['iata_code'],
                        'carrier_name' => $segment['operating_carrier']['name'],
                        'flight_number' => $segment['operating_carrier_flight_number'],
                        'aircraft' => isset($segment['aircraft']['name']) ? $segment['aircraft']['name'] : ''
                    ];
                }
                $flight['slices'][] = $slice;
            }
            
            $output['flights'][] = $flight;
        }
    }

    echo json_encode($output);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
