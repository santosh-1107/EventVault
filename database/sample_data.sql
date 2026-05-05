-- ============================================================
-- EventVault - Sample Data
-- ============================================================

USE event_ticketing_db;

INSERT IGNORE INTO user (name, email, password_hash, phone, role) VALUES
('Demo Customer',  'customer@demo.com',  '$2a$12$5NC8ODIDCqi/JyXymLz3me7deR0skbdb0Kr8FWHiVTL7r4WxdY8OW', '9876543210', 'customer'),
('Demo Organizer', 'organizer@demo.com', '$2a$12$5NC8ODIDCqi/JyXymLz3me7deR0skbdb0Kr8FWHiVTL7r4WxdY8OW', '9876543211', 'organizer'),
('Admin User',     'admin@demo.com',     '$2a$12$5NC8ODIDCqi/JyXymLz3me7deR0skbdb0Kr8FWHiVTL7r4WxdY8OW', '9876543212', 'admin');

INSERT IGNORE INTO venue (name, address, city, state, country, capacity) VALUES
('Jawaharlal Nehru Stadium',  'Lodhi Road', 'New Delhi', 'Delhi',       'India', 75000),
('DY Patil Stadium',          'Nerul',      'Mumbai',    'Maharashtra', 'India', 55000),
('Chinnaswamy Stadium',       'Cubbon Rd',  'Bangalore', 'Karnataka',   'India', 40000),
('Phoenix Marketcity',        'Kurla',      'Mumbai',    'Maharashtra', 'India', 5000),
('Palace Grounds',            'Mehkri Circle', 'Bangalore', 'Karnataka','India', 30000);

INSERT IGNORE INTO event_category (name, slug, description) VALUES
('Music',    'music',    'Live concerts and music festivals'),
('Sports',   'sports',   'Sporting events and tournaments'),
('Theatre',  'theatre',  'Stage plays and performances'),
('Comedy',   'comedy',   'Stand-up comedy shows'),
('Tech',     'tech',     'Tech conferences and meetups'),
('Food',     'food',     'Food festivals and culinary events'),
('Art',      'art',      'Art exhibitions and cultural events'),
('Dance',    'dance',    'Dance performances and competitions');

INSERT IGNORE INTO venue_section (venue_id, name, section_type, row_count, col_count) VALUES
(1, 'VIP Lounge',   'vip',     5,  10),
(1, 'Gold Section', 'premium', 10, 20),
(1, 'Silver Stand', 'general', 15, 30),
(2, 'Platinum',     'vip',     4,  8),
(2, 'Gold',         'premium', 10, 20),
(2, 'General',      'general', 20, 25),
(3, 'VIP Pavilion', 'vip',     5,  10),
(3, 'East Stand',   'premium', 10, 20),
(3, 'West Stand',   'general', 15, 25);

INSERT IGNORE INTO seat (section_id, row_label, col_number, seat_label)
SELECT 1, r, c, CONCAT(r, c)
FROM (SELECT 'A' r UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E') r_rows
CROSS JOIN (SELECT 1 c UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) cols;

INSERT IGNORE INTO seat (section_id, row_label, col_number, seat_label)
SELECT 2, r, c, CONCAT(r, c)
FROM (SELECT 'A' r UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E') r_rows
CROSS JOIN (SELECT 1 c UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) cols;

INSERT IGNORE INTO seat (section_id, row_label, col_number, seat_label)
SELECT 3, r, c, CONCAT(r, c)
FROM (SELECT 'A' r UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E') r_rows
CROSS JOIN (SELECT 1 c UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) cols;

INSERT IGNORE INTO event (title, description, start_datetime, end_datetime, venue_id, organizer_id, total_seats, available_seats, status, is_active, poster_url) VALUES
('Arijit Singh Live in Concert','Experience the soulful voice of Arijit Singh in an unforgettable night of live music. Featuring hits spanning his entire career.',DATE_ADD(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY),1, 2, 150, 150, 'published', 1,'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80'),
('IPL Finals 2025 — MI vs CSK','The biggest T20 cricket clash! Mumbai Indians vs Chennai Super Kings battle it out in the ultimate final.',DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY),2, 2, 150, 150, 'published', 1,'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=80'),
('Sunburn Arena — Electronic Night','Asia''s biggest electronic music festival returns with world-class DJs and an electrifying atmosphere.',DATE_ADD(NOW(), INTERVAL 22 DAY), DATE_ADD(NOW(), INTERVAL 22 DAY),3, 2, 150, 150, 'published', 1,'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80'),
('Zakir Khan — Haq Se Single','The beloved stand-up comedian is back with his brand new show. Expect relatable stories and non-stop laughter.',DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY),4, 2, 150, 150, 'published', 1,'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80'),
('TechCrunch Disrupt India 2025','India''s premier startup conference. Three days of keynotes, panels, and networking with the best minds in tech.',DATE_ADD(NOW(), INTERVAL 45 DAY), DATE_ADD(NOW(), INTERVAL 47 DAY),5, 2, 150, 150, 'published', 1,'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80');

INSERT IGNORE INTO event_category_map (event_id, category_id)
SELECT e.event_id, c.category_id FROM event e, event_category c WHERE e.title LIKE '%Arijit%' AND c.slug = 'music'
UNION ALL
SELECT e.event_id, c.category_id FROM event e, event_category c WHERE e.title LIKE '%IPL%' AND c.slug = 'sports'
UNION ALL
SELECT e.event_id, c.category_id FROM event e, event_category c WHERE e.title LIKE '%Sunburn%' AND c.slug = 'music'
UNION ALL
SELECT e.event_id, c.category_id FROM event e, event_category c WHERE e.title LIKE '%Zakir%' AND c.slug = 'comedy'
UNION ALL
SELECT e.event_id, c.category_id FROM event e, event_category c WHERE e.title LIKE '%TechCrunch%' AND c.slug = 'tech';

INSERT IGNORE INTO event_seat (event_id, seat_id, price, currency, status)
SELECT e.event_id, s.seat_id,
  CASE vs.section_type WHEN 'vip' THEN 5000 WHEN 'premium' THEN 2500 ELSE 1000 END,
  'INR', 'available'
FROM event e
JOIN venue v ON e.venue_id = v.venue_id
JOIN venue_section vs ON vs.venue_id = v.venue_id
JOIN seat s ON s.section_id = vs.section_id
WHERE e.is_active = 1 AND e.status = 'published'
ON DUPLICATE KEY UPDATE price = VALUES(price);
