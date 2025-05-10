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