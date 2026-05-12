<?php
// API Configuration (no DB connection needed)
// Copy this file to 'config.php' and fill in credentials
// Do NOT commit 'config.php' to version control!

// Duffel API Configuration
define('DUFFEL_API_KEY', 'your_duffel_api_key_here');
define('DUFFEL_ENV', 'test'); // 'test' or 'live'

// Encryption key used to encrypt/decrypt sensitive data (passport numbers)
// Generate one with: php -r "echo base64_encode(random_bytes(32));"
define('ENCRYPTION_KEY', 'your_base64_encoded_32_byte_key');
