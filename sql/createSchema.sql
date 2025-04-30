create table if not exists test (
  id int,
  description text
);

insert into test values (1, 'test');

-- Create Table user
CREATE TABLE if not exists user (
  id TEXT PRIMARY KEY, -- To store UUIDs
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  browser_language TEXT
);

--Create Table friendship 
CREATE TABLE IF NOT EXISTS friendship (
  user_id1 TEXT NOT NULL,
  user_id2 TEXT NOT NULL,
  PRIMARY KEY (user_id1, user_id2),
  FOREIGN KEY (user_id1) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id2) REFERENCES user(id) ON DELETE CASCADE,
  CHECK (user_id1 < user_id2)
  CONSTRAINT unique_friendship UNIQUE (
    user_id1,
    user_id2
  )
);
--Query to List friends, ONLY friends from the North (stored in our DB):
/* SELECT u.id, u.username, u.email, u.latitude, u.longitude, u.browser_language
FROM friendship f
JOIN user u ON (u.id = f.user_id2 OR u.id = f.user_id1)
WHERE (f.user_id1 = ? OR f.user_id2 = ?) AND u.id != ?; */

--Query to Count friends, ONLY friends from the North (stored in our DB):
/* SELECT COUNT(*) as friend_total
FROM friendship
WHERE user_id1 = ? OR user_id2 = ?; */