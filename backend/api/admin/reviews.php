<?php
// backend/api/admin/reviews.php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $status = $_GET['status'] ?? 'flagged';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 20;
        $offset = ($page - 1) * $perPage;

        $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM review WHERE status = ?");
        $stmtCount->execute([$status]);
        $total = (int)$stmtCount->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT r.id, r.overall_rating, r.ease_of_booking, r.customer_support, r.value_for_money,
                   r.comment, r.status, r.created_at, r.updated_at,
                   CONCAT(u.first_name, ' ', u.last_name) AS user_name
            FROM review r JOIN user u ON r.user_id = u.id
            WHERE r.status = ?
            ORDER BY r.updated_at DESC
            LIMIT " . (int)$perPage . " OFFSET " . (int)$offset . "
        ");
        $stmt->execute([$status]);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($reviews as &$r) {
            $r['time_ago'] = (function($dt) {
                $diff = time() - strtotime($dt);
                if ($diff < 60) return 'just now';
                if ($diff < 3600) return floor($diff/60) . ' min ago';
                if ($diff < 86400) return floor($diff/3600) . ' hour' . (floor($diff/3600)>1?'s':'') . ' ago';
                if ($diff < 604800) return floor($diff/86400) . ' day' . (floor($diff/86400)>1?'s':'') . ' ago';
                return date('M j', strtotime($dt));
            })($r['updated_at']);
        }

        echo json_encode([
            'success' => true,
            'reviews' => $reviews,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage
        ]);

    } elseif ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $reviewId = (int)($input['id'] ?? 0);
        $newStatus = $input['status'] ?? '';

        if (!$reviewId || !in_array($newStatus, ['published', 'hidden'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid review ID or status']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE review SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $reviewId]);

        echo json_encode(['success' => true]);

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Operation failed']);
}
