-- USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- TWITTER ID
  username TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  pub_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- COIN HOLDINGS
CREATE TABLE IF NOT EXISTS user_holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  coin_address TEXT NOT NULL,
  coin_ticker TEXT NOT NULL,
  amount REAL NOT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  coin_address TEXT NOT NULL,
  coin_ticker TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  amount REAL NOT NULL,
  price REAL NOT NULL,
  total_value REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- LEADERBOARD
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id TEXT PRIMARY KEY,
  points INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- BLINKS
CREATE TABLE IF NOT EXISTS blinks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('action', 'post', 'other')),
  icon TEXT,
  label TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  actions_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  likes_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CHAT_ROOMS
CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  admin_id TEXT, -- User ID of the chat room creator
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  avatar TEXT DEFAULT 'https://res-console.cloudinary.com/dcisswp5z/thumbnails/v1/image/upload/v1719741901/a2FhbGV6X3RodW1ibmFpbF9iZHc5NW4=/drilldown'
);

-- ROOM_PARTICIPANTS
CREATE TABLE IF NOT EXISTS room_participants (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- TODO
-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transaction', 'message', 'alert')),
  read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_username ON users (username);

CREATE INDEX IF NOT EXISTS idx_user_id_user_holdings ON user_holdings (user_id);
CREATE INDEX IF NOT EXISTS idx_coin_address_user_holdings ON user_holdings (coin_address);

CREATE INDEX IF NOT EXISTS idx_user_id_transactions ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_coin_address_transactions ON transactions (coin_address);
CREATE INDEX IF NOT EXISTS idx_timestamp_transactions ON transactions (timestamp);

CREATE INDEX IF NOT EXISTS idx_room_id_messages ON messages (room_id);
CREATE INDEX IF NOT EXISTS idx_user_id_messages ON messages (user_id);
CREATE INDEX IF NOT EXISTS idx_created_at_messages ON messages (created_at);

CREATE INDEX IF NOT EXISTS idx_points_leaderboard ON leaderboard (points);
CREATE INDEX IF NOT EXISTS idx_last_updated_leaderboard ON leaderboard (last_updated);

CREATE INDEX IF NOT EXISTS idx_user_id_blinks ON blinks (user_id);
CREATE INDEX IF NOT EXISTS idx_type_blinks ON blinks (type);
CREATE INDEX IF NOT EXISTS idx_created_at_blinks ON blinks (created_at);
CREATE INDEX IF NOT EXISTS idx_updated_at_blinks ON blinks (updated_at);

CREATE INDEX IF NOT EXISTS idx_admin_id_chat_rooms ON chat_rooms (admin_id);

CREATE INDEX IF NOT EXISTS idx_room_id_room_participants ON room_participants (room_id);
CREATE INDEX IF NOT EXISTS idx_user_id_room_participants ON room_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_user_id_notifications ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_created_at_notifications ON notifications (created_at);
