<?php
// Example database configuration
// Copy this file to 'db.php' and fill in your local credentials.
// Do NOT commit 'db.php' to version control!

$host = 'localhost';
$dbname = 'YOUR_DATABASE_NAME';
$username = 'YOUR_USERNAME';
$password = 'YOUR_PASSWORD';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>
