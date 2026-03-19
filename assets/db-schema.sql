-- Database schema for flight booking system
-- Table to store user information
Create Table user(
    id int primary key auto_increment,
    first_name varchar(255) not null,
    last_name varchar(255) not null,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    created_at timestamp default current_timestamp
)

-- Table to store booking information
Create Table booking(
    id int primary key auto_increment,
    user_id int not null,
    pnr varchar(255) not null unique,
    api_order_id varchar(255) not null unique,
    total_price decimal(10, 2) not null,
    currency varchar(10) not null,
    status varchar(50) not null default 'confirmed',
    flight_snapshot json not null,
    passenger_count int not null default 1,
    created_at timestamp default current_timestamp,
    foreign key (user_id) references user(id) on delete cascade
)

-- Create an index on PNR for faster lookups when a user searches their booking
CREATE INDEX idx_pnr ON bookings(pnr);