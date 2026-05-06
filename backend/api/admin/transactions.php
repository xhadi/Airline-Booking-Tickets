<?php
// backend/api/admin/transactions.php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $type = $_GET['type'] ?? 'all';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 20;
    $offset = ($page - 1) * $perPage;

    $where = '';
    $params = [];
    if ($type !== 'all') {
        $where = 'WHERE t.transaction_type = ?';
        $params[] = $type;
    }

    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM transaction t $where");
    $stmtCount->execute($params);
    $total = (int)$stmtCount->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT t.id, t.booking_id, t.payment_gateway_id, t.amount, t.currency,
               t.transaction_type, t.status, t.created_at
        FROM transaction t
        $where
        ORDER BY t.created_at DESC
        LIMIT " . (int)$perPage . " OFFSET " . (int)$offset . "
    ");
    if ($params) $stmt->execute($params); else $stmt->execute();
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'transactions' => $transactions,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load transactions']);
}
