
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

- Make sure to create a `.env` file in the root directory with the following variables:
  ```
  DB_HOST=localhost
  DB_USER=daniel
  DB_PASSWORD=aztec
  DB_NAME=database
  SESSION_SECRET=your_session_secret
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
  password VARCHAR(255) NOT NULL,
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
