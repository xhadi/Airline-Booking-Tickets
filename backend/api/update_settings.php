<?php
// backend/api/update_settings.php
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

$phoneNumber = isset($input['phone_number']) ? trim($input['phone_number']) : '';
$currentPassword = isset($input['current_password']) ? $input['current_password'] : '';
$newPassword = isset($input['new_password']) ? $input['new_password'] : '';

if ($phoneNumber !== '' && !preg_match('/^[+]?[\d\s\-]{7,20}$/', $phoneNumber)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid phone number format']);
    exit;
}

if ($newPassword !== '') {
    if (strlen($newPassword) < 8) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters']);
        exit;
    }
    
    if ($currentPassword === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Current password required to change password']);
        exit;
    }
}

try {
    if ($newPassword !== '') {
        $stmtCheck = $pdo->prepare("SELECT password_hash FROM user WHERE id = ?");
        $stmtCheck->execute([$userId]);
        $user = $stmtCheck->fetch(PDO::FETCH_ASSOC);
        
        if (!password_verify($currentPassword, $user['password_hash'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
            exit;
        }
        
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE user SET phone_number = ?, password_hash = ? WHERE id = ?");
        $stmt->execute([$phoneNumber ?: null, $newHash, $userId]);
        
        $_SESSION['phone_number'] = $phoneNumber ?: '';
        
        echo json_encode([
            'success' => true,
            'message' => 'Password and settings updated successfully',
            'phone_number' => $phoneNumber
        ]);
    } else {
        $stmt = $pdo->prepare("UPDATE user SET phone_number = ? WHERE id = ?");
        $stmt->execute([$phoneNumber ?: null, $userId]);

        $_SESSION['phone_number'] = $phoneNumber ?: '';

        echo json_encode([
            'success' => true,
            'message' => 'Settings saved successfully',
            'phone_number' => $phoneNumber
        ]);
    }

} catch (PDOException $e) {
    error_log("Update settings error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}