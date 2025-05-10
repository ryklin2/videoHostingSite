const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const { validateRegistration } = require('../middleware/validation');

router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await User.create(username, email, password);
        req.session.userId = user.id;
        req.session.user = {
            id: user.id,
            username: user.username
        };
        console.log('User registered and logged in:', req.session.user);
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.render('register', { error: 'Username or email already exists' });
        }
        res.status(500).send('Error registering new user');
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        console.log('Login attempt for username:', username);
        const user = await User.findByUsername(username);
        if (user) {
            const { password: storedPassword, ...userWithoutPassword } = user;
            console.log('User found:', userWithoutPassword);
            console.log('Stored hashed password:', storedPassword);
            console.log('Provided password:', password);
            const match = await bcrypt.compare(password, storedPassword);
            console.log('Password match:', match);
            if (match) {
                req.session.userId = user.id;
                req.session.user = {
                    id: user.id,
                    username: user.username
                };
                console.log('Login successful. Session:', req.session);
                return res.redirect('/');
            }
        } else {
            console.log('User not found');
        }
        console.log('Login failed');
        res.render('login', { error: 'Invalid username or password' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Server error');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }
        res.clearCookie('session_cookie_name');
        res.redirect('/');
    });
});

module.exports = router;