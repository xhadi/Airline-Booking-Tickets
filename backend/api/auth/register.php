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

$first_name = trim($data['first_name']);
$last_name = trim($data['last_name']);
$email = trim($data['email']);
$password = $data['password'];

if ($first_name === '' || $last_name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'First and last name are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}

if (mb_strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 8 characters']);
    exit;
}

$security_question = trim($data['security_question'] ?? '');
$security_answer = trim($data['security_answer'] ?? '');

if (empty($security_question)) {
    http_response_code(400);
    echo json_encode(['error' => 'Security question is required']);
    exit;
}

if (empty($security_answer) || mb_strlen($security_answer) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Security answer must be at least 2 characters']);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM user WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(['error' => 'Email already exists']);
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$phone_number = !empty($data['phone_number']) ? trim($data['phone_number']) : null;

$stmt = $pdo->prepare("INSERT INTO user (first_name, last_name, email, phone_number, password_hash, security_question, security_answer_hash) VALUES (?, ?, ?, ?, ?, ?, ?)");

$answerHash = password_hash($security_answer, PASSWORD_BCRYPT);

try {
    $stmt->execute([$first_name, $last_name, $email, $phone_number, $hash, $security_question, $answerHash]);
    $userId = $pdo->lastInsertId();
    
    $_SESSION['user_id'] = $userId;
    $_SESSION['first_name'] = $first_name;
    $_SESSION['last_name'] = $last_name;
    $_SESSION['email'] = $email;
    $_SESSION['phone_number'] = $phone_number;
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
