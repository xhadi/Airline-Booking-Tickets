<?php
// backend/api/reviews.php
session_start();
require_once '../config/db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

try {
    // --- PUBLIC: List published reviews (GET, no auth) ---
    if ($method === 'GET' && !isset($_GET['booking_id']) && !isset($_GET['stats'])) {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;

        // Count total
        $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM review WHERE status = 'published'");
        $stmtCount->execute();
        $total = (int)$stmtCount->fetchColumn();

        // Fetch reviews with user name
        $stmt = $pdo->prepare("
            SELECT r.id, r.overall_rating, r.ease_of_booking, r.customer_support, r.value_for_money,
                   r.comment, r.status, r.created_at, r.updated_at,
                   u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM booking WHERE user_id = r.user_id) AS user_booking_count,
                   (SELECT COUNT(*) FROM review WHERE user_id = r.user_id) AS user_review_count
            FROM review r
            JOIN user u ON r.user_id = u.id
            WHERE r.status = 'published'
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->bindValue(1, $perPage, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'reviews' => $reviews,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage
        ]);
        exit;
    }

    // --- PUBLIC: Aggregate stats (GET ?stats=1, no auth) ---
    if ($method === 'GET' && isset($_GET['stats'])) {
        $stmt = $pdo->prepare("
            SELECT
                AVG(overall_rating) AS avg_rating,
                COUNT(*) AS total_reviews,
                SUM(CASE WHEN overall_rating = 5 THEN 1 ELSE 0 END) AS five_star,
                SUM(CASE WHEN overall_rating = 4 THEN 1 ELSE 0 END) AS four_star,
                SUM(CASE WHEN overall_rating = 3 THEN 1 ELSE 0 END) AS three_star,
                SUM(CASE WHEN overall_rating = 2 THEN 1 ELSE 0 END) AS two_star,
                SUM(CASE WHEN overall_rating = 1 THEN 1 ELSE 0 END) AS one_star
            FROM review
            WHERE status = 'published'
        ");
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Fetch top 3 reviews for landing page (highest rated, most recent tiebreak)
        $stmtTop = $pdo->prepare("
            SELECT r.id, r.overall_rating, r.comment, r.created_at,
                   u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM booking WHERE user_id = r.user_id) AS user_booking_count
            FROM review r
            JOIN user u ON r.user_id = u.id
            WHERE r.status = 'published'
            ORDER BY r.overall_rating DESC, r.created_at DESC
            LIMIT 3
        ");
        $stmtTop->execute();
        $topReviews = $stmtTop->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'stats' => [
                'avg_rating' => round((float)$stats['avg_rating'], 1),
                'total_reviews' => (int)$stats['total_reviews'],
                'distribution' => [
                    1 => (int)$stats['one_star'],
                    2 => (int)$stats['two_star'],
                    3 => (int)$stats['three_star'],
                    4 => (int)$stats['four_star'],
                    5 => (int)$stats['five_star']
                ]
            ],
            'top_reviews' => $topReviews
        ]);
        exit;
    }

    // --- AUTH REQUIRED for all below ---
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $userId = $_SESSION['user_id'];

    if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
        if (!$csrf || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrf)) {
            http_response_code(403);
            echo json_encode(['error' => 'Invalid CSRF token']);
            exit;
        }
    }

    // --- GET ?booking_id=N — check if booking has a review ---
    if ($method === 'GET' && isset($_GET['booking_id'])) {
        $bookingId = (int)$_GET['booking_id'];

        // Verify booking belongs to user
        $stmt = $pdo->prepare("SELECT id FROM booking WHERE id = ? AND user_id = ?");
        $stmt->execute([$bookingId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Booking not found or not yours']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, overall_rating, ease_of_booking, customer_support,
                               value_for_money, comment, status, created_at, updated_at
                               FROM review WHERE booking_id = ?");
        $stmt->execute([$bookingId]);
        $review = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'has_review' => $review !== false,
            'review' => $review ?: null
        ]);
        exit;
    }

    // --- POST — create review ---
    if ($method === 'POST' && $action !== 'flag') {
        $input = json_decode(file_get_contents('php://input'), true);

        $required = ['booking_id', 'overall_rating', 'ease_of_booking', 'customer_support', 'value_for_money'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Missing required field: $field"]);
                exit;
            }
        }

        $bookingId = (int)$input['booking_id'];

        // Verify booking belongs to user
        $stmt = $pdo->prepare("SELECT id, status, flight_snapshot FROM booking WHERE id = ? AND user_id = ?");
        $stmt->execute([$bookingId, $userId]);
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$booking) {
            http_response_code(403);
            echo json_encode(['error' => 'Booking not found or not yours']);
            exit;
        }

        if ($booking['status'] !== 'confirmed') {
            http_response_code(400);
            echo json_encode(['error' => 'Only completed flights can be reviewed']);
            exit;
        }

        // Check departure is in the past
        $snapshot = json_decode($booking['flight_snapshot'], true);
        if ($snapshot && isset($snapshot['slices'][0]['segments'][0])) {
            $depTimeStr = $snapshot['slices'][0]['segments'][0]['departure_time']
                       ?? $snapshot['slices'][0]['segments'][0]['departing_at']
                       ?? null;
            if ($depTimeStr) {
                $depTime = new DateTime($depTimeStr);
                if ($depTime > new DateTime()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Cannot review a flight that hasn\'t departed yet']);
                    exit;
                }
            }
        }

        // Validate ratings
        foreach (['overall_rating', 'ease_of_booking', 'customer_support', 'value_for_money'] as $r) {
            $val = (int)$input[$r];
            if ($val < 1 || $val > 5) {
                http_response_code(400);
                echo json_encode(['error' => "$r must be between 1 and 5"]);
                exit;
            }
        }

        $comment = isset($input['comment']) ? trim($input['comment']) : null;
        if ($comment !== null && mb_strlen($comment) > 1000) {
            http_response_code(400);
            echo json_encode(['error' => 'Comment must be 1000 characters or less']);
            exit;
        }

        // Check for existing review (UNIQUE constraint + application check)
        $stmt = $pdo->prepare("SELECT id FROM review WHERE booking_id = ?");
        $stmt->execute([$bookingId]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'You have already reviewed this booking']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO review (user_id, booking_id, overall_rating, ease_of_booking, customer_support, value_for_money, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $bookingId,
            (int)$input['overall_rating'],
            (int)$input['ease_of_booking'],
            (int)$input['customer_support'],
            (int)$input['value_for_money'],
            $comment
        ]);

        $reviewId = $pdo->lastInsertId();

        $stmt = $pdo->prepare("SELECT * FROM review WHERE id = ?");
        $stmt->execute([$reviewId]);
        $review = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'review' => $review]);

    // --- PUT ?id=N — update own review ---
    } elseif ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $reviewId = (int)($_GET['id'] ?? 0);

        if (!$reviewId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing review ID']);
            exit;
        }

        // Verify ownership
        $stmt = $pdo->prepare("SELECT id FROM review WHERE id = ? AND user_id = ?");
        $stmt->execute([$reviewId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Review not found or not yours']);
            exit;
        }

        $fields = [];
        $params = [];

        foreach (['overall_rating', 'ease_of_booking', 'customer_support', 'value_for_money'] as $r) {
            if (isset($input[$r])) {
                $val = (int)$input[$r];
                if ($val < 1 || $val > 5) {
                    http_response_code(400);
                    echo json_encode(['error' => "$r must be between 1 and 5"]);
                    exit;
                }
                $fields[] = "$r = ?";
                $params[] = $val;
            }
        }

        if (isset($input['comment'])) {
            $comment = trim($input['comment']);
            if (mb_strlen($comment) > 1000) {
                http_response_code(400);
                echo json_encode(['error' => 'Comment must be 1000 characters or less']);
                exit;
            }
            $fields[] = "comment = ?";
            $params[] = $comment;
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }

        // Reset status to published if updating a flagged review
        $fields[] = "status = 'published'";
        $params[] = $reviewId;

        $sql = "UPDATE review SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?";
        $params[] = $userId;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM review WHERE id = ?");
        $stmt->execute([$reviewId]);
        $review = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'review' => $review]);

    // --- DELETE ?id=N — delete own review ---
    } elseif ($method === 'DELETE') {
        $reviewId = (int)($_GET['id'] ?? 0);

        if (!$reviewId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing review ID']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM review WHERE id = ? AND user_id = ?");
        $stmt->execute([$reviewId, $userId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Review not found or not yours']);
            exit;
        }

        echo json_encode(['success' => true]);

    // --- POST ?action=flag&id=N — flag a review ---
    } elseif ($method === 'POST' && $action === 'flag') {
        $reviewId = (int)($_GET['id'] ?? 0);

        if (!$reviewId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing review ID']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE review SET status = 'flagged' WHERE id = ? AND status = 'published'");
        $stmt->execute([$reviewId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Review not found or already flagged']);
            exit;
        }

        echo json_encode(['success' => true]);

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Operation failed']);
}
