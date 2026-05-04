<?php
// backend/api/admin/dashboard.php
session_start();
require_once '../../config/db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    // Stats
    $stmt = $pdo->query("
        SELECT
            (SELECT COUNT(*) FROM user) AS total_users,
            (SELECT COUNT(*) FROM booking) AS total_bookings,
            COALESCE((SELECT SUM(total_price) FROM booking WHERE status = 'confirmed'), 0) AS total_revenue,
            (SELECT COUNT(*) FROM review WHERE status = 'flagged') AS flagged_reviews
    ");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Recent activity - merged from 3 sources
    $activities = [];

    $stmt = $pdo->query("
        SELECT 'booking' AS type, b.id AS ref_id, b.created_at,
               CONCAT(u.first_name, ' ', u.last_name) AS user_name, b.pnr
        FROM booking b JOIN user u ON b.user_id = u.id
        ORDER BY b.created_at DESC LIMIT 10
    ");
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $row['sort_time'] = $row['created_at'];
        $activities[] = $row;
    }

    $stmt = $pdo->query("
        SELECT 'user' AS type, id AS ref_id, created_at,
               CONCAT(first_name, ' ', last_name) AS user_name, NULL AS pnr
        FROM user ORDER BY created_at DESC LIMIT 10
    ");
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $row['sort_time'] = $row['created_at'];
        $activities[] = $row;
    }

    $stmt = $pdo->query("
        SELECT 'flagged' AS type, r.id AS ref_id, r.updated_at AS created_at,
               CONCAT(u.first_name, ' ', u.last_name) AS user_name, NULL AS pnr
        FROM review r JOIN user u ON r.user_id = u.id
        WHERE r.status = 'flagged'
        ORDER BY r.updated_at DESC LIMIT 10
    ");
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $row['sort_time'] = $row['created_at'];
        $activities[] = $row;
    }

    usort($activities, function($a, $b) {
        return strcmp($b['sort_time'], $a['sort_time']);
    });
    $activities = array_slice($activities, 0, 10);

    foreach ($activities as &$a) {
        $a['time_ago'] = timeAgo($a['sort_time']);
        unset($a['sort_time']);
    }

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_users' => (int)$stats['total_users'],
            'total_bookings' => (int)$stats['total_bookings'],
            'total_revenue' => (float)$stats['total_revenue'],
            'flagged_reviews' => (int)$stats['flagged_reviews']
        ],
        'activities' => $activities
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load dashboard']);
}

function timeAgo($datetime) {
    $diff = time() - strtotime($datetime);
    if ($diff < 60) return 'just now';
    if ($diff < 3600) return floor($diff/60) . ' min ago';
    if ($diff < 86400) return floor($diff/3600) . ' hour' . (floor($diff/3600)>1?'s':'') . ' ago';
    if ($diff < 604800) return floor($diff/86400) . ' day' . (floor($diff/86400)>1?'s':'') . ' ago';
    return date('M j', strtotime($datetime));
}
