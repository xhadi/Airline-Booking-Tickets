<?php
// backend/lib/encryption.php
function encryptData($data) {
    $key = base64_decode($_ENV['ENCRYPTION_KEY'] ?? 'your-32-character-secret-here');
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
    $encrypted = openssl_encrypt($data, 'aes-256-cbc', $key, 0, $iv);
    return base64_encode($iv . $encrypted);
}

function decryptData($encrypted) {
    $key = base64_decode($_ENV['ENCRYPTION_KEY'] ?? 'your-32-character-secret-here');
    $data = base64_decode($encrypted);
    $ivLength = openssl_cipher_iv_length('aes-256-cbc');
    $iv = substr($data, 0, $ivLength);
    $ciphertext = substr($data, $ivLength);
    return openssl_decrypt($ciphertext, 'aes-256-cbc', $key, 0, $iv);
}
?>