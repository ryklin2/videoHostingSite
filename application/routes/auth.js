const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validateRegistration } = require('../middleware/validation');

const GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
let googleCertCache = { expiresAt: 0, keys: [] };

function googleCallbackUrl(req) {
    return process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/auth/google/callback`;
}

function renderLoginError(res, error) {
    return res.status(400).render('login', { title: 'Login', error });
}

async function getGoogleKeys() {
    if (googleCertCache.expiresAt > Date.now()) return googleCertCache.keys;
    const response = await fetch(GOOGLE_CERTS_URL);
    if (!response.ok) throw new Error('Unable to retrieve Google signing keys.');
    const keys = await response.json();
    googleCertCache = { keys, expiresAt: Date.now() + 60 * 60 * 1000 };
    return keys;
}

async function verifyGoogleIdToken(idToken) {
    const [encodedHeader, encodedPayload, signature] = idToken.split('.');
    if (!encodedHeader || !encodedPayload || !signature) throw new Error('Malformed Google ID token.');
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (header.alg !== 'RS256' || !header.kid) throw new Error('Unexpected Google ID token signature.');
    const keys = await getGoogleKeys();
    const key = keys.find((candidate) => candidate.kid === header.kid);
    if (!key || !crypto.verify('RSA-SHA256', Buffer.from(`${encodedHeader}.${encodedPayload}`), crypto.createPublicKey({ key, format: 'jwk' }), Buffer.from(signature, 'base64url'))) {
        throw new Error('Invalid Google ID token signature.');
    }
    const now = Math.floor(Date.now() / 1000);
    const validIssuer = payload.iss === 'https://accounts.google.com' || payload.iss === 'accounts.google.com';
    if (!validIssuer || payload.aud !== process.env.GOOGLE_CLIENT_ID || payload.exp <= now || !payload.sub || !payload.email || payload.email_verified !== true) {
        throw new Error('Google ID token claims could not be verified.');
    }
    return payload;
}

router.get('/google', (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return renderLoginError(res, 'Google sign-in is not configured yet.');
    }
    const state = crypto.randomBytes(32).toString('hex');
    req.session.googleOAuthState = state;
    req.session.save((sessionError) => {
        if (sessionError) return res.status(500).send('Unable to start Google sign-in.');
        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: googleCallbackUrl(req),
            response_type: 'code',
            scope: 'openid email profile',
            state,
            prompt: 'select_account'
        });
        return res.redirect(`${GOOGLE_AUTHORIZATION_URL}?${params}`);
    });
});

router.get('/google/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const expectedState = req.session.googleOAuthState;
    delete req.session.googleOAuthState;
    if (error) return renderLoginError(res, 'Google sign-in was cancelled or denied.');
    if (!code || !state || !expectedState || state.length !== expectedState.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) {
        return renderLoginError(res, 'Invalid Google sign-in request. Please try again.');
    }
    try {
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: googleCallbackUrl(req), grant_type: 'authorization_code' })
        });
        if (!tokenResponse.ok) throw new Error('Google rejected the authorization code.');
        const { id_token: idToken } = await tokenResponse.json();
        const profile = await verifyGoogleIdToken(idToken);
        const user = await User.findOrCreateGoogleUser({ googleId: profile.sub, email: profile.email, displayName: profile.name });
        req.session.userId = user.id;
        req.session.user = { id: user.id, username: user.username };
        return req.session.save((sessionError) => sessionError ? res.status(500).send('Unable to complete Google sign-in.') : res.redirect('/'));
    } catch (callbackError) {
        console.error('Google OAuth callback failed:', callbackError.message);
        return renderLoginError(res, 'Google sign-in failed. Please try again.');
    }
});

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
        if (user && user.password) {
            const { password: storedPassword, ...userWithoutPassword } = user;
            console.log('User found:', userWithoutPassword);
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
