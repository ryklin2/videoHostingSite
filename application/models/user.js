const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const pool = mysql.createPool(dbConfig[env]);

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

class User {
  static async create(username, email, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      console.log('User created:', result.insertId);
      return { id: result.insertId, username, email };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows[0]) {
            const { password, ...userWithoutPassword } = rows[0];
            console.log('User found by username:', userWithoutPassword);
        } else {
            console.log('User not found for username:', username);
        }
        return rows[0];
    } catch (error) {
        console.error('Error finding user by username:', error);
        throw error;
    }
  }

  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findByGoogleId(googleId) {
    const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return rows[0];
  }

  // A verified Google email is used to link an existing password account. This
  // keeps bcrypt login available while avoiding duplicate accounts per email.
  static async findOrCreateGoogleUser({ googleId, email, displayName }) {
    let user = await this.findByGoogleId(googleId);
    if (user) return user;

    user = await this.findByEmail(email);
    if (user) {
      if (user.google_id && user.google_id !== googleId) {
        throw new Error('This email is already linked to another Google account.');
      }
      await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
      return { ...user, google_id: googleId };
    }

    const baseUsername = (displayName || email.split('@')[0] || 'googleuser')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 40) || 'googleuser';

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const suffix = attempt === 0 ? '' : String(Math.floor(1000 + Math.random() * 9000));
      const username = `${baseUsername.slice(0, 50 - suffix.length)}${suffix}`;
      try {
        const [result] = await pool.query(
          'INSERT INTO users (username, email, password, google_id) VALUES (?, ?, NULL, ?)',
          [username, email, googleId]
        );
        return { id: result.insertId, username, email, google_id: googleId };
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
        // An email collision can occur in a concurrent first Google login.
        user = await this.findByGoogleId(googleId);
        if (user) return user;
        user = await this.findByEmail(email);
        if (user && (!user.google_id || user.google_id === googleId)) {
          await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
          return { ...user, google_id: googleId };
        }
      }
    }

    throw new Error('Could not create a unique username for this Google account.');
  }

  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      if (rows[0]) {
        const { password, ...userWithoutPassword } = rows[0];
        console.log('User found by id:', userWithoutPassword);
      } else {
        console.log('User not found for id:', id);
      }
      return rows[0];
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async getUserPosts(userId) {
    try {
      const [rows] = await pool.query('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
      console.log(`Found ${rows.length} posts for user ${userId}`);
      return rows;
    } catch (error) {
      console.error('Error getting user posts:', error);
      throw error;
    }
  }
}

module.exports = User;
