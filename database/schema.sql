CREATE TABLE IF NOT EXISTS users (
 id CHAR(36) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE CHECK(email = lower(email)),
 password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL,
 role VARCHAR(255) NOT NULL CHECK(role IN ('student','club','recruiter','university','admin')),
 status VARCHAR(255) NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
 profile JSON NOT NULL DEFAULT (JSON_OBJECT()), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash VARCHAR(255) PRIMARY KEY, user_id CHAR(36) NOT NULL,
 expires_at DATETIME(3) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS records (
 id CHAR(36) PRIMARY KEY, kind VARCHAR(255) NOT NULL, owner_id CHAR(36) NOT NULL,
 parent_id CHAR(36),
 data JSON NOT NULL DEFAULT (JSON_OBJECT()), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (owner_id) REFERENCES users(id),
 FOREIGN KEY (parent_id) REFERENCES records(id) ON DELETE CASCADE
);
CREATE INDEX records_kind_owner_idx ON records(kind, owner_id);
CREATE INDEX records_parent_idx ON records(parent_id);
CREATE TABLE IF NOT EXISTS conversation_members (
 conversation_id CHAR(36) NOT NULL,
 user_id CHAR(36) NOT NULL,
 PRIMARY KEY(conversation_id, user_id),
 FOREIGN KEY (conversation_id) REFERENCES records(id) ON DELETE CASCADE,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS club_members (
 club_id CHAR(36) NOT NULL,
 user_id CHAR(36) NOT NULL,
 role VARCHAR(255) NOT NULL DEFAULT 'member' CHECK(role IN ('member','manager')),
 PRIMARY KEY(club_id,user_id),
 FOREIGN KEY (club_id) REFERENCES records(id) ON DELETE CASCADE,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS event_registrations (
 event_id CHAR(36) NOT NULL,
 user_id CHAR(36) NOT NULL,
 attended boolean NOT NULL DEFAULT false, PRIMARY KEY(event_id,user_id),
 FOREIGN KEY (event_id) REFERENCES records(id) ON DELETE CASCADE,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS applications (
 id CHAR(36) PRIMARY KEY, job_id CHAR(36) NOT NULL,
 user_id CHAR(36) NOT NULL, cover_letter VARCHAR(255) NOT NULL DEFAULT '',
 status VARCHAR(255) NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewing','accepted','rejected','withdrawn')),
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), UNIQUE(job_id,user_id),
 FOREIGN KEY (job_id) REFERENCES records(id) ON DELETE CASCADE,
 FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS bids (
 id CHAR(36) PRIMARY KEY, auction_id CHAR(36) NOT NULL, user_id CHAR(36) NOT NULL,
 amount DECIMAL(14,2) NOT NULL CHECK(amount > 0), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (auction_id) REFERENCES records(id), FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX bids_auction_idx ON bids(auction_id,amount DESC);
CREATE TABLE IF NOT EXISTS notifications (
 id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL,
 title VARCHAR(255) NOT NULL, body VARCHAR(255) NOT NULL DEFAULT '', read_at DATETIME(3), created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX notifications_user_idx ON notifications(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS auth_limits (
 `key` VARCHAR(255) PRIMARY KEY, attempts integer NOT NULL, reset_at DATETIME(3) NOT NULL
);

