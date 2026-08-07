const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const Message = require('../models/message');
const User = require('../models/user');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();
const messageUploadDir = path.join(__dirname, '..', 'private-uploads', 'messages');
fs.mkdirSync(messageUploadDir, { recursive: true });

const allowedMediaTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']);
const upload = multer({
  storage: multer.diskStorage({
    destination: messageUploadDir,
    filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, allowedMediaTypes.has(file.mimetype))
});

function isPositiveId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const conversations = await Message.getConversationsForUser(req.session.userId);
    res.render('messages', { title: 'Messages', conversations, user: req.session.user });
  } catch (error) {
    next(error);
  }
});

router.post('/conversations', isAuthenticated, async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const recipient = await User.findByUsername(username);
    if (!recipient) return res.status(404).render('messages', { title: 'Messages', conversations: await Message.getConversationsForUser(req.session.userId), error: 'User not found.' });
    if (recipient.id === req.session.userId) return res.status(400).render('messages', { title: 'Messages', conversations: await Message.getConversationsForUser(req.session.userId), error: 'You cannot message yourself.' });
    const conversationId = await Message.createConversation(req.session.userId, recipient.id);
    return res.redirect(`/messages/${conversationId}`);
  } catch (error) {
    next(error);
  }
});

router.get('/media/:messageId', isAuthenticated, async (req, res, next) => {
  try {
    if (!isPositiveId(req.params.messageId)) return res.sendStatus(404);
    const media = await Message.getMediaForUser(req.params.messageId, req.session.userId);
    if (!media) return res.sendStatus(404);
    res.type(media.media_mime_type);
    return res.sendFile(path.join(messageUploadDir, media.media_filename));
  } catch (error) {
    next(error);
  }
});

router.get('/:conversationId', isAuthenticated, async (req, res, next) => {
  try {
    if (!isPositiveId(req.params.conversationId)) return res.sendStatus(404);
    const conversation = await Message.findConversationForUser(req.params.conversationId, req.session.userId);
    if (!conversation) return res.sendStatus(404);
    const [conversations, messages] = await Promise.all([Message.getConversationsForUser(req.session.userId), Message.getMessages(conversation.id)]);
    return res.render('messages', { title: 'Messages', user: req.session.user, conversations, conversation, messages });
  } catch (error) {
    next(error);
  }
});

router.post('/:conversationId', isAuthenticated, upload.single('media'), async (req, res, next) => {
  try {
    if (!isPositiveId(req.params.conversationId)) return res.sendStatus(404);
    const conversation = await Message.findConversationForUser(req.params.conversationId, req.session.userId);
    if (!conversation) return res.sendStatus(404);
    const body = (req.body.body || '').trim();
    if (!body && !req.file) return res.status(400).send('A message or media attachment is required.');
    if (body.length > 2000) return res.status(400).send('Messages cannot exceed 2,000 characters.');
    await Message.createMessage({ conversationId: conversation.id, senderId: req.session.userId, body, mediaFilename: req.file && req.file.filename, mediaMimeType: req.file && req.file.mimetype });
    return res.redirect(`/messages/${conversation.id}`);
  } catch (error) {
    next(error);
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message === 'File type not allowed') return res.status(400).send('Please attach an image or video no larger than 25 MB.');
  return next(error);
});

module.exports = router;
