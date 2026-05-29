USE team03db;

-- Clear existing data and reset auto increment
DELETE FROM posts;
DELETE FROM categories;
ALTER TABLE posts AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;

-- Insert categories
INSERT INTO categories (category_name) VALUES
('Books'),
('Electronics'),
('Furniture');

-- Insert test posts with real images
INSERT INTO posts (category_id, item_title, item_description, item_price, item_condition, post_status, image_url)
VALUES
(1, 'Java Programming', 'Good condition Java textbook, used one semester', 10.00, 'Good', 'active', 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?q=80&w=1287&auto=format&fit=crop'),
(1, 'Calculus Textbook', 'Early Transcendentals 8th edition, minor highlights', 15.00, 'Fair', 'active', 'https://images.unsplash.com/photo-1676302447092-14a103558511?q=80&w=1335&auto=format&fit=crop'),
(1, 'Python Crash Course', 'Brand new, never used', 20.00, 'New', 'active', 'https://images.unsplash.com/photo-1649180556628-9ba704115795?q=80&w=2324&auto=format&fit=crop'),
(2, 'MacBook Pro 2020', 'Used laptop in good condition, 16GB RAM', 800.00, 'Good', 'active', 'https://images.unsplash.com/photo-1647805256867-dbdd0108b331?q=80&w=1287&auto=format&fit=crop'),
(2, 'iPhone 13', 'Barely used, comes with original charger', 500.00, 'Like New', 'active', 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=1760&auto=format&fit=crop'),
(2, 'Sony Headphones', 'Noise cancelling, great for studying', 80.00, 'Good', 'active', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1288&auto=format&fit=crop'),
(3, 'IKEA Desk', 'White desk, 120cm wide, easy to assemble', 60.00, 'Good', 'active', 'https://images.unsplash.com/photo-1565791380713-1756b9a05343?q=80&w=1760&auto=format&fit=crop'),
(3, 'Office Chair', 'Adjustable height, comfortable for long study sessions', 45.00, 'Fair', 'active', 'https://images.unsplash.com/photo-1688578735352-9a6f2ac3b70a?q=80&w=1287&auto=format&fit=crop'),
(3, 'Bookshelf', 'Wooden bookshelf, 5 shelves, great condition', 35.00, 'Good', 'active', 'https://images.unsplash.com/photo-1543248939-4296e1fea89b?q=80&w=2348&auto=format&fit=crop');

-- Insert SFSU meetup locations
INSERT INTO meetup_locations (location_name, location_description, campus_area) VALUES
('Cesar Chavez Student Center', 'Main student union building', 'Student Life'),
('Mashouf Wellness Center', 'Recreation and wellness facility', 'Recreation'),
('J. Paul Leonard Library', 'Main campus library', 'Academic'),
('Science & Engineering Innovation Center (SEC)', 'Engineering and science building', 'Academic');
