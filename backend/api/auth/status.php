<?php
// backend/api/auth/status.php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'authenticated' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'first_name' => $_SESSION['first_name'],
            'last_name' => $_SESSION['last_name'],
            'email' => $_SESSION['email'],
            'phone_number' => $_SESSION['phone_number'] ?? ''
        ]
    ]);
} else {
    echo json_encode(['authenticated' => false]);
}
