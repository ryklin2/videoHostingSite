const express = require('express');
const multer = require('multer');
const path = require('path');
const Post = require('../models/post');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/videos');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith('video/') && 
        file.originalname.match(/\.(mp4|mov|avi|wmv|webm)$/)) {
        cb(null, true);
    } else {
        cb(new Error('Only video files (mp4, mov, avi, wmv, webm) are allowed!'), false);
    }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

router.post('/create', isAuthenticated, upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send('No video file uploaded');
      }

      if (!req.session.user) {
        return res.status(401).send('User not authenticated');
      }
  
      const { title, description } = req.body;
      const videoPath = `/uploads/videos/${req.file.filename}`;
  
      const post = await Post.create({
        userId: req.session.user.id,
        title,
        description,
        videoPath
      });
  
      res.redirect(`/post/${post.id}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error creating post');
    }
  });

router.get('/postvideo', isAuthenticated, (req, res) => {
    res.render('postvideo', { 
        title: 'Post a New Video',
        user: req.session.user
    });
});

router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        const comments = await Post.getComments(req.params.id);
        const likesCount = await Post.getLikesCount(req.params.id);
        const isLiked = req.session.user ? await Post.isLikedByUser(req.params.id, req.session.user.id) : false;

        console.log('Rendering viewpost. Session user:', req.session.user);

        res.render('viewpost', { 
            title: 'View Post', 
            user: req.session.user,
            post: post,
            comments: comments,
            likesCount: likesCount,
            isLiked: isLiked
        });
    } catch (error) {
        console.error('Error in viewpost route:', error);
        res.status(500).send('An error occurred while loading the post');
    }
});

router.get('/viewpost', async (req, res) => {
    try {
        const mostRecentPostId = await Post.getMostRecentPost();
        if (mostRecentPostId) {
            res.redirect(`/post/${mostRecentPostId}`);
        } else {
            res.status(404).send('No posts found');
        }
    } catch (error) {
        console.error('Error fetching most recent post:', error);
        res.status(500).send('Server error');
    }
});

router.post('/:id/like', isAuthenticated, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.session.user.id;
        await Post.addLike(postId, userId);
        const likesCount = await Post.getLikesCount(postId);
        res.json({ success: true, likes: likesCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error liking post' });
    }
});

router.post('/:id/unlike', isAuthenticated, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.session.user.id;
        await Post.removeLike(postId, userId);
        const likesCount = await Post.getLikesCount(postId);
        res.json({ success: true, likes: likesCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error unliking post' });
    }
});

router.post('/:id/comment', isAuthenticated, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.session.user.id;
        const { content } = req.body;
        const commentId = await Post.addComment(postId, userId, content);
        const comments = await Post.getComments(postId);
        res.json({ success: true, comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error adding comment' });
    }
});

router.get('/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        const comments = await Post.getComments(postId);
        res.json({ success: true, comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching comments' });
    }
});



router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.session.user.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send('Post not found');
        }

        if (post.user_id !== userId) {
            return res.status(403).send('You do not have permission to delete this post');
        }

        await Post.deletePost(postId, userId);

        res.redirect('/'); // Redirect to home page after successful deletion
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('An error occurred while deleting the post');
    }
});



module.exports = router;