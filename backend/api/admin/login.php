<?php
// backend/api/admin/login.php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['username']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, password_hash FROM admin_users WHERE username = ?");
    $stmt->execute([$input['username']]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !password_verify($input['password'], $admin['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_username'] = $admin['username'];

    echo json_encode(['success' => true, 'admin' => ['username' => $admin['username']]]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Login failed']);
}
