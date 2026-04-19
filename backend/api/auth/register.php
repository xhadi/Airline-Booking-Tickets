<?php
// backend/api/auth/register.php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['first_name'], $data['last_name'], $data['email'], $data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM user WHERE email = ?");
$stmt->execute([$data['email']]);
if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(['error' => 'Email already exists']);
    exit;
}

$hash = password_hash($data['password'], PASSWORD_BCRYPT);
$phone_number = !empty($data['phone_number']) ? $data['phone_number'] : null;

$stmt = $pdo->prepare("INSERT INTO user (first_name, last_name, email, phone_number, password_hash) VALUES (?, ?, ?, ?, ?)");

try {
    $stmt->execute([$data['first_name'], $data['last_name'], $data['email'], $phone_number, $hash]);
    $userId = $pdo->lastInsertId();
    
    $_SESSION['user_id'] = $userId;
    $_SESSION['first_name'] = $data['first_name'];
    $_SESSION['last_name'] = $data['last_name'];
    $_SESSION['email'] = $data['email'];
    $_SESSION['phone_number'] = $phone_number;
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
