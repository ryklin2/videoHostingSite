const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Post = require('../models/post');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const userPosts = await Post.findByUserId(req.session.userId);
        const likedPosts = await Post.getLikedPosts(req.session.userId);
        
        res.render('profile', {
            title: 'User Profile',
            user: user,
            userPosts: userPosts,
            likedPosts: likedPosts
        });
    } catch (error) {
        console.error('Error in profile route:', error);
        res.status(500).send('An error occurred while loading the profile');
    }
});

module.exports = router;