CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    oauth_subject VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    CONSTRAINT check_roles CHECK (role IN ('admin', 'moderator'))
);

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE'
);

CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'CREATED',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (oauth_subject, email, role)
VALUES
('11111111-1111-1111-1111-111111111111', 'admin@xpo-logistics.com', 'admin'),
('22222222-2222-2222-2222-222222222222', 'mod@xpo-logistics.com', 'moderator');

INSERT INTO warehouses (name, city, capacity) 
VALUES ('GdyniaLena ', 'Gdynia', 3000),
('Supreme shipment', 'Warsaw', 5000);

INSERT INTO vehicles (plate, type, status) 
VALUES ('SZ28054', 'MAN TGX 26 460', 'AVAILABLE');

INSERT INTO shipments (title, origin, destination, status, created_by, created_at) 
VALUES ('Electronics delivery', 'Gdynia', 'Warsaw', 'IN_TRANSIT', 1, NOW()),
('Clothes delivery', 'Warsaw', 'Gdynia', 'IN_TRANSIT', 1, '2026-01-20 22:07:46'),
('Furniture delivery', 'Gdynia', 'Warsaw', 'IN_TRANSIT', 1, '2026-01-25 12:30:00');
