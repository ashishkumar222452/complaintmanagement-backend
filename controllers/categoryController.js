const {
  getCategories,
  findCategoryByName,
  findCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../services/dataService');

// @desc    Get active categories for complaint filing
// @route   GET /api/categories
// @access  Public
const getActiveCategories = async (req, res, next) => {
  try {
    const categories = await getCategories({ isActive: true });
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories for administration
// @route   GET /api/categories/admin/all
// @access  Private (Admin)
const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const categories = await getCategories({});
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories/admin
// @access  Private (Admin)
const createCategoryAdmin = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const existing = await findCategoryByName(name.trim());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await createCategory({
      name: name.trim(),
      description: description ? description.trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/admin/:id
// @access  Private (Admin)
const updateCategoryAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const existing = await findCategoryById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await updateCategory(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/admin/:id
// @access  Private (Admin)
const deleteCategoryAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await findCategoryById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await deleteCategory(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveCategories,
  getAllCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin
};
