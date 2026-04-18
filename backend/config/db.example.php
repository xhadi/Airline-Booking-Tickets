<?php
// Example database configuration
// Copy this file to 'db.php' and fill in your local credentials.
// Do NOT commit 'db.php' to version control!

// Database Configuration
$host = 'localhost';
$dbname = 'YOUR_DATABASE_NAME';
$username = 'YOUR_USERNAME';
$password = 'YOUR_PASSWORD';

// Duffel API Configuration
define('DUFFEL_API_KEY', 'your_duffel_api_key_here');
define('DUFFEL_ENV', 'test'); // 'test' or 'live'

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>
