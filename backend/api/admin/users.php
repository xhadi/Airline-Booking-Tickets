<?php
// backend/api/admin/users.php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $search = trim($_GET['search'] ?? '');

    if ($search !== '') {
        $stmt = $pdo->prepare("
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.created_at,
                   (SELECT COUNT(*) FROM booking WHERE user_id = u.id) AS booking_count
            FROM user u
            WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?
            ORDER BY u.created_at DESC
        ");
        $like = "%$search%";
        $stmt->execute([$like, $like, $like]);
    } else {
        $stmt = $pdo->query("
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.created_at,
                   (SELECT COUNT(*) FROM booking WHERE user_id = u.id) AS booking_count
            FROM user u
            ORDER BY u.created_at DESC
        ");
    }

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'users' => $users]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load users']);
}
