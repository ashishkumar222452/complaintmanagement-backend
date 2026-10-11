const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getMyComplaints,
  getComplaintDetails,
  trackComplaintPublic,
  getAllComplaintsAdmin,
  updateComplaintStatusAdmin,
  deleteComplaintAdmin,
  getStatsAdmin
} = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route for quick tracking
router.get('/track/:complaintId', trackComplaintPublic);

// Admin-specific routes
router.get('/admin/stats', protect, adminOnly, getStatsAdmin);
router.get('/admin/all', protect, adminOnly, getAllComplaintsAdmin);
router.put('/admin/:id/status', protect, adminOnly, updateComplaintStatusAdmin);
router.delete('/admin/:id', protect, adminOnly, deleteComplaintAdmin);

// User complaints routes
router.post('/', protect, upload.single('image'), submitComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/:id', protect, getComplaintDetails);

module.exports = router;
