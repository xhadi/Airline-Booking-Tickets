<?php
// backend/lib/encryption.php
function encryptData($data) {
    $keyEnv = getenv('ENCRYPTION_KEY');
    if (!$keyEnv) {
        throw new \RuntimeException('ENCRYPTION_KEY environment variable is not set');
    }
    $key = base64_decode($keyEnv, true);
    if ($key === false || strlen($key) !== 32) {
        $key = hash('sha256', $keyEnv, true);
    }
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
    $encrypted = openssl_encrypt($data, 'aes-256-cbc', $key, 0, $iv);
    if ($encrypted === false) {
        throw new Exception('Failed to encrypt data');
    }
    return base64_encode($iv . $encrypted);
}

function decryptData($encrypted) {
    $keyEnv = getenv('ENCRYPTION_KEY');
    if (!$keyEnv) {
        throw new \RuntimeException('ENCRYPTION_KEY environment variable is not set');
    }
    $key = base64_decode($keyEnv, true);
    if ($key === false || strlen($key) !== 32) {
        $key = hash('sha256', $keyEnv, true);
    }
    $data = base64_decode($encrypted);
    $ivLength = openssl_cipher_iv_length('aes-256-cbc');
    $iv = substr($data, 0, $ivLength);
    $ciphertext = substr($data, $ivLength);
    return openssl_decrypt($ciphertext, 'aes-256-cbc', $key, 0, $iv);
}
?>
