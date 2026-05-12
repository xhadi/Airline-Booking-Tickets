<?php
// backend/api/travelers.php
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

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
    if (!$csrf || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrf)) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid CSRF token']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            $stmt = $pdo->prepare("
                SELECT id, first_name, last_name, date_of_birth, gender, 
                       passport_number_encrypted, issuing_country, document_expiry, created_at
                FROM traveler_profile 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$id, $userId]);
            $traveler = $stmt->fetch(PDO::FETCH_ASSOC);
            $travelers = $traveler ? [$traveler] : [];
        } else {
            $stmt = $pdo->prepare("
                SELECT id, first_name, last_name, date_of_birth, gender, 
                       passport_number_encrypted, issuing_country, document_expiry, created_at
                FROM traveler_profile 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$userId]);
            $travelers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Decrypt passport numbers for display (masked)
        foreach ($travelers as &$t) {
            if ($t['passport_number_encrypted']) {
                $decrypted = decryptData($t['passport_number_encrypted']);
                $t['passport_last4'] = substr($decrypted, -4);
                $t['passport_masked'] = '•••• •••• ' . $t['passport_last4'];
                $t['is_complete'] = !empty($t['issuing_country']) && !empty($t['document_expiry']);
            } else {
                $t['passport_last4'] = null;
                $t['passport_masked'] = null;
                $t['is_complete'] = false;
            }
        }
        
        echo json_encode(['success' => true, 'travelers' => $travelers]);
        
    } elseif ($method === 'POST') {
        // Create new traveler
        $input = json_decode(file_get_contents('php://input'), true);
        
        $required = ['first_name', 'last_name', 'date_of_birth', 'gender'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Missing required field: $field"]);
                exit;
            }
        }
        
        $passportEncrypted = null;
        if (!empty($input['passport_number'])) {
            $passportEncrypted = encryptData($input['passport_number']);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO traveler_profile 
            (user_id, first_name, last_name, date_of_birth, gender, passport_number_encrypted, issuing_country, document_expiry)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $input['first_name'],
            $input['last_name'],
            $input['date_of_birth'],
            $input['gender'],
            $passportEncrypted,
            $input['issuing_country'] ?? null,
            $input['document_expiry'] ?? null
        ]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        
    } elseif ($method === 'PUT') {
        // Update traveler
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing traveler ID']);
            exit;
        }
        
        // Verify ownership
        $stmt = $pdo->prepare("SELECT id FROM traveler_profile WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            exit;
        }
        
        $passportEncrypted = null;
        if (!empty($input['passport_number'])) {
            $passportEncrypted = encryptData($input['passport_number']);
        }
        
        $stmt = $pdo->prepare("
            UPDATE traveler_profile 
            SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, 
                passport_number_encrypted = COALESCE(?, passport_number_encrypted),
                issuing_country = COALESCE(?, issuing_country),
                document_expiry = COALESCE(?, document_expiry)
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([
            $input['first_name'], $input['last_name'], $input['date_of_birth'], $input['gender'],
            $passportEncrypted, $input['issuing_country'] ?? null, $input['document_expiry'] ?? null,
            $id, $userId
        ]);
        
        echo json_encode(['success' => true, 'id' => $id]);
        
    } elseif ($method === 'DELETE') {
        // Delete traveler
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing traveler ID']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM traveler_profile WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        echo json_encode(['success' => true]);
    }
    
} catch (Exception $e) {
    error_log('Traveler error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Operation failed']);
}
?>