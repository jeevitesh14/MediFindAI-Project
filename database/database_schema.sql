-- ============================================================
-- MediFindAI - Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS medifindai
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE medifindai;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(120)   NOT NULL,
    email               VARCHAR(150)   NOT NULL,
    phone               VARCHAR(20),
    password_hash       VARCHAR(255)   NOT NULL,
    role                ENUM('USER','PHARMACY_OWNER','ADMIN') NOT NULL DEFAULT 'USER',
    is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN        NOT NULL DEFAULT FALSE,
    profile_image_url   VARCHAR(500),
    latitude            DECIMAL(10,7),
    longitude           DECIMAL(10,7),
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 2. REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    token        VARCHAR(500) NOT NULL,
    expires_at   TIMESTAMP NOT NULL,
    revoked       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_refresh_token UNIQUE (token),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3. PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE password_reset_tokens (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    token        VARCHAR(255) NOT NULL,
    expires_at   TIMESTAMP NOT NULL,
    used         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_password_reset_token UNIQUE (token),
    CONSTRAINT fk_pwreset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 4. OTP VERIFICATION
-- ============================================================
CREATE TABLE otp_verifications (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    otp_code      VARCHAR(10) NOT NULL,
    purpose       ENUM('REGISTRATION','PASSWORD_RESET','LOGIN_2FA') NOT NULL,
    expires_at    TIMESTAMP NOT NULL,
    verified      BOOLEAN NOT NULL DEFAULT FALSE,
    attempts      INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 5. PHARMACIES
-- ============================================================
CREATE TABLE pharmacies (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id             BIGINT NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    license_number       VARCHAR(100) NOT NULL,
    description          TEXT,
    address_line         VARCHAR(255) NOT NULL,
    city                 VARCHAR(100) NOT NULL,
    state                VARCHAR(100) NOT NULL,
    postal_code          VARCHAR(20),
    latitude             DECIMAL(10,7) NOT NULL,
    longitude            DECIMAL(10,7) NOT NULL,
    phone                VARCHAR(20) NOT NULL,
    email                VARCHAR(150),
    opening_time         TIME,
    closing_time         TIME,
    is_24_hours          BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status  ENUM('PENDING','VERIFIED','REJECTED') NOT NULL DEFAULT 'PENDING',
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    rating               DECIMAL(2,1) DEFAULT 0.0,
    logo_url             VARCHAR(500),
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_pharmacy_license UNIQUE (license_number),
    CONSTRAINT fk_pharmacy_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_pharmacy_location ON pharmacies(latitude, longitude);
CREATE INDEX idx_pharmacy_verification ON pharmacies(verification_status);
CREATE INDEX idx_pharmacy_city ON pharmacies(city);

-- ============================================================
-- 6. PHARMACY VERIFICATION RECORDS (audit trail)
-- ============================================================
CREATE TABLE pharmacy_verifications (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_id      BIGINT NOT NULL,
    reviewed_by      BIGINT,
    status           ENUM('PENDING','VERIFIED','REJECTED') NOT NULL,
    remarks          TEXT,
    document_url     VARCHAR(500),
    reviewed_at      TIMESTAMP NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pv_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    CONSTRAINT fk_pv_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 7. MEDICINE CATEGORIES
-- ============================================================
CREATE TABLE medicine_categories (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(255),
    CONSTRAINT uq_category_name UNIQUE (name)
) ENGINE=InnoDB;

-- ============================================================
-- 8. MEDICINES (catalog - generic definition, not stock)
-- ============================================================
CREATE TABLE medicines (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    generic_name        VARCHAR(200),
    manufacturer        VARCHAR(150),
    category_id         BIGINT,
    dosage_form         VARCHAR(50),
    strength            VARCHAR(50),
    description         TEXT,
    requires_prescription BOOLEAN NOT NULL DEFAULT FALSE,
    image_url           VARCHAR(500),
    barcode             VARCHAR(100) UNIQUE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicine_category FOREIGN KEY (category_id) REFERENCES medicine_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE FULLTEXT INDEX idx_medicine_search ON medicines(name, generic_name);
CREATE INDEX idx_medicine_category ON medicines(category_id);
CREATE INDEX idx_medicine_barcode ON medicines(barcode);


-- ============================================================
-- 9. MEDICINE STOCK (per pharmacy inventory)
-- ============================================================
CREATE TABLE medicine_stock (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_id      BIGINT NOT NULL,
    medicine_id      BIGINT NOT NULL,
    quantity         INT NOT NULL DEFAULT 0,
    price            DECIMAL(10,2) NOT NULL,
    stock_status     ENUM('AVAILABLE','LOW_STOCK','OUT_OF_STOCK') NOT NULL DEFAULT 'OUT_OF_STOCK',
    low_stock_threshold INT NOT NULL DEFAULT 10,
    last_restocked_at TIMESTAMP NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_pharmacy_medicine UNIQUE (pharmacy_id, medicine_id),
    CONSTRAINT fk_stock_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_stock_status ON medicine_stock(stock_status);
CREATE INDEX idx_stock_price ON medicine_stock(price);

-- ============================================================
-- 10. RESERVATIONS
-- ============================================================
CREATE TABLE reservations (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    reservation_code    VARCHAR(30) NOT NULL,
    user_id             BIGINT NOT NULL,
    pharmacy_id         BIGINT NOT NULL,
    medicine_id         BIGINT NOT NULL,
    quantity            INT NOT NULL DEFAULT 1,
    unit_price          DECIMAL(10,2) NOT NULL,
    total_price          DECIMAL(10,2) NOT NULL,
    status              ENUM('PENDING','CONFIRMED','READY_FOR_PICKUP','COMPLETED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PENDING',
    expires_at          TIMESTAMP NULL,
    picked_up_at        TIMESTAMP NULL,
    cancellation_reason VARCHAR(255),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_reservation_code UNIQUE (reservation_code),
    CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_res_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
    CONSTRAINT fk_res_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_reservation_status ON reservations(status);
CREATE INDEX idx_reservation_user ON reservations(user_id);

-- ============================================================
-- 11. RESERVATION STATUS HISTORY
-- ============================================================
CREATE TABLE reservation_status_history (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    reservation_id   BIGINT NOT NULL,
    old_status       VARCHAR(30),
    new_status       VARCHAR(30) NOT NULL,
    changed_by       BIGINT,
    remarks          VARCHAR(255),
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rsh_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT fk_rsh_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    title         VARCHAR(150) NOT NULL,
    message       VARCHAR(500) NOT NULL,
    type          ENUM('RESERVATION','STOCK_ALERT','PICKUP_REMINDER','SYSTEM') NOT NULL,
    reference_id  BIGINT,
    is_read       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notification_user_read ON notifications(user_id, is_read);

-- ============================================================
-- 13. SEARCH HISTORY
-- ============================================================
CREATE TABLE search_history (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT,
    search_term   VARCHAR(200) NOT NULL,
    result_count  INT DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_search_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_search_term ON search_history(search_term);

-- ============================================================
-- 14. FAVOURITE PHARMACIES
-- ============================================================
CREATE TABLE favourite_pharmacies (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    pharmacy_id   BIGINT NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_fav_user_pharmacy UNIQUE (user_id, pharmacy_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_pharmacy FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 15. AI ASSISTANT CHAT LOGS
-- ============================================================
CREATE TABLE ai_chat_logs (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT,
    session_id    VARCHAR(100) NOT NULL,
    role          ENUM('USER','ASSISTANT') NOT NULL,
    message       TEXT NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_chat_session ON ai_chat_logs(session_id);

-- ============================================================
-- 16. PRESCRIPTION OCR RECORDS
-- ============================================================
CREATE TABLE prescription_ocr_records (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    image_url           VARCHAR(500) NOT NULL,
    raw_extracted_text  TEXT,
    detected_medicines  TEXT COMMENT 'JSON array of matched medicine names',
    ocr_provider        VARCHAR(50),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ocr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
