-- ============================================================
-- MediFindAI - Sample / Demo Data
-- Passwords below are BCrypt hashes of: Password@123
-- ============================================================

USE medifindai;

-- ---------- USERS ----------
-- password for all sample users: Password@123
INSERT INTO users (full_name, email, phone, password_hash, role, is_active, is_email_verified) VALUES
('System Admin',      'admin@medifindai.com',       '9000000001', '$2a$10$7EqJtq98hPqEX7fNZaFWoOa5H1Z9G1kQ3n0V1nQxYt8p7c3q9w0aK', 'ADMIN', TRUE, TRUE),
('Ravi Kumar',        'ravi.kumar@example.com',      '9000000002', '$2a$10$7EqJtq98hPqEX7fNZaFWoOa5H1Z9G1kQ3n0V1nQxYt8p7c3q9w0aK', 'USER', TRUE, TRUE),
('Ananya Sharma',     'ananya.sharma@example.com',   '9000000003', '$2a$10$7EqJtq98hPqEX7fNZaFWoOa5H1Z9G1kQ3n0V1nQxYt8p7c3q9w0aK', 'USER', TRUE, TRUE),
('Suresh Reddy',      'suresh.pharmacy@example.com', '9000000004', '$2a$10$7EqJtq98hPqEX7fNZaFWoOa5H1Z9G1kQ3n0V1nQxYt8p7c3q9w0aK', 'PHARMACY_OWNER', TRUE, TRUE),
('Priya Nair',        'priya.pharmacy@example.com',  '9000000005', '$2a$10$7EqJtq98hPqEX7fNZaFWoOa5H1Z9G1kQ3n0V1nQxYt8p7c3q9w0aK', 'PHARMACY_OWNER', TRUE, TRUE);

-- ---------- MEDICINE CATEGORIES ----------
INSERT INTO medicine_categories (name, description) VALUES
('Analgesics', 'Pain relief medication'),
('Antibiotics', 'Bacterial infection treatment'),
('Antipyretics', 'Fever reducing medication'),
('Antacids', 'Digestive and acidity relief'),
('Antihistamines', 'Allergy relief medication'),
('Vitamins & Supplements', 'Nutritional supplements'),
('Cardiac Care', 'Heart and blood pressure medication'),
('Diabetes Care', 'Blood sugar management');

-- ---------- PHARMACIES ----------
INSERT INTO pharmacies (owner_id, name, license_number, description, address_line, city, state, postal_code, latitude, longitude, phone, email, opening_time, closing_time, is_24_hours, verification_status, is_active, rating) VALUES
(4, 'Apollo Care Pharmacy',   'LIC-TS-10023', 'Trusted neighbourhood pharmacy with a wide medicine range.', 'Road No. 12, Banjara Hills', 'Hyderabad', 'Telangana', '500034', 17.4126, 78.4483, '9100000001', 'contact@apollocare.example.com', '08:00:00', '22:00:00', FALSE, 'VERIFIED', TRUE, 4.5),
(4, 'MedPlus Express',        'LIC-TS-10099', '24x7 pharmacy for emergency medicine needs.', 'Jubilee Hills Road No. 3', 'Hyderabad', 'Telangana', '500033', 17.4325, 78.4071, '9100000002', 'contact@medplus.example.com', '00:00:00', '23:59:00', TRUE, 'VERIFIED', TRUE, 4.2),
(5, 'HealthFirst Pharmacy',   'LIC-TS-10145', 'Family-run pharmacy serving the community for 15 years.', 'Ameerpet Main Road', 'Hyderabad', 'Telangana', '500016', 17.4374, 78.4482, '9100000003', 'contact@healthfirst.example.com', '07:30:00', '21:30:00', FALSE, 'VERIFIED', TRUE, 4.7),
(5, 'CityCare Chemist',       'LIC-TS-10201', 'Pending verification - newly onboarded pharmacy.', 'Kukatpally Housing Board', 'Hyderabad', 'Telangana', '500072', 17.4849, 78.4108, '9100000004', 'contact@citycare.example.com', '09:00:00', '21:00:00', FALSE, 'PENDING', TRUE, 0.0);

-- ---------- MEDICINES ----------
INSERT INTO medicines (name, generic_name, manufacturer, category_id, dosage_form, strength, description, requires_prescription, barcode) VALUES
('Paracetamol 500mg',   'Paracetamol',   'Cipla Ltd',       3, 'Tablet',  '500mg', 'Used to treat fever and mild to moderate pain.', FALSE, '8901088012345'),
('Azithromycin 500mg',  'Azithromycin',  'Sun Pharma',      2, 'Tablet',  '500mg', 'Antibiotic used for bacterial infections.', TRUE, '8901088012346'),
('Cetirizine 10mg',     'Cetirizine',    'Dr. Reddy''s',    5, 'Tablet',  '10mg',  'Relieves allergy symptoms like sneezing and itching.', FALSE, '8901088012347'),
('Pantoprazole 40mg',   'Pantoprazole',  'Sun Pharma',      4, 'Tablet',  '40mg',  'Reduces stomach acid production.', FALSE, '8901088012348'),
('Ibuprofen 400mg',     'Ibuprofen',     'Abbott',          1, 'Tablet',  '400mg', 'Nonsteroidal anti-inflammatory pain reliever.', FALSE, '8901088012349'),
('Amoxicillin 500mg',   'Amoxicillin',   'Cipla Ltd',       2, 'Capsule', '500mg', 'Broad-spectrum antibiotic.', TRUE, '8901088012350'),
('Vitamin D3 60K',      'Cholecalciferol','Mankind Pharma', 6, 'Sachet',  '60000 IU', 'Weekly vitamin D3 supplement.', FALSE, '8901088012351'),
('Metformin 500mg',     'Metformin',     'USV Pvt Ltd',     8, 'Tablet',  '500mg', 'Controls blood sugar levels in type 2 diabetes.', TRUE, '8901088012352'),
('Amlodipine 5mg',      'Amlodipine',    'Zydus Cadila',    7, 'Tablet',  '5mg',   'Used to treat high blood pressure.', TRUE, '8901088012353'),
('ORS Sachet',          'Oral Rehydration Salts', 'FDC Ltd', 4, 'Sachet', 'Standard', 'Rehydration solution for dehydration.', FALSE, '8901088012354');


-- ---------- MEDICINE STOCK ----------
INSERT INTO medicine_stock (pharmacy_id, medicine_id, quantity, price, stock_status, low_stock_threshold) VALUES
(1, 1, 250, 25.00, 'AVAILABLE', 20),
(1, 3, 8,   45.00, 'LOW_STOCK', 10),
(1, 5, 0,   30.00, 'OUT_OF_STOCK', 15),
(1, 7, 60,  110.00,'AVAILABLE', 10),
(2, 1, 400, 22.50, 'AVAILABLE', 20),
(2, 2, 30,  85.00, 'AVAILABLE', 10),
(2, 4, 15,  95.00, 'AVAILABLE', 10),
(2, 10, 100,20.00, 'AVAILABLE', 20),
(3, 1, 180, 24.00, 'AVAILABLE', 20),
(3, 6, 5,   120.00,'LOW_STOCK', 10),
(3, 8, 90,  65.00, 'AVAILABLE', 15),
(3, 9, 70,  55.00, 'AVAILABLE', 10);

-- ---------- RESERVATIONS ----------
INSERT INTO reservations (reservation_code, user_id, pharmacy_id, medicine_id, quantity, unit_price, total_price, status, expires_at) VALUES
('RSV-20260810-0001', 2, 1, 1, 2, 25.00, 50.00,  'COMPLETED', '2026-08-11 12:00:00'),
('RSV-20260825-0002', 2, 2, 4, 1, 95.00, 95.00,  'READY_FOR_PICKUP', '2026-08-31 12:00:00'),
('RSV-20260828-0003', 3, 3, 8, 3, 65.00, 195.00, 'PENDING', '2026-09-01 12:00:00');

-- ---------- RESERVATION STATUS HISTORY ----------
INSERT INTO reservation_status_history (reservation_id, old_status, new_status, changed_by, remarks) VALUES
(1, NULL, 'PENDING', 2, 'Reservation created'),
(1, 'PENDING', 'CONFIRMED', 4, 'Confirmed by pharmacy'),
(1, 'CONFIRMED', 'COMPLETED', 4, 'Picked up by customer'),
(2, NULL, 'PENDING', 2, 'Reservation created'),
(2, 'PENDING', 'CONFIRMED', 4, 'Confirmed by pharmacy'),
(2, 'CONFIRMED', 'READY_FOR_PICKUP', 4, 'Ready at counter');

-- ---------- NOTIFICATIONS ----------
INSERT INTO notifications (user_id, title, message, type, reference_id, is_read) VALUES
(2, 'Reservation Ready', 'Your reservation RSV-20260825-0002 is ready for pickup at MedPlus Express.', 'PICKUP_REMINDER', 2, FALSE),
(2, 'Reservation Completed', 'Your reservation RSV-20260810-0001 has been completed. Thank you!', 'RESERVATION', 1, TRUE),
(3, 'Reservation Received', 'Your reservation RSV-20260828-0003 has been received and is pending confirmation.', 'RESERVATION', 3, FALSE);

-- ---------- FAVOURITE PHARMACIES ----------
INSERT INTO favourite_pharmacies (user_id, pharmacy_id) VALUES
(2, 1), (2, 2), (3, 3);

-- ---------- SEARCH HISTORY ----------
INSERT INTO search_history (user_id, search_term, result_count) VALUES
(2, 'paracetamol', 3),
(2, 'cetirizine', 1),
(3, 'metformin', 1);
