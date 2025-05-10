const express = require('express');
const router = express.Router();
const Post = require('../models/post');

router.get('/', async (req, res) => {
    try {
        console.log('Search route accessed');
        const { query } = req.query;
        console.log('Search query:', query);

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        console.log('Page:', page);
        console.log('Limit:', limit);
        console.log('Offset:', offset);

        if (!query) {
            console.log('No query provided, redirecting to home');
            return res.redirect('/');
        }

        const posts = await Post.searchPosts(query, limit, offset);
        console.log('Search completed, posts found:', posts.length);

        const totalPosts = await Post.countSearchResults(query);
        console.log('Total posts matching query:', totalPosts);

        const totalPages = Math.ceil(totalPosts / limit);

        if (posts.length === 0) {
            console.log('No posts found, rendering search template with message');
            return res.render('search', {
                title: `Search Results for "${query}"`,
                user: req.session.user,
                query: query,
                message: 'No posts found.'
            });
        }

        console.log('Rendering search template with results');
        res.render('search', {
            title: `Search Results for "${query}"`,
            user: req.session.user,
            posts: posts,
            query: query,
            currentPage: page,
            totalPages: totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null
        });
    } catch (error) {
        console.error('Error in search route:', error);
        res.status(500).render('error', { message: 'An error occurred while searching' });
    }
});

module.exports = router;