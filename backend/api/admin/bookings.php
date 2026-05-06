<?php
// backend/api/admin/bookings.php
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
        $status = $_GET['status'] ?? 'all';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 20;
        $offset = ($page - 1) * $perPage;

        $where = '';
        $params = [];
        if ($status !== 'all') {
            $where = 'WHERE b.status = ?';
            $params[] = $status;
        }

        $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM booking b $where");
        $stmtCount->execute($params);
        $total = (int)$stmtCount->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT b.id, b.pnr, b.total_price, b.currency, b.status, b.flight_snapshot, b.created_at,
                   CONCAT(u.first_name, ' ', u.last_name) AS user_name
            FROM booking b
            JOIN user u ON b.user_id = u.id
            $where
            ORDER BY b.created_at DESC
            LIMIT " . (int)$perPage . " OFFSET " . (int)$offset . "
        ");
        if ($params) $stmt->execute($params); else $stmt->execute();
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($bookings as &$b) {
            $snap = json_decode($b['flight_snapshot'], true);
            $origin = '---'; $dest = '---';
            if ($snap && isset($snap['slices'][0]['segments'][0])) {
                $s = $snap['slices'][0]['segments'];
                $first = $s[0]; $last = $s[count($s)-1];
                $origin = is_array($first['origin']) ? $first['origin']['iata_code'] : $first['origin'];
                $dest = is_array($last['destination']) ? $last['destination']['iata_code'] : $last['destination'];
            }
            $b['route'] = "$origin → $dest";
            unset($b['flight_snapshot']);
        }

        echo json_encode([
            'success' => true,
            'bookings' => $bookings,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage
        ]);

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $bookingId = (int)($input['booking_id'] ?? 0);

        if (!$bookingId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing booking ID']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, status, total_price, currency FROM booking WHERE id = ?");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$booking) {
            http_response_code(404);
            echo json_encode(['error' => 'Booking not found']);
            exit;
        }

        if (!in_array($booking['status'], ['confirmed'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Only confirmed bookings can be cancelled']);
            exit;
        }

        $pdo->prepare("UPDATE booking SET status = 'cancelled', cancellation_data = ? WHERE id = ?")
            ->execute([json_encode(['cancelled_by' => 'admin', 'admin_username' => $_SESSION['admin_username']]), $bookingId]);

        $pdo->prepare("INSERT INTO transaction (booking_id, amount, currency, transaction_type, status) VALUES (?, ?, ?, 'refund', 'success')")
            ->execute([$bookingId, $booking['total_price'], $booking['currency']]);

        echo json_encode(['success' => true]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Operation failed']);
}
