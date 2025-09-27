const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const adminCategoryController = require('../controllers/adminCategoryController');

// All routes in this router require admin authentication
router.use(authenticateAdmin);

// POST /api/admin/categories - Create a new category
router.post('/', adminCategoryController.createCategory);

// PUT /api/admin/categories/:categoryId - Update an existing category
router.put('/:categoryId', adminCategoryController.updateCategory);

// GET /api/admin/categories/:categoryId - Get a specific category
router.get('/:categoryId', adminCategoryController.getCategory);

// GET /api/admin/categories - Get all categories
router.get('/', adminCategoryController.getAllCategories);

// DELETE /api/admin/categories/:categoryId - Delete a category
router.delete('/:categoryId', adminCategoryController.deleteCategory);

// GET /api/admin/categories/:categoryId/stats - Get category statistics
router.get('/:categoryId/stats', adminCategoryController.getCategoryStats);

// GET /api/admin/categories/:categoryId/templates - Get active templates for a category
router.get('/:categoryId/templates', adminCategoryController.getCategoryTemplates);

module.exports = router;
