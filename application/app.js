const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise'); 
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();
const dbConfig = require('./config/database');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const searchRoutes = require('./routes/search');
const { isAuthenticated } = require('./middleware/auth');
const profileRoutes = require('./routes/profile');
const helpers = require('./helpers/handlebars-helpers');
const Post = require('./models/post'); // Add this line

const app = express();

const env = process.env.NODE_ENV || 'development';
const pool = mysql.createPool(dbConfig[env]);

// Set up Handlebars
const hbs = exphbs.create({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: {
    ...helpers, // Spread your existing helpers
    eq: function (a, b) {
      return a === b;
    }
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Specifically serve the uploads directory with correct MIME types
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  setHeaders: (res, filepath) => {
      if (path.extname(filepath) === '.webm') {
          res.setHeader('Content-Type', 'video/webm');
      }
  }
}));

// Specific middleware for CSS files
app.use('/css', express.static(path.join(__dirname, 'public/css'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Session setup
const sessionStore = new MySQLStore({}, pool);

app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: false
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  console.log('Session:', req.session);
  console.log('User:', req.session.user);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/post', postRoutes);
app.use('/profile', profileRoutes);
app.use('/search', searchRoutes);



app.get('/', async (req, res) => {
  try {
      const posts = await Post.getGalleryPosts();
      res.render('home', { 
          title: 'Home', 
          user: req.session.user,
          posts: posts
      });
  } catch (error) {
      console.error('Error fetching gallery posts:', error);
      res.status(500).send('Error loading the gallery');
  }
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.get('/registration', (req, res) => {
  res.render('registration', { title: 'Registration' });
});

app.get('/postvideo', isAuthenticated, (req, res) => {
  res.render('postvideo', { title: 'Post a New Video' });
});

app.get('/viewpost/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comments = await Post.getComments(req.params.id);
    res.render('viewpost', { 
      title: 'View Post', 
      user: req.session.user,
      post: post,
      comments: comments
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 route
app.use((req, res, next) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

app.get('/test-search', (req, res) => {
  res.redirect('/post/search?query=test');
});

module.exports = app;