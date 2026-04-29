<?php
// backend/api/get_offer_services.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input || !isset($input['offer_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'offer_id is required']);
        exit;
    }

    $offerId = trim($input['offer_id']);

    require_once __DIR__ . '/../lib/duffel.php';
    $duffel = new DuffelAPI();

    // GET /air/offers/{id}?return_available_services=true
    $response = $duffel->executeRequest(
        '/air/offers/' . urlencode($offerId),
        'GET',
        null,
        ['return_available_services' => 'true']
    );

    $offer = $response['data'] ?? null;
    if (!$offer) {
        http_response_code(404);
        echo json_encode(['error' => 'Offer not found']);
        exit;
    }

    // Extract baggage services
    $bags = [];
    $availableServices = $offer['available_services'] ?? [];
    foreach ($availableServices as $service) {
        if ($service['type'] === 'baggage') {
            $bags[] = [
                'id' => $service['id'],
                'type' => $service['metadata']['type'] ?? 'checked',
                'weight' => $service['metadata']['weight'] ?? null,
                'weight_unit' => $service['metadata']['weight_unit'] ?? 'kg',
                'name' => $service['metadata']['name'] ?? 'Checked Bag',
                'total_amount' => (float)($service['total_amount'] ?? 0),
                'total_currency' => $service['total_currency'] ?? 'SAR',
                'maximum_quantity' => (int)($service['maximum_quantity'] ?? 1),
                'segment_ids' => $service['segment_ids'] ?? [],
            ];
        }
    }

    // Extract seat maps from slices
    $seatMaps = [];
    foreach ($offer['slices'] ?? [] as $slice) {
        foreach ($slice['segments'] ?? [] as $segment) {
            if (!empty($segment['seat_maps'])) {
                foreach ($segment['seat_maps'] as $seatMap) {
                    $seats = [];
                    foreach ($seatMap['cabins'][0]['rows'] ?? [] as $row) {
                        foreach ($row['sections'][0]['elements'] ?? [] as $element) {
                            // Each element is a seat or gap
                            if (isset($element['designator'])) {
                                $seatService = null;
                                if (!empty($element['available_services'])) {
                                    $seatService = [
                                        'id' => $element['available_services'][0]['id'],
                                        'total_amount' => (float)($element['available_services'][0]['total_amount'] ?? 0),
                                        'total_currency' => $element['available_services'][0]['total_currency'] ?? 'SAR',
                                        'disclosures' => $element['available_services'][0]['disclosures'] ?? [],
                                    ];
                                }
                                $seats[] = [
                                    'designator' => $element['designator'],
                                    'name' => $element['name'] ?? '',
                                    'type' => $element['type'] ?? 'standard',
                                    'disclosures' => $element['disclosures'] ?? [],
                                    'service' => $seatService,
                                ];
                            }
                        }
                    }
                    $seatMaps[] = [
                        'segment_id' => $segment['id'] ?? '',
                        'origin' => $segment['origin']['iata_code'] ?? '',
                        'destination' => $segment['destination']['iata_code'] ?? '',
                        'aircraft' => $seatMap['cabins'][0]['aircraft_name'] ?? '',
                        'seats' => $seats,
                    ];
                }
            }
        }
    }

    echo json_encode([
        'success' => true,
        'offer_id' => $offer['id'],
        'currency' => $offer['total_currency'] ?? 'SAR',
        'total_amount' => $offer['total_amount'] ?? '0',
        'bags' => $bags,
        'seat_maps' => $seatMaps,
        'passengers' => $offer['passengers'] ?? [],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
