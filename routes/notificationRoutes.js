const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markRead,
  markAllRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMyNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);

module.exports = router;
