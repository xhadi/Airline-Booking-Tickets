<?php
require_once __DIR__ . '/../config/db.php';

class DuffelAPI {
    private $apiKey;
    private $env;
    private $baseUrl;

    public function __construct() {
        $this->apiKey = defined('DUFFEL_API_KEY') ? DUFFEL_API_KEY : '';
        $this->env = defined('DUFFEL_ENV') ? DUFFEL_ENV : 'test';
        $this->baseUrl = 'https://api.duffel.com';
    }

    public function executeRequest($endpoint, $method = 'GET', $payload = null) {
        if (empty($this->apiKey)) {
            throw new Exception("Duffel API credentials are not configured.");
        }

        $url = $this->baseUrl . $endpoint;
        $ch = curl_init($url);
        
        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Duffel-Version: v2',
            'Accept: application/json'
        ];

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, 1);
            if ($payload) {
                $jsonPayload = json_encode(['data' => $payload]);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
                $headers[] = 'Content-Type: application/json';
            }
        } elseif ($method === 'GET' && $payload) {
            $url .= '?' . http_build_query($payload);
            curl_setopt($ch, CURLOPT_URL, $url);
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
             throw new Exception("CURL Error: $curlError");
        }

        $decodedResponse = json_decode($response, true);

        if ($httpCode >= 400) {
            $errorMsg = "Duffel API Error ($httpCode)";
            if (isset($decodedResponse['errors'])) {
                $errorMsg .= ': ' . json_encode($decodedResponse['errors']);
            }
            throw new Exception($errorMsg);
        }

        return $decodedResponse;
    }
}
