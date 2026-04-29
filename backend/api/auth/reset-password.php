<?php
// backend/api/auth/reset-password.php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email'], $data['answer'], $data['new_password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

$email = trim($data['email']);
$answer = trim($data['answer']);
$new_password = $data['new_password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, security_answer_hash FROM user WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'Email not found']);
    exit;
}

if (!password_verify($answer, $user['security_answer_hash'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Incorrect answer']);
    exit;
}

if (!$new_password || mb_strlen($new_password) < 8) {
    echo json_encode(['verified' => true]);
    exit;
}

$new_hash = password_hash($new_password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("UPDATE user SET password_hash = ? WHERE id = ?");
$stmt->execute([$new_hash, $user['id']]);

echo json_encode(['success' => true]);
