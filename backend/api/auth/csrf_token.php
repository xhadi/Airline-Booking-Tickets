<?php
// backend/api/auth/csrf_token.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$token = bin2hex(random_bytes(32));
$_SESSION['csrf_token'] = $token;

echo json_encode(['csrf_token' => $token]);
