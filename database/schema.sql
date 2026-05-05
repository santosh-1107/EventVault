-- ============================================================
-- EventVault - MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS event_ticketing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_ticketing_db;

CREATE TABLE IF NOT EXISTS user (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          ENUM('customer','organizer','admin') NOT NULL DEFAULT 'customer',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
);

CREATE TABLE IF NOT EXISTS venue (
  venue_id   INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  address    TEXT,
  city       VARCHAR(80),
  state      VARCHAR(80),
  country    VARCHAR(80) DEFAULT 'India',
  pincode    VARCHAR(10),
  latitude   DECIMAL(10,7),
  longitude  DECIMAL(10,7),
  capacity   INT DEFAULT 0,
  image_url  VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venue_section (
  section_id   INT AUTO_INCREMENT PRIMARY KEY,
  venue_id     INT NOT NULL,
  name         VARCHAR(100) NOT NULL,
  section_type ENUM('vip','premium','general','balcony','floor') DEFAULT 'general',
  row_count    INT DEFAULT 10,
  col_count    INT DEFAULT 20,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venue(venue_id) ON DELETE CASCADE,
  INDEX idx_venue (venue_id)
);

CREATE TABLE IF NOT EXISTS seat (
  seat_id    INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  row_label  VARCHAR(5) NOT NULL,
  col_number INT NOT NULL,
  seat_label VARCHAR(20) NOT NULL,
  is_active  TINYINT(1) DEFAULT 1,
  FOREIGN KEY (section_id) REFERENCES venue_section(section_id) ON DELETE CASCADE,
  UNIQUE KEY uq_seat (section_id, row_label, col_number),
  INDEX idx_section (section_id)
);

CREATE TABLE IF NOT EXISTS event_category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  slug        VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  icon_url    VARCHAR(500),
  is_active   TINYINT(1) DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event (
  event_id         INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  start_datetime   DATETIME NOT NULL,
  end_datetime     DATETIME,
  venue_id         INT NOT NULL,
  organizer_id     INT NOT NULL,
  poster_url       VARCHAR(500),
  banner_url       VARCHAR(500),
  total_seats      INT NOT NULL DEFAULT 0,
  available_seats  INT NOT NULL DEFAULT 0,
  status           ENUM('draft','published','cancelled','completed') DEFAULT 'draft',
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venue(venue_id),
  FOREIGN KEY (organizer_id) REFERENCES user(user_id),
  INDEX idx_start (start_datetime),
  INDEX idx_status (status),
  INDEX idx_organizer (organizer_id)
);

CREATE TABLE IF NOT EXISTS event_category_map (
  event_id    INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (event_id, category_id),
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES event_category(category_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_seat (
  event_seat_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id      INT NOT NULL,
  seat_id       INT NOT NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency      VARCHAR(5) NOT NULL DEFAULT 'INR',
  status        ENUM('available','booked','blocked','reserved') DEFAULT 'available',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_seat (event_id, seat_id),
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seat(seat_id) ON DELETE CASCADE,
  INDEX idx_event (event_id),
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS booking (
  booking_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  event_id     INT NOT NULL,
  booking_ref  VARCHAR(30) NOT NULL UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  currency     VARCHAR(5) NOT NULL DEFAULT 'INR',
  status       ENUM('pending','confirmed','cancelled','refunded') DEFAULT 'pending',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id),
  FOREIGN KEY (event_id) REFERENCES event(event_id),
  INDEX idx_user (user_id),
  INDEX idx_event (event_id),
  INDEX idx_status (status),
  INDEX idx_ref (booking_ref)
);

CREATE TABLE IF NOT EXISTS booking_seat (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  booking_id    INT NOT NULL,
  seat_id       INT NOT NULL,
  event_seat_id INT NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seat(seat_id),
  FOREIGN KEY (event_seat_id) REFERENCES event_seat(event_seat_id),
  UNIQUE KEY uq_booking_event_seat (booking_id, event_seat_id),
  INDEX idx_booking (booking_id)
);

CREATE TABLE IF NOT EXISTS booking_status (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  status     VARCHAR(30) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes      TEXT,
  FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE,
  INDEX idx_booking (booking_id)
);

CREATE TABLE IF NOT EXISTS payment (
  payment_id      INT AUTO_INCREMENT PRIMARY KEY,
  booking_id      INT NOT NULL,
  txn_id          VARCHAR(50) NOT NULL UNIQUE,
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(5) NOT NULL DEFAULT 'INR',
  payment_method  ENUM('upi','card','netbanking','wallet','cash') NOT NULL,
  card_last4      VARCHAR(4),
  upi_id          VARCHAR(100),
  status          ENUM('pending','success','failed','refunded') DEFAULT 'pending',
  failure_reason  VARCHAR(255),
  qr_code_url     TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES booking(booking_id),
  INDEX idx_booking (booking_id),
  INDEX idx_txn (txn_id)
);
