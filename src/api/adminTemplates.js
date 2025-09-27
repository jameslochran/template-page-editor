const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const adminTemplateController = require('../controllers/adminTemplateController');

// All routes in this router require admin authentication
router.use(authenticateAdmin);

// POST /api/admin/templates - Create a new template
router.post('/', adminTemplateController.createTemplate);

// PUT /api/admin/templates/:templateId - Update an existing template
router.put('/:templateId', adminTemplateController.updateTemplate);

// GET /api/admin/templates/:templateId - Get a specific template
router.get('/:templateId', adminTemplateController.getTemplate);

// GET /api/admin/templates - Get all templates
router.get('/', adminTemplateController.getAllTemplates);

// DELETE /api/admin/templates/:templateId - Delete a template
router.delete('/:templateId', adminTemplateController.deleteTemplate);

module.exports = router;