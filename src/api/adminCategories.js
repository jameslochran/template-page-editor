const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const adminTemplateController = require('../controllers/adminTemplateController');

// All routes in this router require admin authentication
router.use(authenticateAdmin);

// GET /api/admin/categories - Get all categories
router.get('/', adminTemplateController.getAllCategories);

module.exports = router;
