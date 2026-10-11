const express = require('express');
const router = express.Router();
const {
  getActiveCategories,
  getAllCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/auth');

// Public route to get active categories
router.get('/', getActiveCategories);

// Admin category management routes
router.get('/admin/all', protect, adminOnly, getAllCategoriesAdmin);
router.post('/admin', protect, adminOnly, createCategoryAdmin);
router.put('/admin/:id', protect, adminOnly, updateCategoryAdmin);
router.delete('/admin/:id', protect, adminOnly, deleteCategoryAdmin);

module.exports = router;
