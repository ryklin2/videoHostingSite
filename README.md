
The purpose of this repository is to store all the code for your web application. This also includes the history of all commits made and who made them. Only code submitted on the master branch will be graded.

Please follow the instructions below and fill in the information requested when prompted.


# Build/Run Instructions

## Build Instructions
## Dependencies

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm packages (see package.json for full list):
  - express
  - express-handlebars
  - mysql2
  - bcryptjs
  - express-session
  - express-mysql-session
  - multer
  - express-validator

## Additional Information

- Copy `application/.env.example` to `application/.env` (it is git-ignored) and fill in:
  ```
  DB_HOST=localhost
  DB_USER=your_db_user
  DB_PASSWORD=your_db_password
  DB_NAME=database
  SESSION_SECRET=your_session_secret
  GOOGLE_CLIENT_ID=your-google-oauth-client-id
  GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
  # Must exactly match a Google Cloud Console authorized redirect URI.
  GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
  ```

- Replace the placeholders with your actual MySQL credentials and choose a strong session secret.

## Database Schema

Run the following SQL script to create the necessary tables:

```sql
CREATE DATABASE IF NOT EXISTS webapp;
USE your_database_name;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NULL,
  google_id VARCHAR(255) NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

The easiest way to create the database and every table above (plus the `conversations` and `messages` tables used by direct messages) is `npm run builddb` from `application/`; it reads the `DB_*` settings from `.env`.

In Google Cloud Console, create an OAuth 2.0 **Web application** client and add the callback URL above under **Authorized redirect URIs**. Never commit its client secret.

Message images and videos are stored in `application/private-uploads/messages` and are only served through an authenticated conversation-member route.
## Run Instructions
## How to Run the Application

1. Install dependencies:
   ```
   npm install everything listed in the json list
   ```

2. Set up the MySQL database:
   - Create a new MySQL database
   - Update the database configuration in `config/database.js`
   - Run the database schema script (see below)

3. Start the application:
   ```
   npm start
   ```

4. Open a web browser and navigate to http://localhost:3000
