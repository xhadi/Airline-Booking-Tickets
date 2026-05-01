-- 1. USER TABLE
-- Tracks account holders and handles core authentication.
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50), 
    password_hash VARCHAR(255) NOT NULL,
    security_question VARCHAR(255) NOT NULL,
    security_answer_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TRAVELER PROFILE TABLE (The "Second Brain" for Bookings)
-- Powers the user's Profile Page. Stores reusable identities for faster checkout.
CREATE TABLE traveler_profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('m', 'f') NOT NULL,
    -- SECURITY LAYER: This column expects a base64 string from your PHP AES-256 encryption helper
    passport_number_encrypted VARCHAR(512), 
    issuing_country VARCHAR(3), -- ISO 3166-1 alpha-3 code (Required by Duffel)
    document_expiry DATE,       -- Required by Duffel
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- 3. BOOKING TABLE
-- The core transactional record linking your system to the API provider.
CREATE TABLE booking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pnr VARCHAR(50) UNIQUE, 
    duffel_offer_id VARCHAR(255) NOT NULL, 
    duffel_order_id VARCHAR(255) UNIQUE,   
    total_price DECIMAL(10, 2) NOT NULL,   
    currency VARCHAR(10) NOT NULL,         
    status ENUM('pending', 'confirmed', 'cancelled', 'failed', 'refunded') DEFAULT 'pending',
    flight_snapshot JSON NOT NULL,         -- Stores the immutable flight details at time of purchase
    passenger_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_duffel_order ON booking(duffel_order_id);
CREATE INDEX idx_pnr ON booking(pnr);

-- 4. PASSENGER TABLE (The Historical Snapshot)
-- Data is copied here FROM traveler_profile during checkout. 
-- This remains immutable even if the user updates their profile later.
CREATE TABLE passenger (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    duffel_passenger_id VARCHAR(255), 
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('m', 'f') NOT NULL,
    -- SECURITY LAYER: Copied from traveler_profile, remains encrypted at rest
    passport_number_encrypted VARCHAR(512), 
    issuing_country VARCHAR(3),
    document_expiry DATE,
    passenger_type ENUM('adult', 'child', 'infant_without_seat') NOT NULL,
    ticket_number VARCHAR(100) UNIQUE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE
);

-- 5. TRANSACTION TABLE
-- Isolates financial status from flight status.
CREATE TABLE transaction (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    payment_gateway_id VARCHAR(255), 
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    transaction_type ENUM('charge', 'refund') NOT NULL,
    status ENUM('pending', 'success', 'failed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE
);

-- 6. WEBHOOK LOG TABLE
-- Handles asynchronous state changes from the airline/Duffel.
CREATE TABLE webhook_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(100) NOT NULL,      
    duffel_event_id VARCHAR(255) UNIQUE NOT NULL,
    payload JSON NOT NULL,                 
    processed BOOLEAN DEFAULT FALSE,       
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);