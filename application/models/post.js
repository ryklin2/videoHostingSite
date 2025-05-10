const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const pool = mysql.createPool(dbConfig[env]);

class Post {
    static async create({ userId, title, description, videoPath }) {
        const [result] = await pool.query(
          'INSERT INTO posts (user_id, title, description, video_path) VALUES (?, ?, ?, ?)',
          [userId, title, description, videoPath]
        );
        return { id: result.insertId };
    }

    static async getGalleryPosts(limit = 20) {
        try {
            limit = Number(limit);
            
            if (isNaN(limit) || limit <= 0) {
                limit = 20;
            }
    
            const [rows] = await pool.query(
                `SELECT posts.id, posts.title, posts.video_path, posts.created_at, users.username 
                 FROM posts 
                 JOIN users ON posts.user_id = users.id 
                 ORDER BY posts.created_at DESC 
                 LIMIT ?`,
                [limit]
            );
            return rows;
        } catch (error) {
            console.error('Error in getGalleryPosts:', error);
            throw error;
        }
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?', [id]);
        return rows[0];
    }

    static async findByUserId(userId) {
        const [rows] = await pool.query('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows;
    }

    static async findAll(limit = 10, offset = 0) {
        const [rows] = await pool.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
        return rows;
    }

    static async search(query, limit = 10, offset = 0) {
        const [rows] = await pool.query('SELECT * FROM posts WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?', 
          [`%${query}%`, `%${query}%`, limit, offset]);
        return rows;
    }

    static async addLike(postId, userId) {
        try {
            const [result] = await pool.query(
                'INSERT INTO likes (post_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP',
                [postId, userId]
            );
            console.log(`Like added/updated for post ${postId} by user ${userId}`);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error adding like:', error);
            throw error;
        }
    }

    static async removeLike(postId, userId) {
        try {
            const [result] = await pool.query(
                'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            console.log(`Like removed for post ${postId} by user ${userId}`);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing like:', error);
            throw error;
        }
    }

    static async getLikesCount(postId) {
        try {
            const [rows] = await pool.query(
                'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
                [postId]
            );
            console.log(`Likes count for post ${postId}: ${rows[0].count}`);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting likes count:', error);
            throw error;
        }
    }

    static async isLikedByUser(postId, userId) {
        try {
            const [rows] = await pool.query(
                'SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            const isLiked = rows.length > 0;
            console.log(`Post ${postId} liked by user ${userId}: ${isLiked}`);
            return isLiked;
        } catch (error) {
            console.error('Error checking if post is liked:', error);
            throw error;
        }
    }

    static async addComment(postId, userId, content) {
        try {
            const [result] = await pool.query(
                'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
                [postId, userId, content]
            );
            console.log(`Comment added to post ${postId} by user ${userId}`);
            return result.insertId;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    static async getComments(postId) {
        try {
            const [rows] = await pool.query(
                'SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = ? ORDER BY created_at DESC',
                [postId]
            );
            console.log(`Retrieved ${rows.length} comments for post ${postId}`);
            return rows;
        } catch (error) {
            console.error('Error getting comments:', error);
            throw error;
        }
    }

    static async deletePost(postId, userId) {
        try {
            const [result] = await pool.query(
                'DELETE FROM posts WHERE id = ? AND user_id = ?',
                [postId, userId]
            );
            console.log(`Post ${postId} deleted by user ${userId}`);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }

    static async getLikedPosts(userId, limit = 10) {
        try {
            limit = Number(limit);
            if (isNaN(limit) || limit <= 0) {
                limit = 10;
            }
    
            const [rows] = await pool.query(
                `SELECT posts.* FROM posts 
                 INNER JOIN likes ON posts.id = likes.post_id 
                 WHERE likes.user_id = ? 
                 ORDER BY likes.created_at DESC 
                 LIMIT ?`,
                [userId, limit]
            );
            return rows;
        } catch (error) {
            console.error('Error in getLikedPosts:', error);
            throw error;
        }
    }

    static async getMostRecentPost() {
        const [rows] = await pool.query(
            'SELECT id FROM posts ORDER BY created_at DESC LIMIT 1'
        );
        return rows[0] ? rows[0].id : null;
    }

    static async searchPosts(query, limit = 10, offset = 0) {
        try {
            console.log('Searching for:', query);
            console.log('Limit:', limit);
            console.log('Offset:', offset);
    
            const sqlQuery = `
                SELECT posts.*, users.username 
                FROM posts 
                JOIN users ON posts.user_id = users.id
                WHERE posts.title LIKE ? OR posts.description LIKE ?
                ORDER BY posts.created_at DESC 
                LIMIT ? OFFSET ?
            `;
    
            const params = [`%${query}%`, `%${query}%`, limit, offset];
    
            console.log('SQL Query:', sqlQuery);
            console.log('SQL Parameters:', params);
    
            const [rows] = await pool.query(sqlQuery, params);
    
            console.log('Number of results:', rows.length);
            if (rows.length > 0) {
                console.log('First result:', rows[0]);
            } else {
                console.log('No results found');
            }
    
            return rows;
        } catch (error) {
            console.error('Error in searchPosts:', error);
            throw error;
        }
    }
    
    static async countSearchResults(query) {
        try {
            const [result] = await pool.query(
                `SELECT COUNT(*) as count
                 FROM posts 
                 WHERE title LIKE ? OR description LIKE ?`,
                [`%${query}%`, `%${query}%`]
            );
            return result[0].count;
        } catch (error) {
            console.error('Error counting search results:', error);
            throw error;
        }
    }

}
    
    

module.exports = Post;
