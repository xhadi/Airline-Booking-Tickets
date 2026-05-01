<?php
// backend/api/checkout_travelers.php
// Returns full decrypted traveler profiles for checkout use
session_start();
require_once '../config/db.php';
require_once '../lib/encryption.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, date_of_birth, gender, 
               passport_number_encrypted, issuing_country, document_expiry
        FROM traveler_profile 
        WHERE user_id = ? 
        ORDER BY first_name ASC
    ");
    $stmt->execute([$userId]);
    $travelers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($travelers as &$t) {
        if ($t['passport_number_encrypted']) {
            $t['passport_number'] = decryptData($t['passport_number_encrypted']);
        }
        unset($t['passport_number_encrypted']);
    }

    echo json_encode(['success' => true, 'travelers' => $travelers]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch travelers']);
}
?>
