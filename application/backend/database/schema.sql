CREATE DATABASE IF NOT EXISTS team03db;
USE team03db;

CREATE TABLE IF NOT EXISTS categories (
    category_id   INT          NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (category_id)
);

CREATE TABLE IF NOT EXISTS users (
    user_id        INT          NOT NULL AUTO_INCREMENT,
    sfsu_email     VARCHAR(100) NOT NULL UNIQUE,
    display_name   VARCHAR(100) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    account_status VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS posts (
    post_id          INT           NOT NULL AUTO_INCREMENT,
    category_id      INT           NOT NULL,
    seller_user_id   INT           DEFAULT NULL,
    item_title       VARCHAR(200)  NOT NULL,
    item_description TEXT          NOT NULL,
    item_price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    item_condition   VARCHAR(50)   NOT NULL DEFAULT 'Good',
    post_status      VARCHAR(20)   NOT NULL DEFAULT 'active',
    image_url        VARCHAR(500)  DEFAULT NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (seller_user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS meetup_locations (
    meetup_location_id  INT          NOT NULL AUTO_INCREMENT,
    location_name       VARCHAR(200) NOT NULL,
    location_description VARCHAR(300) DEFAULT NULL,
    campus_area         VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (meetup_location_id)
);

CREATE TABLE IF NOT EXISTS meetup_requests (
    meetup_request_id  INT         NOT NULL AUTO_INCREMENT,
    post_id            INT         NOT NULL,
    buyer_user_id      INT         NOT NULL,
    seller_user_id     INT         NOT NULL,
    meetup_location_id INT         DEFAULT NULL,
    request_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_time     DATETIME    DEFAULT NULL,
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meetup_request_id),
    FOREIGN KEY (post_id)            REFERENCES posts(post_id),
    FOREIGN KEY (buyer_user_id)      REFERENCES users(user_id),
    FOREIGN KEY (seller_user_id)     REFERENCES users(user_id),
    FOREIGN KEY (meetup_location_id) REFERENCES meetup_locations(meetup_location_id)
);

-- =============================================================
-- Messaging tables
-- One conversation per (post, buyer) pair. Seller is derived
-- from the post. Messages belong to a conversation.
-- =============================================================

CREATE TABLE IF NOT EXISTS conversations (
    conversation_id INT        NOT NULL AUTO_INCREMENT,
    post_id         INT        NOT NULL,
    buyer_user_id   INT        NOT NULL,
    seller_user_id  INT        NOT NULL,
    created_at      TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id),
    UNIQUE KEY uniq_convo (post_id, buyer_user_id),
    FOREIGN KEY (post_id)        REFERENCES posts(post_id),
    FOREIGN KEY (buyer_user_id)  REFERENCES users(user_id),
    FOREIGN KEY (seller_user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    message_id      INT        NOT NULL AUTO_INCREMENT,
    conversation_id INT        NOT NULL,
    sender_user_id  INT        NOT NULL,
    body            TEXT       NOT NULL,
    created_at      TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id),
    FOREIGN KEY (sender_user_id)  REFERENCES users(user_id)
);