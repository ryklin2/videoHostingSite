const User = require('../models/user');

const isAuthenticated = async (req, res, next) => {
  console.log('Session:', req.session);
  console.log('Headers:', req.headers);
  
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        // Don't store the whole user object in the session
        req.user = user;
        req.session.user = { id: user.id, username: user.username };
        res.locals.user = req.session.user; // Make user available to templates
        return next();
      } else {
        // User not found in database, clear the session
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
          res.redirect('/login');
        });
      }
    } catch (error) {
      console.error('Error in authentication middleware:', error);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    // No userId in session, redirect to login
    res.redirect('/login');
  }
};

module.exports = { isAuthenticated };