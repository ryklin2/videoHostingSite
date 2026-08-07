CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_one_id INT NOT NULL,
  user_two_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_conversation (user_one_id, user_two_id),
  CONSTRAINT conversation_users_differ CHECK (user_one_id < user_two_id),
  FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  body VARCHAR(2000) NULL,
  media_filename VARCHAR(255) NULL,
  media_mime_type VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX messages_by_conversation (conversation_id, created_at)
);
