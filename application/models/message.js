const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const pool = mysql.createPool(dbConfig[env]);

class Message {
  static async createConversation(userId, recipientId) {
    const [firstUserId, secondUserId] = [Number(userId), Number(recipientId)].sort((a, b) => a - b);
    const [result] = await pool.query(
      `INSERT INTO conversations (user_one_id, user_two_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), updated_at = updated_at`,
      [firstUserId, secondUserId]
    );
    return result.insertId;
  }

  static async getConversationsForUser(userId) {
    const [rows] = await pool.query(
      `SELECT c.id, c.updated_at, other_user.username,
        (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message,
        (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message_at
       FROM conversations c
       JOIN users AS other_user ON other_user.id = IF(c.user_one_id = ?, c.user_two_id, c.user_one_id)
       WHERE c.user_one_id = ? OR c.user_two_id = ?
       ORDER BY COALESCE(last_message_at, c.updated_at) DESC`,
      [userId, userId, userId]
    );
    return rows;
  }

  static async findConversationForUser(conversationId, userId) {
    const [rows] = await pool.query(
      `SELECT c.id, other_user.id AS other_user_id, other_user.username
       FROM conversations c
       JOIN users AS other_user ON other_user.id = IF(c.user_one_id = ?, c.user_two_id, c.user_one_id)
       WHERE c.id = ? AND (c.user_one_id = ? OR c.user_two_id = ?)`,
      [userId, conversationId, userId, userId]
    );
    return rows[0];
  }

  static async getMessages(conversationId) {
    const [rows] = await pool.query(
      `SELECT m.id, m.sender_id, m.body, m.media_filename, m.media_mime_type, m.created_at, u.username AS sender_username
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC, m.id ASC`,
      [conversationId]
    );
    return rows;
  }

  static async createMessage({ conversationId, senderId, body, mediaFilename, mediaMimeType }) {
    const [result] = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body, media_filename, media_mime_type)
       VALUES (?, ?, ?, ?, ?)`,
      [conversationId, senderId, body || null, mediaFilename || null, mediaMimeType || null]
    );
    await pool.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);
    return result.insertId;
  }

  static async getMediaForUser(messageId, userId) {
    const [rows] = await pool.query(
      `SELECT m.media_filename, m.media_mime_type
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.id = ? AND m.media_filename IS NOT NULL
         AND (c.user_one_id = ? OR c.user_two_id = ?)`,
      [messageId, userId, userId]
    );
    return rows[0];
  }
}

module.exports = Message;
